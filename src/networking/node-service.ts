import fetch from 'node-fetch'
import ResponseUtils from '../util/response-utils'
import { SERVICE_URL } from '../util/constants'

export default class NodeRepository {

    // Grabs the unspent transaction outputs for the given addresses
    // and returning as close as possible to the amount
    // This will only work with bitcoin related blockchains
    public static async getUtxos(chain: string, apiKey: string, addresses: string[], amount: number, confirmations: number): Promise<any> {
        return new Promise((resolve, reject) => {
            fetch(`${SERVICE_URL}/utxos?chain=${chain}&addresses=${addresses}&amount=${amount}&confirmations=${confirmations}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            })
            .then(res => ResponseUtils.parse(res))
            .then(json => resolve(json))
            .catch(error => reject(error))
        })
    }

    // Gets the tx by txid from the node
    public static async getTx(chain: string, apiKey: string, txid: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fetch(`${SERVICE_URL}/tx?chain=${chain}&txid=${txid}`, {
                method: 'get',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            })
            .then(res => ResponseUtils.parse(res))
            .then(json => resolve(json))
            .catch(error => reject(error))
        })
    }

    // Broadcasts the transaction to the blockchain
    public static async broadcastTx(chain: string, apiKey: string, txHex: string): Promise<any> {

        const body = {
            chain: chain,
            txHex: txHex
        }

        return new Promise((resolve, reject) => {
            fetch(`${SERVICE_URL}/broadcast-tx`, {
                method: 'post',
                body:    JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            })
            .then(res => ResponseUtils.parse(res))
            .then(json => resolve(json))
            .catch(error => reject(error))
        })
    }

}