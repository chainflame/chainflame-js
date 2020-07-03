import Bitcoin from './bitcoin/bitcoin-wallet'
import Wallet from './wallet/wallet'
import { Chain, getAllChains } from './util/chains'

export default class ChainFlame {

    private readonly apiKey: string
    private wallet: Wallet | null = null

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    public getCurrentWallet(): Wallet | null {
        return this.wallet
    }

    public openWallet(password: string, chains: Chain[] = getAllChains()): Wallet {
        this.wallet = new Wallet(this.apiKey)
        this.wallet.openWalletsForChains(password, chains)
        return this.wallet
    }

    public logout() {
        if (this.wallet) {
            this.wallet.closeWallets()
            this.wallet = null
        }
    }

}