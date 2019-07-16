import { expect } from 'chai';
import 'mocha';

import './extendedglobal';
import { p2p } from './node';

import { TupeloWasm, Tupelo } from './tupelo';
import { Transaction,SetDataPayload } from '/Users/tobowers/code/messages/build/js/transactions/transactions_pb'
const dagCBOR = require('ipld-dag-cbor');

describe('Tupelo', () => {


  it('generate keys', async () => {
    const key = await Tupelo.generateKey()
    expect(key).to.have.length(32)
  })

  it('runs end-to-end', async () => {
    let resolve:Function,reject:Function
    const p = new Promise((res,rej)=> { resolve = res, reject = rej})
    var node = await p2p.createNode();
    expect(node).to.exist;
  
    // const tw = await TupeloWasm.get()
    const key = await Tupelo.generateKey()
    const trans = new Transaction()
  
    const payload = new SetDataPayload()
    payload.setPath("/hi")
  
    const serialized = dagCBOR.util.serialize("hihi")
  
    payload.setValue(new Uint8Array(serialized))
    trans.setType(Transaction.Type.SETDATA)
    trans.setSetDataPayload(payload)
  
    node.on('connection:start', (peer:any) => {
      console.log("connecting to ", peer.id._idB58String, " started")
    })
  
    node.on('error', (err:any) => {
      console.log('error')
    })

    node.once('enoughdiscovery', async ()=> {
      Tupelo.playTransactions(node.pubsub, key, [trans]).then(
        (success)=> {
          expect(success).to.be.an.instanceOf(Uint8Array)
          resolve(true)
        },
        (err)=> {
          expect(err).to.be.null
          resolve(true)
      })
    })
  
    let connected = 0;

    node.on('peer:connect', async ()=> {
      console.log("peer connect")
      connected++
      if (connected >= 2) {
        node.emit('enoughdiscovery')
      }
    })
  
    node.start(()=>{
      console.log("node started");
    });
    return p
  }).timeout(10000)


})

