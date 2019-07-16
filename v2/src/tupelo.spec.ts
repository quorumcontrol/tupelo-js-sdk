import { expect } from 'chai';
import 'mocha';

import './extendedglobal';
import { p2p } from './node';

import { TupeloWasm, Tupelo } from './tupelo';
import { Transaction, SetDataPayload } from '/Users/tobowers/code/messages/build/js/transactions/transactions_pb'
const dagCBOR = require('ipld-dag-cbor');


// import * as Ipld from 'ipld'
// import * as IpfsRepo from 'ipfs-repo'
// import * as IpfsBlockService from 'ipfs-block-service'
// import { MemoryDatastore } from 'interface-datastore'
// import * as multihashing from 'multihashing-async'
// import * as Block from 'ipfs-block'

import CID from 'cids';

const IpfsRepo:any = require('ipfs-repo');
const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;
const Block:any = require('ipfs-block');
const multihashing:any = require('multihashing-async');

const testIpld = async () => {
    console.log('creating repo')
    const repo = new IpfsRepo('test', {
      lock: 'memory',
      storageBackends: {
        root: MemoryDatastore,
        blocks: MemoryDatastore,
        keys: MemoryDatastore,
        datastore: MemoryDatastore
      }
    })
    console.log('repo init')
    await repo.init({})
    await repo.open()
    return new IpfsBlockService(repo)
}

describe('Tupelo', () => {

  it('works as a datastore', async () => {
    console.log('starting test')
    const bs = await testIpld()
    console.log('created bs')
    // create a block
    const data = Buffer.from('hello world')
    const serialized = dagCBOR.util.serialize(data)

    const multihash = await multihashing(serialized, 'sha2-256')

    const cid = new CID(1, 'dag-cbor', multihash, 'base32')
    const block = new Block(serialized, cid)
    await bs.put(block)
    const res = await Tupelo.teststore(bs, cid.toString())
    expect(res).to.equal(cid.toString())
  })
})

  // it('generate keys', async () => {
  //   const key = await Tupelo.generateKey()
  //   expect(key).to.have.length(32)
  // })

  // it('runs end-to-end', async () => {
  //   let resolve:Function,reject:Function
  //   const p = new Promise((res,rej)=> { resolve = res, reject = rej})
  //   var node = await p2p.createNode();
  //   expect(node).to.exist;

  //   // const tw = await TupeloWasm.get()
  //   const key = await Tupelo.generateKey()
  //   const trans = new Transaction()

  //   const payload = new SetDataPayload()
  //   payload.setPath("/hi")

  //   const serialized = dagCBOR.util.serialize("hihi")

  //   payload.setValue(new Uint8Array(serialized))
  //   trans.setType(Transaction.Type.SETDATA)
  //   trans.setSetDataPayload(payload)

  //   node.on('connection:start', (peer:any) => {
  //     console.log("connecting to ", peer.id._idB58String, " started")
  //   })

  //   node.on('error', (err:any) => {
  //     console.log('error')
  //   })

  //   node.once('enoughdiscovery', async ()=> {
  //     Tupelo.playTransactions(node.pubsub, key, [trans]).then(
  //       (success)=> {
  //         expect(success).to.be.an.instanceOf(Uint8Array)
  //         resolve(true)
  //       },
  //       (err)=> {
  //         expect(err).to.be.null
  //         resolve(true)
  //     })
  //   })

  //   let connected = 0;

  //   node.on('peer:connect', async ()=> {
  //     console.log("peer connect")
  //     connected++
  //     if (connected >= 2) {
  //       node.emit('enoughdiscovery')
  //     }
  //   })

  //   node.start(()=>{
  //     console.log("node started");
  //   });
  //   return p
  // }).timeout(10000)


// })

