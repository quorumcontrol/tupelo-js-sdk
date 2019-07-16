import * as libp2p from './js/p2p';

interface INodeCreator {
    pubsub:any;
    start(cb:Function):null;
    stop():null;
    on(evt:string, cb:Function):null;
    once(evt:string, cb:Function):null;
    emit(evt:string):null;
}

export namespace p2p {
    export async function createNode():Promise<INodeCreator> {
        return libp2p.CreateNode()
    }
}