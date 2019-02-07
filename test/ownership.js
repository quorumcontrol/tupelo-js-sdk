const assert = require("assert");
const Tupelo = require("../lib/tupelo");
const TUPELO_HOST = 'localhost:50051';

describe("ownership transfer", function() {
    this.timeout(10000);

    it("can export and import", async ()=> {

        const alice = Tupelo.connect(TUPELO_HOST, {
            walletName: "alice-test",
            passPhrase: "test",
        });
        // await alice.register();

        const bob = Tupelo.connect(TUPELO_HOST, {
            walletName: "bob-test",
            passPhrase: "test",
        });
        // await bob.register();

        let resp = await bob.generateKey();
        const bobKey = resp.keyAddr;
        assert.equal(42, bobKey.length);

        resp = await alice.generateKey();
        const aliceKey = resp.keyAddr;

        let {chainId,} = await alice.createChainTree(aliceKey);

        console.log("chainId: ", chainId, "aliceKey: ", aliceKey);

        resp = await alice.setData(chainId, aliceKey, "path/to/here", "hi");
        assert.notEqual(resp.tip, null);
    
        let result = await alice.resolve(chainId, "path/to/here");
        assert.equal(result.data, "hi");

        let chainTreeExport = await alice.exportChainTree(chainId);
        
        resp = await bob.importChainTree(bobKey, chainTreeExport);
        console.log(resp);

        return Promise.resolve(true);
    });

    it("can transfer from alice to bob", async ()=> {

        const alice = Tupelo.connect(TUPELO_HOST, {
            walletName: "alice-test",
            passPhrase: "test",
        });
        await alice.register();

        const bob = Tupelo.connect(TUPELO_HOST, {
            walletName: "bob-test",
            passPhrase: "test",
        });
        await bob.register();

        let resp = await bob.generateKey();
        const bobKey = resp.keyAddr;
        assert.equal(42, bobKey.length);

        resp = await alice.generateKey();
        const aliceKey = resp.keyAddr;

        let {chainId,} = await alice.createChainTree(aliceKey);

        console.log("chainId: ", chainId, "aliceKey: ", aliceKey);

        resp = await alice.setData(chainId, aliceKey, "path/to/here", "hi");
        assert.notEqual(resp.tip, null);
    
        let result = await alice.resolve(chainId, "path/to/here");
        assert.equal(result.data, "hi");

        resp = await alice.setOwner(chainId, aliceKey, [aliceKey, bobKey]);
        assert.notEqual(resp.tip, null);

        result = await alice.resolve(chainId, "path/to/here");
        assert.equal(result.data, "hi");

        return Promise.resolve(true);
    });
});
