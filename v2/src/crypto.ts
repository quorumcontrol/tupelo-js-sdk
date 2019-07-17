import {TupeloWasm} from './tupelo'


export class EcdsaKey {
    privateKey: Uint8Array | undefined
    publicKey: Uint8Array

    static generate = async ()=> {
        const tw = await TupeloWasm.get()
        const pair = await tw.generateKey()
        return new EcdsaKey(pair[1], pair[0])
    }

    constructor(publicKeyBits: Uint8Array, privateKeyBits?: Uint8Array) {
        this.publicKey = publicKeyBits
        this.privateKey = privateKeyBits
    }
}