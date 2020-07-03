import * as bitcoinlib from 'bitcoinjs-lib'
import * as bip39 from 'bip39'
import { Chain } from './chains'
import { Keyring } from './bitcoin/keyring'
import { Network } from 'bitcoinjs-lib'

export default class Keygen {

    public static getKeyring(chain: Chain, password: string, index: number) {
        switch (chain) {
            case Chain.Bitcoin: {
                return this.generateKeyring(password, index, bitcoinlib.networks.bitcoin)
            }
            case Chain.BitcoinTestnet: {
                return this.generateKeyring(password, index, bitcoinlib.networks.testnet)
            }
            case Chain.BitcoinRegtest: {
                return this.generateKeyring(password, index, bitcoinlib.networks.regtest)
            }
            default: {
                console.log('That chain is not supported')
                return null
            }
        }
    }

    // Returns a keypair and the addresses for a specific phrase and derivation index
    private static generateKeyring(password: string, keyIndex: number, network: Network): Keyring {

        // Create key from seed
        const seed = bip39.mnemonicToSeedSync(password)
        const wallet = bitcoinlib.bip32.fromSeed(seed, network)

        // Get the index of the keypair we want
        // https://walletsrecovery.org/ TODO
        const child = wallet
            .deriveHardened(44)
            .derive(0)
            .derive(keyIndex)

        // Get the keypair values
        const privateKey = child.toWIF()
        const publicKey = child.publicKey
        const p2pkh = bitcoinlib.payments.p2pkh({ pubkey: publicKey, network: network })
        const p2wpkh = bitcoinlib.payments.p2wpkh({ pubkey: publicKey, network: network })
        const p2sh = bitcoinlib.payments.p2sh({ redeem: p2wpkh, network: network })

        return {         
            keypair: {
                privateKey: privateKey,
                publicKey: publicKey.toString()
            },
            addresses: {
                p2pkh: p2pkh.address || 'invalid',
                p2sh: p2sh.address || 'invalid',
                p2wpkh: p2wpkh.address || 'invalid'
            }
        }
    }

}