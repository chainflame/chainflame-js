import * as bitcoinlib from 'bitcoinjs-lib'
import { BitcoinAddress } from '../util/bitcoin/address'
import { Chain } from '../util/chains'
import { ValueUtils } from '../util/bitcoin/value-utils'
import NodeService from '../networking/node-service'
import * as validator from 'bitcoin-address-validation'
import { Network } from 'bitcoinjs-lib'

export class TransactionBuilder {

    public static async build(apiKey: string, chain: Chain, keyrings: any[], valueInSats: number, feeInSats: number, toAddress: string, changeAddress: string, confirmations: number, message?: string) {

        // Ensure the amounts and address are safe
        const network = this.getNetwork(chain)
        const invoice = this.getInvoice(valueInSats, feeInSats)

        console.log(invoice)

        // Create the inputs
        const inputs = await this.getInputs(apiKey, chain, network, keyrings, invoice.total, confirmations)
        const change = this.getChangeAmount(inputs, invoice.total)
        const outputs = await this.getOutputs(invoice.amount, toAddress, change, changeAddress)

        console.log(inputs)
        console.log(change)
        console.log(outputs)

        // Create a hex for the inputs and outputs then push it
        return await this.createTransaction(apiKey, chain, network, inputs, outputs, message || null)

    }

    private static getNetwork(chain: Chain) {
        switch (chain) {
            case Chain.Bitcoin: return bitcoinlib.networks.bitcoin
            case Chain.BitcoinTestnet: return bitcoinlib.networks.testnet
            case Chain.BitcoinRegtest: return bitcoinlib.networks.regtest
        }
    }

    private static getPayment(
        addressType: BitcoinAddress, 
        privateKey: any, 
        network: bitcoinlib.Network): bitcoinlib.Payment {

        const publicKey = privateKey.publicKey

        switch (addressType) {
            case BitcoinAddress.PayToPublicKeyHash: {
                return bitcoinlib.payments.p2wpkh({ pubkey: publicKey, network: network })
            }
            case BitcoinAddress.PayToScriptHash: {
                const p2wpkh = bitcoinlib.payments.p2wpkh({ pubkey: publicKey, network: network })
                return bitcoinlib.payments.p2sh({ redeem: p2wpkh, network: network })
            }
            default: {
                return bitcoinlib.payments.p2pkh({ pubkey: publicKey, network: network })
            }
        }
    }

    // Gets all the unspent amounts for the address supplied
    private static async getInputs(apiKey: string, chain: Chain, network: Network, keyrings: any[], amount: number, confirmations: number) {

        // Get some addresses for the keyring
        const addresses: string[] = []
        keyrings.forEach(keyring => {
            addresses.push(keyring.addresses.p2pkh)
            addresses.push(keyring.addresses.p2sh)
            addresses.push(keyring.addresses.p2wpkh)
        })

        // Find utxos for those addresses
        const utxos = await NodeService.getUtxos(chain, apiKey, addresses, amount, confirmations)

        // Ensure the user has enough utxos to spend
        if (!utxos || !utxos.length) {
            throw {
                message: 'Not enough confirmed funds'
            }
        }

        const inputs = utxos.map((utxo: any) => {

            // Get the matching keyring
            const keyringForUtxos = keyrings.filter(keyring => {
                return utxo.address === keyring.addresses.p2pkh || 
                    utxo.address === keyring.addresses.p2sh ||
                    utxo.address === keyring.addresses.p2wpkh
            })[0]

            // Get the ECPair from key
            const privateKey = bitcoinlib.ECPair.fromWIF(
                keyringForUtxos.keypair.privateKey, 
                network
            )

            return {
                output: utxo,
                privateKey: privateKey
            }

        })

        return inputs

    }

    private static getChangeAmount(inputs: any[], total: number) {

        // Get the current total
        let inputTotal = 0
        inputs.forEach(input => {
            inputTotal += input!.output.value
        })

        // Ensure user has enough funds to send
        if (inputTotal < total) {
            throw {
                serverCode: 400,
                message: 'Not enough funds'
            }
        }

        const changeAmount = inputTotal - total
        return changeAmount
    }

    // Builds the outputs
    private static async getOutputs(satsAmount: number, receivingAddress: string, satsChange: number, changeAddress: string) {

        const outputs = [{
            address: receivingAddress,
            value: satsAmount
        }]

        // If change is possible, reuse an old address for it
        if (satsChange > 0) {
            outputs.push({
                address: changeAddress,
                value: satsChange
            })
        }

        return outputs
    }

    // Creates a transaction with the inputs provided
    // Will get all proper inputs types etc
    private static async createTransaction(apiKey: string, chain: Chain, network: Network, inputs: any[], outputs: any[], message: string | null) {

        const tx = new bitcoinlib.Psbt({ network: network })
        tx.setVersion(2)

        const inputBuilders = inputs.map(data => {
            const input = data!.output
            const privateKey = data!.privateKey
            const address = input.address
            const txid = input.txid
            const index = input.index
            const value = input.value
            const type = (validator.default(address) as any).type // TODO this is strange
            const payment = this.getPayment(type, privateKey, network)
            const script = bitcoinlib.address.toOutputScript(address, network)
            return this.createInput(
                apiKey,
                chain,
                privateKey,
                txid,
                index,
                script,
                value,
                type,
                payment)
        })

        // Add the inputs to the transaction
        const builtInputs = await Promise.all(inputBuilders)
        builtInputs.forEach(data => tx.addInput(data.input))

        // Add the outputs to the transaction
        outputs.forEach(output => tx.addOutput(output))

        // Attach message if needed
        if (message) {
            const note = Buffer.from(message)
            const embed = bitcoinlib.payments.embed({ data: [note] })
            tx.addOutput({
                script: embed.output!,
                value: 0,
            })
        }

        // Sign the inputs
        builtInputs.forEach((data, i) => tx.signInput(i, data.privateKey))

        // Generate the raw hex
        const txHex = tx
            .finalizeAllInputs()
            .extractTransaction()
            .toHex()

        return txHex
    }

    private static getInvoice(amount: number, fee: number) {
        return {
            amount: amount,
            fee: fee,
            total: amount + fee
        }
    }

    // Creates an unsigned input
    private static async createInput(
        apiKey: string,
        chain: Chain,
        privateKey: any, 
        txid: string, 
        index: number, 
        script: Buffer, 
        amount: number, 
        type: string, 
        payment: any) {

        const utxo: any = {}
        const redeem: any = {}

        switch (type) {
            case 'p2wsh': {
                const tx = await NodeService.getTx(chain, apiKey, txid)
                utxo.nonWitnessUtxo = Buffer.from(tx.hex, 'hex')
                redeem.redeemScript = payment.redeem.output
                break
            }
            case 'p2wpkh': {
                utxo.witnessUtxo = {
                    script: script,
                    value: amount
                }
                break
            }
            case 'p2sh': {
                utxo.witnessUtxo = {
                    script: script,
                    value: amount
                }
                redeem.redeemScript = payment.redeem.output
                break
            }
            case 'p2pkh': {
                const tx = await NodeService.getTx(chain, apiKey, txid)
                utxo.nonWitnessUtxo = Buffer.from(tx.hex, 'hex')
                break
            }
        }

        return {
            privateKey: privateKey,
            input: {
                hash: txid,
                index: index,
                ...utxo,
                ...redeem
            }
        }
    }

}