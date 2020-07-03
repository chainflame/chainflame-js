import ChainFlame from './chainflame'

const chainflame = new ChainFlame('asdf')
const wallet = chainflame.openWallet('satoshi')
wallet.bitcoinRegtest.addWalletListener(wallet => {
    console.log(wallet)
})