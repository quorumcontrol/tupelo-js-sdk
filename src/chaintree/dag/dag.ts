import { CID } from 'cids';

interface DagStore {
  get(cid: CID): Promise<Object>
  resolve(cid: CID, path: string): Iterable<Promise<{remainderPath: string, value: any}>>
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