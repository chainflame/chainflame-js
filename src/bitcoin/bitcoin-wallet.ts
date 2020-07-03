import SocketManager from "../networking/socket-manager"
import { MessageTypes } from "../networking/message-types"
import Keygen from "../util/keygen"
import { Chain } from "../util/chains"
import { BitcoinAddress } from "../util/bitcoin/address"
import { Keyring } from '../util/bitcoin/keyring'
import { TransactionBuilder } from "./transaction-builder"
import NodeService from '../networking/node-service'

export default class Bitcoin {

    private readonly socketManager: SocketManager
    private readonly chain: Chain
    private readonly apiKey: string
    private keyrings: Keyring[] = []

    public confirmationCount = 6
    public useSatoshis = false

    constructor(apiKey: string, chain: Chain) {
        this.apiKey = apiKey
        this.chain = chain
        this.socketManager = new SocketManager(apiKey)
    }

    public setWallet(password: string) {
        this.keyrings = []
        const keyring = Keygen.getKeyring(this.chain, password, 0) // TODO: Need a solution to the key index piece
        if (keyring) this.keyrings.push(keyring)
    }

    // Need to do something with balances
    public getAddress(addressType: BitcoinAddress = BitcoinAddress.PayToPublicKeyHash) {

        if (!this.keyrings) {
            throw {
                message: 'No wallet found.'
            }
        }

        const addresses = this.keyrings[0].addresses // TODO: Need a solution to the key index piece
        switch (addressType) {
            case BitcoinAddress.PayToPublicKeyHash: return addresses.p2pkh
            case BitcoinAddress.PayToScriptHash: return addresses.p2sh
            case BitcoinAddress.PayToWitnessKeyHash: return addresses.p2wpkh
        }

    }

    private getAllAddresses() {

        if (!this.keyrings) {
            throw {
                message: 'No wallet found.'
            }
        }

        // Gather all the addresses
        const addresses: string[] = []
        this.keyrings.forEach(keyring => {
            addresses.push(keyring.addresses.p2pkh)
            addresses.push(keyring.addresses.p2sh)
            addresses.push(keyring.addresses.p2wpkh)
        })

        return addresses
    }

    public async addWalletListener(onWalletUpdate: (wallet: any) => void) {

        // Connect the socket
        await this.socketManager.connect()

        // List to the payments
        this.socketManager.addMessageListener(
            MessageTypes.Payments,
            onWalletUpdate
        )

        // Tell the listener what to listen to
        this.updatePaymentListener(
            this.chain, 
            this.getAllAddresses(), 
            this.useSatoshis, 
            this.confirmationCount
        )
        
    }

    public removeTransactionListener() {
        this.socketManager.close()
    }

    // Updates the payment listener for this socket
    // These are the payments that happen on the blockchain
    private updatePaymentListener(chain: string, addresses: string[], inSatoshis: boolean, confirmations: number = 6) {
        this.socketManager.send({
            type: MessageTypes.Payments,
            uuid: 'some-uuid',
            chain: chain,
            addresses: addresses,
            inSatoshis: inSatoshis,
            confirmations: confirmations,
        })
    }

    // Creates and sends a bitcoin transaction on the blockchain
    public async send(amount: number, fee: number, toAddress: string, message?: string, changeAddress?: string, confirmations: number = 6) {

        if (!this.keyrings) {
            throw {
                message: 'No wallet found.'
            }
        }

        // Ensure the amounts and address are safe
        const txHex = await TransactionBuilder.build(
            this.apiKey,
            this.chain,  
            this.keyrings, 
            amount, 
            fee, 
            toAddress,
            changeAddress ?? this.getAddress(), 
            confirmations,
            message
        )

        console.log(txHex)

        return NodeService.broadcastTx(this.chain, this.apiKey, txHex)
    }

}