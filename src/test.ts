import ChainFlame from './chainflame'

const chainflame = new ChainFlame('asdf')
const account = chainflame.getAccount('jenna')

const accountQuery = account.bitcoinRegtest
    .satoshis(true)
    .confirmations(0)
    .offset(0)
    .limit(20)
    .order('asc')

accountQuery.addAccountListener(account => {
    console.log(account)
})

accountQuery.getAccount()
    .then(account => {
        console.log(account)
    })
    .catch(error => {
        console.log(error)
    })