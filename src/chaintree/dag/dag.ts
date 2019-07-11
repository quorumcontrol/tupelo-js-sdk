import CID from 'cids';

const tupeloMessages: any = require('tupelo-messages');
const ipldDagCbor: any = require('ipld-dag-cbor');
const Block: any = require('ipfs-block');

interface DagStore {
  get(cid: CID): Promise<Object>
  resolve(cid: CID, path: string): Iterable<Promise<{remainderPath: string, value: any}>>
}

interface DagStoreWithBlockStore extends DagStore {
  bs:any
}

export async function DagFromBase64(b64SerializedChainTree: string, store: DagStoreWithBlockStore) {
  const buf = Buffer.from(b64SerializedChainTree, 'base64');
  const chainTree = tupeloMessages.services.SerializableChainTree.deserializeBinary(buf);
  const tip = new CID(chainTree.getTip());

  const promises = [];

  for (let nodeBytes of chainTree.getDagList_asU8()) {
    const nodeBuff = Buffer.from(nodeBytes);
    const nodeCid = await ipldDagCbor.util.cid(nodeBuff);
    nodeCid.multibaseName = 'base58btc';
    const block = new Block(nodeBuff, nodeCid);

    promises.push(new Promise((resolve, reject) => {
      store.bs.put(block, (err: Error) => {
        if (err == null) {
          resolve();
        } else {
          reject(err);
        }
      })
    }));
  }

  await Promise.all(promises)

  return new Dag(tip, store)
}

export class Dag {
  tip: CID
  store: DagStore

  constructor(tip: CID, store: DagStore) {
    this.tip = tip;
    this.store = store;
  }

  async get(cid: CID) {
    return this.store.get(cid)
  }

  async resolve(path: Array<string>) {
    return this.resolveAt(this.tip, path)
  }

  async resolveAt(tip: CID, path: Array<string>) {
    const str_path  = path.join("/")
    const resolved = this.store.resolve(tip, str_path)
    let lastVal
    try {
      for await (let v of resolved) {
        lastVal = v
      }
    } catch (err) {
      const e:Error = err;
    
      if (!e.message.startsWith("Object has no property")) {
        throw err
      }
    }

    // nothing was resolvable, return full path as the remainder
    if (typeof lastVal === 'undefined') {
      return {remainderPath: path, value: null}
    }
  
    // if remainderPath is not empty, then the value was not found and an
    // error was thrown on the second iteration above - use the remainderPath
    // from the first iteration, but return nil for the error
    if (lastVal.remainderPath != "") {
      return { remainderPath: lastVal.remainderPath.split("/"), value: null }
    }

    return { remainderPath: [], value: lastVal.value }
  }
}