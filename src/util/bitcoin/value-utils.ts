import * as converter from 'satoshi-bitcoin-ts'
import Extensions from '../extensions'

export class ValueUtils {

    static toSats(amount: number): number {
        const sats = converter.toSatoshi(amount)
        return Extensions.cleanNumber(sats, 0)
    }

    static toBitcoin(amount: number): number {
        const value = Extensions.cleanNumber(amount, 0)
        return converter.toBitcoin(value)
    }

}