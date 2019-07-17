declare const Go: any;

import CID from 'cids';

import * as go from "./js/go"
import { Transaction } from 'tupelo-messages'
import {IBlockService, IBlock} from './chaintree/dag/dag'
import ChainTree from './chaintree/chaintree';
import { CurrentState, Signature } from 'tupelo-messages/signatures/signatures_pb';

class FakePublisher {
    public publish(topic: string, data: Uint8Array, cb: Function) {
        console.log("publishing ", data, " on ", topic, "cb ", cb)
        cb(null)
    }
}

export interface IPubSub {
    publish(topic: string, data: Uint8Array, cb: Function): null
    subscribe(topic: string, onMsg: Function, cb: Function): null
}

interface IPlayTransactionOptions {
    publisher: IPubSub,
    blockService: IBlockService, 
    privateKey: Uint8Array,
    tip: CID, 
    transactions: Uint8Array[],
}

class UnderlyingWasm {
    _populated: boolean;

    constructor() {
        this._populated = false;
    }

    generateKey(): Promise<Uint8Array[]> {
        return new Promise<Uint8Array[]>((res, rej) => { }) // replaced by wasm
    }
    newEmptyTree(store: IBlockService, publicKey: Uint8Array): Promise<CID> {
        return new Promise<CID>((res,rej) => {}) // replaced by wasm
    }
    playTransactions(opts: IPlayTransactionOptions): Promise<Uint8Array> {
        return new Promise<Uint8Array>((res, rej) => { }) // replaced by wasm
    }
}

export namespace TupeloWasm {
    const _tupelowasm = new UnderlyingWasm();

    export async function get() {
        if (_tupelowasm._populated) {
            return _tupelowasm;
        }

        go.run("./main.wasm");
        await go.ready();
        go.populate(_tupelowasm);
        _tupelowasm._populated = true;
        return _tupelowasm;
    }
}

export namespace Tupelo {

    export async function playTransactions(publisher: IPubSub, tree: ChainTree, transactions: Transaction[]): Promise<CurrentState> {
        const tw = await TupeloWasm.get()
        console.log("serializing the transactions")
        let transBits: Uint8Array[] = new Array<Uint8Array>()
        for (var t of transactions) {
            const serialized = t.serializeBinary()
            transBits = transBits.concat(serialized)
        }
        
        const store = tree.store

        const privateKey: Uint8Array = tree.key.privateKey ? tree.key.privateKey : new Uint8Array()
        if (privateKey.length == 0) {
            throw new Error("can only play transactions on a tree with a private key attached")
        }

        const resp = await tw.playTransactions({
            publisher: publisher,
            blockService: store,
            privateKey: privateKey,
            tip: tree.tip,
            transactions: transBits,
        })

        const currState = CurrentState.deserializeBinary(resp)
        const sig = currState.getSignature()
        if (!sig) {
            throw new Error("empty signature received from CurrState")
        }

        tree.tip = new CID(Buffer.from(sig!.getNewTip_asU8()))
        return currState
    }
}

export default Tupelo