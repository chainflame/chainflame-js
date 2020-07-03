import BitcoinWallet from '../bitcoin/bitcoin-wallet'
import { Chain, getAllChains } from '../util/chains'

export default class Wallet {

    readonly bitcoin: BitcoinWallet
    readonly bitcoinTestnet: BitcoinWallet
    readonly bitcoinRegtest: BitcoinWallet

    constructor(apiKey: string) {
        this.bitcoin = new BitcoinWallet(apiKey, Chain.Bitcoin)
        this.bitcoinTestnet = new BitcoinWallet(apiKey, Chain.BitcoinTestnet)
        this.bitcoinRegtest = new BitcoinWallet(apiKey, Chain.BitcoinRegtest)
    }

    public openWalletsForChains(password: string, chains: Chain[]) {
        return chains.map(chain => {
            switch (chain) {
                case Chain.Bitcoin: {
                    return this.bitcoin.setWallet(password)
                }
                case Chain.BitcoinTestnet: {
                    return this.bitcoinTestnet.setWallet(password)
                }
                case Chain.BitcoinRegtest: {
                    return this.bitcoinRegtest.setWallet(password)
                }
                default: {
                    return null
                }
            }
        })
    }

    public closeWallets() {
        const wallets = [this.bitcoin, this.bitcoinTestnet, this.bitcoinRegtest]
        wallets.forEach(wallet => wallet.removeTransactionListener())
    }

}