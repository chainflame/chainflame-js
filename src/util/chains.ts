export enum Chain {
    Bitcoin = 'btc', 
    BitcoinTestnet = 'tbtc', 
    BitcoinRegtest = 'rbtc'
}

export const getChains = () => {
    return [Chain.Bitcoin]
}

export const getTestChains = () => {
    return [Chain.BitcoinTestnet]
}

export const getAllChains = () => {
    return [Chain.Bitcoin, Chain.BitcoinTestnet, Chain.BitcoinRegtest]
}