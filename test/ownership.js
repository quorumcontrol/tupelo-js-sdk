const assert = require("assert");
const Tupelo = require("../lib/tupelo");
const TUPELO_HOST = 'localhost:50051';

describe("ownership transfer", function() {
    this.timeout(30000);

    it("can export and import", async ()=> {

        const alice = Tupelo.connect(TUPELO_HOST, {
            walletName: "alice-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await alice.register();

        const bob = Tupelo.connect(TUPELO_HOST, {
            walletName: "bob-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await bob.register();

        let resp = await bob.generateKey();
        const bobKey = resp.keyAddr;
        assert.equal(42, bobKey.length);

        resp = await alice.generateKey();
        const aliceKey = resp.keyAddr;

        let {chainId,} = await alice.createChainTree(aliceKey);

        resp = await alice.setData(chainId, aliceKey, "path/to/here", "hi");
        assert.notEqual(resp.tip, null);
    
        let result = await alice.resolve(chainId, "path/to/here");
        assert.equal(result.data, "hi");

        let chainTreeExport = await alice.exportChainTree(chainId);
        resp = await bob.importChainTree(chainTreeExport.chainTree);
        assert.equal(resp.chainId, chainId)

        result = await bob.resolve(chainId, "path/to/here");
        assert.equal(result.data, "hi");

        return Promise.resolve(true);
    });

    it("can transfer from alice to bob", async ()=> {

        const alice = Tupelo.connect(TUPELO_HOST, {
            walletName: "alice-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await alice.register();

        const bob = Tupelo.connect(TUPELO_HOST, {
            walletName: "bob-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await bob.register();

        let resp = await bob.generateKey();
        const bobKey = resp.keyAddr;
        assert.equal(42, bobKey.length);

        resp = await alice.generateKey();
        const aliceKey = resp.keyAddr;

        let {chainId,} = await alice.createChainTree(aliceKey);

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

    it("can do a real transfer from alice to bob", async ()=> {
        const alice = Tupelo.connect(TUPELO_HOST, {
            walletName: "alice-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await alice.register();

        const bob = Tupelo.connect(TUPELO_HOST, {
            walletName: "bob-test",
            passPhrase: "test",
        });
        // TODO: clear RPC server state between tests automatically
        // await bob.register();

        let resp = await bob.generateKey();
        const bobKey = resp.keyAddr;

        resp = await alice.generateKey();
        const aliceKey = resp.keyAddr;

        let {chainId,} = await alice.createChainTree(aliceKey);

        for (let i = 0; i < 5; i++) {
            resp = await alice.setData(chainId, aliceKey, "path/to/" + i.toString(), "value: " + i.toString());
            assert.notEqual(resp.tip, null);
        }

        // make sure all sets can be read back
        for (let i = 0; i < 5; i++) {
            let result = await alice.resolve(chainId, "path/to/" + i.toString());
            assert.equal(result.data, "value: " + i.toString());
        }

        // transfer ownership to be shared with Alice and bob
        resp = await alice.setOwner(chainId, aliceKey, [aliceKey, bobKey]);
        assert.notEqual(resp.tip, null);

        // send the chaintree over to bob
        let chainTreeExport = await alice.exportChainTree(chainId);

        resp = await bob.importChainTree(chainTreeExport.chainTree);
        assert.equal(resp.chainId, chainId)

        // make sure bob can read all the previous history
        for (let i = 0; i < 5; i++) {
            let result = await bob.resolve(chainId, "path/to/" + i.toString());
            assert.equal(result.data, "value: " + i.toString());
        }

        // and can himself write to the tree
        resp = await bob.setData(chainId, bobKey, "path/to/bobvalue", "bobdidthis");
        assert.notEqual(resp.tip, null);

        result = await bob.resolve(chainId, "path/to/bobvalue");
        assert.equal(result.data, "bobdidthis");

        return Promise.resolve(true);
    });
});
