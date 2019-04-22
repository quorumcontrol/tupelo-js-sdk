const helpers = require("./helpers");
const assert = require("assert");
const tupelo = require("../lib/tupelo");
const itRequires = helpers.itRequires;

describe("playing transactions", function() {
  this.timeout(30000);
  let resp;

  itRequires("0.2")("signs a batch of transactions", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    let path1 = "some/data";
    let val1 = "foo";
    let setData1 = tupelo.setDataTransaction(path1, val1);

    let path2 = "other/data";
    let val2 = "bar";
    let setData2 = tupelo.setDataTransaction(path2, val2);

    let token = "TestToken";
    let max = 30;
    let establishToken = tupelo.establishTokenTransaction(token, max);

    let mintAmount = 15;
    let mintToken = tupelo.mintTokenTransaction(token, mintAmount);

    let txns = [setData1, setData2, establishToken, mintToken];

    resp = await wallet.playTransactions(chainId, walletKey, txns);
    assert.notEqual(resp.tip, null);

    resp = await wallet.resolveData(chainId, path1);
    assert.strictEqual(resp.data[0], val1);

    resp = await wallet.resolveData(chainId, path2);
    assert.strictEqual(resp.data[0], val2);

    // TODO: add tests to check token balances when tokens stabilize
  });
});
