import BitcoinAccount from './bitcoin/bitcoin-account'
import Account from './account/account'
import { Chain, getAllChains } from './util/chains'

export default class ChainFlame {

    private readonly apiKey: string
    private account: Account | null = null
    private onAccountChange: ((account: Account | null) => void) | null = null

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    public getCurrentAccount(): Account | null {
        return this.account
    }

    public getAccount(password: string, chains: Chain[] = getAllChains()): Account {
        this.account = new Account(this.apiKey)
        this.account.openAccountForChains(password, chains)

        // Call the account listener if needed
        if (this.onAccountChange) {
            this.onAccountChange(this.account)
        }

        return this.account
    }

    public addAccountChangeListener(onAccountChange: (account: Account | null) => void) {
        this.onAccountChange = onAccountChange
    }

    public removeAccountChangeListener() {
        this.onAccountChange = null
    }

    public logout() {

        // Remove the account
        if (this.account) {
            this.account.closeAccounts()
            this.account = null
        }

        // Call the account listener if needed
        if (this.onAccountChange) {
            this.onAccountChange(this.account)
        }
    }

}