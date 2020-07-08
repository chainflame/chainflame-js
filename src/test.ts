import ChainFlame from './chainflame'

async function test() {

    const chainflame = new ChainFlame('asdf')
    const account = chainflame.getAccount('jenna')
    account.bitcoinRegtest.satoshis(true).addAccountListener(account => console.log(account))

    try {
        await account.bitcoinRegtest.send(100000, 100, 'mpjxU2YnLcu1hWMoBLk2Mzdw4osT9EXg12', 'This is a message :)')
    } catch (error) {
        console.log(error)
    }

}

test()

// const chainflame = new ChainFlame('asdf')
// const account = chainflame.getAccount('jenna')
// account.bitcoinRegtest.addAccountListener(account => console.log(account))
// // account.bitcoinRegtest.send(1, 0.002, 'sdfsdf', 'This is a message :)')

// chainflame.logout()

// const accountQuery = account.bitcoinRegtest
//     .satoshis(true)
//     .confirmations(0)
//     .offset(0)
//     .limit(20)
//     .order('asc')

// accountQuery.getAccount()
//     .then(account => {
//         console.log(account)
//     })
//     .catch(error => {
//         console.log(error)
//     })