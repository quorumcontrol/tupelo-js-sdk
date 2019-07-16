declare const Go: any;

import * as go from "./js/go"
import { Transaction } from 'tupelo-messages'

class FakePublisher {
    public publish(topic:string, data:Uint8Array, cb:Function) {
        console.log("publishing ", data, " on ", topic, "cb ", cb)
        cb(null)
    }
}

export interface IPubSub {
    publish(topic:string, data:Uint8Array, cb:Function):null
    subscribe(topic:string, onMsg:Function, cb:Function):null
}

class UnderlyingWasm {
    _populated: boolean;

    constructor() {
        this._populated = false;
    }
    testpubsub(publisher:IPubSub):Promise<String>{
        return new Promise<String>((res,rej)=> {}); // replaced by wasm
    }
    generateKey():Promise<Uint8Array> {
        return new Promise<Uint8Array>((res,rej)=> {}) // replaced by wasm
    }
    testclient(publisher:IPubSub, keys:Uint8Array, transactions:Uint8Array[]):Promise<Uint8Array> {
        return new Promise<Uint8Array>((res,rej)=> {}) // replaced by wasm
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

   export async function generateKey():Promise<Uint8Array> {
       const tw = await TupeloWasm.get()
       return tw.generateKey()
   }

   export async function playTransactions(publisher:IPubSub, key:Uint8Array, transactions:Transaction[]):Promise<Uint8Array> {
       const tw = await TupeloWasm.get()
       console.log("serializing the bits")
       let bits:Uint8Array[] = new Array<Uint8Array>()
       for (var t of transactions) {
          const serialized = t.serializeBinary()
          bits = bits.concat(serialized)
       }
       console.log("testclient called")
       return tw.testclient(publisher, key, bits)
   }
}

export default Tupelo