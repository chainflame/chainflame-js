import BitcoinAccount from '../bitcoin/bitcoin-account'
import { Chain, getAllChains } from '../util/chains'

export default class Account {

    readonly bitcoin: BitcoinAccount
    readonly bitcoinTestnet: BitcoinAccount
    readonly bitcoinRegtest: BitcoinAccount

    constructor(apiKey: string) {
        this.bitcoin = new BitcoinAccount(apiKey, Chain.Bitcoin)
        this.bitcoinTestnet = new BitcoinAccount(apiKey, Chain.BitcoinTestnet)
        this.bitcoinRegtest = new BitcoinAccount(apiKey, Chain.BitcoinRegtest)
    }

    public openAccountForChains(password: string, chains: Chain[]) {
        return chains.map(chain => {
            switch (chain) {
                case Chain.Bitcoin: {
                    return this.bitcoin.setAccount(password)
                }
                case Chain.BitcoinTestnet: {
                    return this.bitcoinTestnet.setAccount(password)
                }
                case Chain.BitcoinRegtest: {
                    return this.bitcoinRegtest.setAccount(password)
                }
                default: {
                    return null
                }
            }
        })
    }

    public async closeAccounts() {
        const accounts = [this.bitcoin, this.bitcoinTestnet, this.bitcoinRegtest]
        const closes = accounts.map(account => account.removeTransactionListener())
        return await Promise.all(closes)
    }

}