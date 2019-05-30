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

exports.itRequires = (version) => {
  const curVer = process.env.TUPELO_VERSION || "";
  if (curVer === "" || curVer === "master") {
    return it;
  }

  const [curMajor, curMinor, curPatch] = curVer.split(".");
  const components = version.split(".");
  const numComponents = components.length;
  if (numComponents === 0) {
    return it;
  }

  if (components[0] > curMajor) {
    return it.skip;
  }
  if (numComponents === 1) {
    return it;
  }
  if (components[1] > curMinor) {
    return it.skip;
  }
  if (numComponents === 2) {
    return it;
  }
  if (components[2] > curPatch) {
    return it.skip;
  }

  return it;
}
