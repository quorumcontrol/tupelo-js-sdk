'use strict'

const assert = require("assert");
const cbor = require("ipld-dag-cbor");
const dag = require("../../../lib/chaintree/dag/dag");
const Ipld = require('ipld');
const IpfsRepo = require('ipfs-repo');
const IpfsBlockService = require('ipfs-block-service');
const MemoryDatastore = require('interface-datastore').MemoryDatastore;
const CID = require("cids");

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

  it("can import a serialized chain tree paths", async ()=> {
    const ipld = await testIpld()
    const serializedTreeWithChildFooBar = "Ci6hY2VuZNgqWCUAAXESIBfASQ07dBPoXAazp2U0RBHjqQAwuH3JqG1fe3Ljed1kCsoEo2ZoZWlnaHQAZ2hlYWRlcnOhanNpZ25hdHVyZXOheCoweDZBNTRkRTQwN2U1OEZDZDNkQjg4YmJiMDcxRTQ5QUJhZTM0MjdmRkWtZHR5cGVpc2VjcDI1NmsxZHZpZXcAZWN5Y2xlAGZoZWlnaHQAZm5ld1RpcPZnc2lnbmVyc/Zob2JqZWN0SWT2aXNpZ25hdHVyZVhBoicWQcTICGNP473V8VadpfHTMQ2Q/zgbif8K2GxIeEhyZvbcCT9PMezMxQakABQDCiDVglNtSVdfIvOVDYiIEQFrcHJldmlvdXNUaXD2bXRyYW5zYWN0aW9uSWT2bXhYWF9zaXplY2FjaGUAcHhYWF91bnJlY29nbml6ZWT2dHhYWF9Ob1Vua2V5ZWRMaXRlcmFsoGx0cmFuc2FjdGlvbnOBq2R0eXBlAWxzdGFrZVBheWxvYWT2bXhYWF9zaXplY2FjaGUAbnNldERhdGFQYXlsb2FkpWRwYXRoaWNoaWxkL2Zvb2V2YWx1ZURjYmFybXhYWF9zaXplY2FjaGUAcHhYWF91bnJlY29nbml6ZWT2dHhYWF9Ob1Vua2V5ZWRMaXRlcmFsoHBtaW50VG9rZW5QYXlsb2Fk9nBzZW5kVG9rZW5QYXlsb2Fk9nB4WFhfdW5yZWNvZ25pemVk9nNyZWNlaXZlVG9rZW5QYXlsb2Fk9nNzZXRPd25lcnNoaXBQYXlsb2Fk9nR4WFhfTm9VbmtleWVkTGl0ZXJhbKB1ZXN0YWJsaXNoVG9rZW5QYXlsb2Fk9govoWRkYXRh2CpYJQABcRIgAJJfMOxCnTkD/LJTadoqcUt9Qnk5UiWvsRF4VMwjw+gKMKFlY2hpbGTYKlglAAFxEiArA6ZJ1s4JPipqkKtGOPiW1DYqf7CTrEovKqaIYQODvAoJoWNmb29jYmFyCqABpGJpZHg1ZGlkOnR1cGVsbzoweDZBNTRkRTQwN2U1OEZDZDNkQjg4YmJiMDcxRTQ5QUJhZTM0MjdmRkVkdHJlZdgqWCUAAXESIIz4+0hAumQwHlBJ5EceZ3ppIOb5SLoUsaZPvkz6vAUKZWNoYWlu2CpYJQABcRIgYJAY9cZu4rRldrVh0W91RYnqJNDtwARUBcu20LQorzxmaGVpZ2h0ABKDAgoSbG9jYWwgbm90YXJ5IGdyb3VwEuwBCgMBAAESQDkhFHNng5iOl9ZPg+N1GyExUDuZ/eifxJKg87SHoGtzXUi2HZ63WYMyrxH32U6N1h7do8z0NMgGedY9n6vOgm0iNWRpZDp0dXBlbG86MHg2QTU0ZEU0MDdlNThGQ2QzZEI4OGJiYjA3MUU0OUFCYWUzNDI3ZkZFKiQBcRIg2fAZFPQ81y1B1ji+3loh28kmwqtzeVF8j2n/4vxnqJ4yJAFxEiAQMh3Z9hZtKoCvkCb963T0TWP02zNAabUoL9TwyMOMPVIgoTRGeTawe3kBr7ziW7S+s4K8rNRs0ZuNViDbNbk6HAAaMXpkcHVBbVdmTDJHdXVKM0M5YmFDejZvajltQzdhVm53b1JKZlZtYlJEcWEzZm9qcms="
    const testDag = await new dag.DagFromBase64(serializedTreeWithChildFooBar, ipld)

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
          value: {"child": new CID("bafyreiblaotetvwobe7cu2uqvnddr6ew2q3cu75qsoweulzku2egca4dxq")}
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
      let resolved = await testDag.resolve(["tree", "data"].concat(c.test))
      assert.deepStrictEqual(resolved, c.expect)
    }
  })

})
