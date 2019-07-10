import { CID } from 'cids';

interface DAGService {
  get(cid: CID): Promise<Object>
  resolve(cid: CID, path: string): Iterable<Promise<{remainderPath: string, value: any}>>
}

export class Dag {
  tip: CID
  store: DAGService

  constructor(tip: CID, store: DAGService) {
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
    for await (let v of resolved) {
      lastVal = v
    }

    if (typeof lastVal === 'undefined') {
      return {remainderPath: path, value: null}
    }

    let rem = lastVal.remainderPath
    return {
      remainderPath: rem == "" ? [] : rem.split("/"),
      value: lastVal.value
    }
  }
}