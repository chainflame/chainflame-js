export interface Keyring {
    keypair: Keypair
    addresses: Addresses
}

export interface Keypair {
    privateKey: string
    publicKey: string
}

export interface Addresses {
    p2pkh: string
    p2sh: string
    p2wpkh: string
}