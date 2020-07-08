import SocketManager from "../networking/socket-manager"
import { MessageTypes } from "../networking/message-types"
import Keygen from "../util/keygen"
import { Chain } from "../util/chains"
import { BitcoinAddress } from "../util/bitcoin/address"
import { Keyring } from '../util/bitcoin/keyring'
import { TransactionBuilder } from "./transaction-builder"
import NodeService from '../networking/node-service'
import { ValueUtils } from "../util/bitcoin/value-utils"

export default class BitcoinAccount {

    private readonly socketManager: SocketManager
    private readonly chain: Chain
    private readonly apiKey: string
    private keyrings: Keyring[] = []

    private accountSatoshis = false
    private accountConfirmations = 6
    private accountOffset: number = 0
    private accountLimit: number | null = null
    private accountOrder: string = 'desc'

    constructor(apiKey: string, chain: Chain) {
        this.apiKey = apiKey
        this.chain = chain
        this.socketManager = new SocketManager(apiKey)
    }

    public setAccount(password: string) {
        this.keyrings = []
        const keyring = Keygen.getKeyring(this.chain, password, 0) // TODO: Need a solution to the key index piece
        if (keyring) this.keyrings.push(keyring)
    }

    // Need to do something with balances
    public getAddress(addressType: BitcoinAddress = BitcoinAddress.PayToPublicKeyHash) {

        if (!this.keyrings) {
            throw {
                message: 'No account found.'
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
                message: 'No account found.'
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

    // -- Modifiers on the listener

    public offset(offset: number): BitcoinAccount {
        this.accountOffset = offset
        return this
    }

    public limit(limit: number | null): BitcoinAccount {
        this.accountLimit = limit
        return this
    }

    public satoshis(satoshis: boolean): BitcoinAccount {
        this.accountSatoshis = satoshis
        return this
    }

    public confirmations(confirmations: number): BitcoinAccount {
        this.accountConfirmations = confirmations
        return this
    }

    public order(order: string): BitcoinAccount {
        this.accountOrder = order
        return this
    }

    // -- Fetching

    public async addAccountListener(onAccountUpdate: (account: any) => void) {

        // Connect the socket
        await this.socketManager.connect()

        // List to the payments
        this.socketManager.addMessageListener(
            MessageTypes.Payments,
            onAccountUpdate
        )

        // Tell the listener what to listen to
        this.updatePaymentListener(
            this.chain, 
            this.getAllAddresses(), 
            this.accountSatoshis,
            this.accountOffset,
            this.accountLimit,
            this.accountConfirmations,
            this.accountOrder
        )
        
    }

    public async removeTransactionListener() {
        return await this.socketManager.close()
    }

    public async getAccount() {
        return NodeService.getAccount(
            this.chain, 
            this.apiKey,
            this.getAllAddresses(), 
            this.accountSatoshis,
            this.accountOffset,
            this.accountLimit,
            this.accountConfirmations,
            this.accountOrder
        )
    }

    // Updates the payment listener for this socket
    // These are the payments that happen on the blockchain
    private updatePaymentListener(chain: string, addresses: string[], satoshis: boolean, offset: number, limit: number | null, confirmations: number, order: string) {
        this.socketManager.send({
            type: MessageTypes.Payments,
            chain: chain,
            addresses: addresses,
            satoshis: satoshis,
            offset: offset,
            limit: limit,
            confirmations: confirmations,
            order: order
        })
    }

    public async buildTransaction(amount: number, fee: number, toAddress: string, message?: string, changeAddress?: string) {

        if (!this.keyrings) {
            throw {
                message: 'No account found.'
            }
        }

        if (this.accountSatoshis && !Number.isInteger(amount)) {
            throw {
                message: 'Amount is not in satoshis.'
            }
        }

        if (this.accountSatoshis && !Number.isInteger(fee)) {
            throw {
                message: 'Fee is not in satoshis.'
            }
        }

        // Returns the hex of the raw transaction
        // If wanted, this could be used to broadcast
        // to another raw hex broadcaster
        return TransactionBuilder.build(
            this.apiKey,
            this.chain,  
            this.keyrings, 
            this.accountSatoshis ? amount : ValueUtils.toSats(amount), 
            this.accountSatoshis ? fee : ValueUtils.toSats(fee), 
            toAddress,
            changeAddress ?? this.getAddress(), 
            this.accountConfirmations,
            message
        )

    }

    // Builds and sends a bitcoin transaction on the blockchain
    public async send(amount: number, fee: number, toAddress: string, message?: string, changeAddress?: string) {
        const txHex = await this.buildTransaction(amount, fee, toAddress, message, changeAddress)
        return NodeService.broadcastTx(this.chain, this.apiKey, txHex)
    }

}