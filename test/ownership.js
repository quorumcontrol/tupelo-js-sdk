const assert = require("assert");
const helpers = require("./helpers");

// TODO: Remove the "oldResult" tests once resolveData support is released.

describe("ownership transfer", function () {
  this.timeout(30000);
  
  it("can export and import", async () => {
    let {wallet: alice, walletKey: aliceKey, chainId: chainId} = await helpers.createWalletWithChain();
    let {wallet: bob, walletKey: bobKey, chainId: bobChainId} = await helpers.createWalletWithChain();
        
    let resp = await alice.setData(chainId, aliceKey, "path/to/here", "hi");
    assert.notEqual(resp.tip, null);
    
    let result = await alice.resolveData(chainId, "path/to/here");
    assert.deepStrictEqual(result.data, ["hi",]);
    
    const chainTreeExport = await alice.exportChainTree(chainId);
    resp = await bob.importChainTree(chainTreeExport.chainTree);
    assert.strictEqual(resp.chainId, chainId)
    
    result = await bob.resolveData(chainId, "path/to/here");
    assert.deepStrictEqual(result.data, ["hi",]);
  });
  
  it("can do a real transfer from alice to bob", async () => {
    let {wallet: alice, walletKey: aliceKey, chainId: chainId} = await helpers.createWalletWithChain();
    let {wallet: bob, walletKey: bobKey, chainId: bobChainId} = await helpers.createWalletWithChain();
    
    for (let i = 0; i < 5; i++) {
      const resp = await alice.setData(chainId, aliceKey, "path/to/" + i.toString(),
        "value: " + i.toString());
      assert.notEqual(resp.tip, null);
    }
    
    // make sure all sets can be read back
    for (let i = 0; i < 5; i++) {
      const result = await alice.resolveData(chainId, "path/to/" + i.toString());
      assert.deepStrictEqual(result.data, ["value: " + i.toString(),]);
    }
    
    // change ownership to be shared between Alice and bob
    let resp = await alice.setOwner(chainId, aliceKey, [aliceKey, bobKey]);
    assert.notEqual(resp.tip, null);
    
    // send the chaintree over to bob
    const chainTreeExport = await alice.exportChainTree(chainId);
    resp = await bob.importChainTree(chainTreeExport.chainTree);
    assert.strictEqual(resp.chainId, chainId);
    
    // make sure bob can read all the previous history
    for (let i = 0; i < 5; i++) {
      const result = await bob.resolveData(chainId, "path/to/" + i.toString());
      assert.deepStrictEqual(result.data, ["value: " + i.toString(),]);
    }
    
    // and can himself write to the tree
    resp = await bob.setData(chainId, bobKey, "path/to/bobvalue", "bobdidthis");
    assert.notEqual(resp.tip, null);
    
    const result = await bob.resolveData(chainId, "path/to/bobvalue");
    assert.deepStrictEqual(result.data, ["bobdidthis",]);
  });
});
