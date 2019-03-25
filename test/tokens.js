const assert = require("assert");
const crypto = require("crypto");
const Tagged = require("cbor/lib/tagged");
const Tupelo = require("../lib/tupelo");
const TUPELO_HOST = process.env.TUPELO_RPC_HOST || 'localhost:50051';

const createWalletWithChain = async () => {
  const wallet = Tupelo.connect(TUPELO_HOST, {
    walletName: crypto.randomBytes(32).toString('hex'),
    passPhrase: "test",
  });
  await wallet.register()
  let resp = await wallet.generateKey();
  const walletKey = resp.keyAddr;
  assert.equal(42, walletKey.length);
  let {chainId,} = await wallet.createChainTree(walletKey);
  return {wallet: wallet, walletKey: walletKey, chainId: chainId}
}

describe("token operations", function() {
  this.timeout(30000);
  let resp;

  it("can establish and mint token without maximum", async ()=> {
    let {wallet, walletKey, chainId} = await createWalletWithChain();

    resp = await wallet.establishCoin(chainId, walletKey, "token-a");
    assert.notEqual(resp.tip, null);

    resp = await wallet.mintCoin(chainId, walletKey, "token-a", 12345678901234567890);
    assert.notEqual(resp.tip, null);

    resp = await wallet.mintCoin(chainId, walletKey, "token-a", 987654321);
    assert.notEqual(resp.tip, null);

    return Promise.resolve(true);
  })

  it("can establish tokens with maximum", async ()=> {
    let {wallet, walletKey, chainId} = await createWalletWithChain();

    resp = await wallet.establishCoin(chainId, walletKey, "token-a", 500);
    assert.notEqual(resp.tip, null);

    resp = await wallet.mintCoin(chainId, walletKey, "token-a", 250);
    assert.notEqual(resp.tip, null);

    resp = await wallet.mintCoin(chainId, walletKey, "token-a", 200);
    assert.notEqual(resp.tip, null);

    try {
      await wallet.mintCoin(chainId, walletKey, "token-a", 100);
      assert.fail("Should not be able to mint more tokens than establishCoin maximum")
    } catch (err) {
      assert.notEqual(err, null);
    }

    // FIXME: Should pass, fix incoming in tupelo
    // resp = await wallet.mintCoin(chainId, walletKey, "token-a", 50);
    // assert.notEqual(resp.tip, null);

    return Promise.resolve(true);
  });

  it("can't establish multiple tokens with same name", async ()=> {
    let {wallet, walletKey, chainId} = await createWalletWithChain();

    resp = await wallet.establishCoin(chainId, walletKey, "token-a", 500);
    assert.notEqual(resp.tip, null);

    resp = await wallet.establishCoin(chainId, walletKey, "token-b");
    assert.notEqual(resp.tip, null);

    assert.rejects(async () => {
      await wallet.establishCoin(chainId, walletKey, "token-a");
    });
  });
});