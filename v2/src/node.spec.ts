import { expect } from 'chai';
import 'mocha';

import { p2p } from './node';
import { TupeloWasm } from './tupelo';

describe('p2p', ()=> {
    it('creates a node', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej)=> { resolve = res, reject = rej})

        var node = await p2p.createNode();
        expect(node).to.exist;
        node.start(()=> {
            node.stop();
            resolve()
        });
        return p
    }).timeout(5000)

    it('does a pubsub round trip', async () => {
        var node = await p2p.createNode();
        expect(node).to.exist;
    
        const tw = await TupeloWasm.get()
    
        node.start(async ()=> {
           var resp = await tw.testpubsub(node.pubsub);
           expect(resp).to.equal('hi');
        });
    })
})



