'use strict'

const assert = require("assert");
const cbor = require("ipld-dag-cbor");
const dag = require("../../../lib/chaintree/dag/dag");
const Ipld = require('ipld');
const IpfsRepo = require('ipfs-repo');
const IpfsBlockService = require('ipfs-block-service');
const MemoryDatastore = require('interface-datastore').MemoryDatastore;


const testIpld = () => {
  return new Promise((resolve, reject) => {
    const repo = new IpfsRepo('test', {
      lock: 'memory',
      storageBackends: {
        root: MemoryDatastore,
        blocks: MemoryDatastore,
        keys: MemoryDatastore,
        datastore: MemoryDatastore
      }
    })

    repo.init({}, (err) => {
      if (err) {
        reject(err)
        return
      }
      repo.open((err) => {
        if (err) {
          reject(err)
          return
        }
        const bs = new IpfsBlockService(repo)
        const ipld = new Ipld({ blockService: bs})
        resolve(ipld)
      })
    })
  })
}

describe("basic dag operations", function() {
  this.timeout(3000)

  it("can resolve paths", async ()=> {
    const ipld = await testIpld()
    const childObj = { foo: 'bar' }
    const childCid = await ipld.put(childObj, cbor.codec)
    const parentObj = { child: childCid };
    const parentCid = await ipld.put(parentObj, cbor.codec)

    const testDag = new dag.Dag(parentCid, ipld)

    const cases = [
      {
        test: ["child", "foo"],
        expect: {
          remainderPath: [],
          value: "bar"
        }
      }, {
        test: ["child"],
        expect: {
          remainderPath: [],
          value: {"foo": "bar"}
        }
      }, {
        test: [],
        expect: {
          remainderPath: [],
          value: {"child": childCid}
        }
      }, {
        test: ["child", "other"],
        expect: {
          remainderPath: ["other"],
          value: null
        }
      }, {
        test: ["child", "foo", "notAKey"],
        expect: {
          remainderPath: ["foo", "notAKey"],
          value: null
        }
      }
    ]

    for (let c of cases) {
      let resolved = await testDag.resolve(c.test)
      assert.deepStrictEqual(resolved, c.expect) 
    }
  });

  it("can resolveAt paths", async ()=> {
    const ipld = await testIpld()
    const childObj = { foo: 'bar' }
    const childCid = await ipld.put(childObj, cbor.codec)
    const parentObj = { child: childCid };
    const parentCid = await ipld.put(parentObj, cbor.codec)

    const testDag = new dag.Dag(parentCid, ipld)

    const cases = [
      {
        test: ["foo"],
        expect: {
          remainderPath: [],
          value: "bar"
        }
      }, {
        test: [],
        expect: {
          remainderPath: [],
          value: {"foo": "bar"}
        }
      }, {
        test: ["foo", "bing"],
        expect: {
          remainderPath: ["foo", "bing"],
          value: null
        }
      }
    ]

    for (let c of cases) {
      let resolved = await testDag.resolveAt(childCid, c.test)
      assert.deepStrictEqual(resolved, c.expect) 
    }
  });

})
