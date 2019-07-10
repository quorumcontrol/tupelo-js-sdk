import { CID } from 'cids';
interface DAGService {
    get(cid: CID): Promise<Object>;
    resolve(cid: CID, path: string): Iterable<Promise<{
        remainderPath: string;
        value: any;
    }>>;
}
export declare class Dag {
    tip: CID;
    store: DAGService;
    constructor(tip: CID, store: DAGService);
    get(cid: CID): Promise<Object>;
    resolve(path: Array<string>): Promise<{
        remainderPath: string[];
        value: null;
    } | {
        remainderPath: never[];
        value: any;
    }>;
    resolveAt(tip: CID, path: Array<string>): Promise<{
        remainderPath: string[];
        value: null;
    } | {
        remainderPath: never[];
        value: any;
    }>;
}
export {};
