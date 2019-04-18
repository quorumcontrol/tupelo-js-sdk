const assert = require("assert");
const crypto = require("crypto");
const Tupelo = require("../lib/tupelo");
const TUPELO_HOST = process.env.TUPELO_RPC_HOST || 'localhost:50051';

const createWalletWithChain = async () => {
  const wallet = Tupelo.connect(TUPELO_HOST, {
    walletName: crypto.randomBytes(32).toString('hex'),
    passPhrase: "test",
  });
  await wallet.register();
  let resp = await wallet.generateKey();
  const walletKey = resp.keyAddr;
  assert.equal(42, walletKey.length);
  let {chainId,} = await wallet.createChainTree(walletKey);
  return {wallet: wallet, walletKey: walletKey, chainId: chainId};
};

exports.createWalletWithChain = createWalletWithChain;
