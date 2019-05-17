const helpers = require("./helpers");
const assert = require("assert");
const Tagged = require("cbor/lib/tagged");
const itRequires = helpers.itRequires

describe("setting and retrieving data", function() {
  this.timeout(30000);
  let resp;

  let basicTypes = {
    stringval: "hi",
    intval: 123456789012345678901234567890,
    floatval: 99.12345678901234567890,
    trueval: true,
    falseval: false
  };

  it("can set and retrieve keys with basic values", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    for ([key, val] of Object.entries(basicTypes)) {
      resp = await wallet.setData(chainId, walletKey, key, val);
      assert.notEqual(resp.tip, null);
      resp = await wallet.resolveData(chainId, key);
      assert.deepStrictEqual(resp, {
        data: [val],
        remainingPath: '',
      });
    }
  });

  itRequires("0.2")("can retrieve a key with a basic value given a certain tip", async () => {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    for ([key, val] of Object.entries(basicTypes)) {
      let resp = await wallet.setData(chainId, walletKey, key, val);
      const {tip,} = resp;
      assert.notEqual(tip, null);
      resp = await wallet.resolveAt(chainId, `/tree/data/${key}`, tip);
      assert.deepStrictEqual(resp.data, [val,]);
      
      const newKey = `${key}New`;
      resp = await wallet.setData(chainId, walletKey, newKey, val);
      resp = await wallet.resolveAt(chainId, `/tree/data/${newKey}`, tip);
      assert.deepStrictEqual(resp.data, [null,]);
    }
  });

  it("can set and retrieve keys with array values", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    for ([key, val] of Object.entries(basicTypes)) {
      resp = await wallet.setData(chainId, walletKey, "path/to/" + key, [val, val, val]);
      assert.notEqual(resp.tip, null);
      resp = await wallet.resolveData(chainId, "path/to/" + key);
      assert.deepStrictEqual(resp, {
        data: [[val, val, val]],
        remainingPath: '',
      });
    }

    resp = await wallet.setData(chainId, walletKey, "path/to/mixedTypes", Object.values(basicTypes));
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "path/to/mixedTypes");
    assert.deepStrictEqual(resp, {
      data: [Object.values(basicTypes)],
      remainingPath: '',
    });
  });

  it("can set and retrieve keys with object values", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    for ([key, val] of Object.entries(basicTypes)) {
      resp = await wallet.setData(chainId, walletKey, "path/to/" + key, {key: val});
      assert.notEqual(resp.tip, null);
      resp = await wallet.resolveData(chainId, "path/to/" + key);
      assert.deepStrictEqual(resp, {
        data: [{key: val}],
        remainingPath: '',
      });
    }

    resp = await wallet.setData(chainId, walletKey, "path/to/full", basicTypes);
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "path/to/full");
    assert.deepStrictEqual(resp, {
      data: [basicTypes],
      remainingPath: '',
    });
  });

  it("can return remainingPath if path is not fully resolved", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    let resp = await wallet.setData(chainId, walletKey, 'key', 'value');
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, 'key/child');
    assert.deepStrictEqual(resp, {
      data: ['value'],
      remainingPath: 'child',
    });
  });

  it("can set and retrieve the root data object", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "/", basicTypes);
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "/");
    assert.deepStrictEqual(resp, {
      data: [basicTypes],
      remainingPath: '',
    });
  });

  it("can set and retrieve sibling keys", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "parent/sibling1", "val1");
    assert.notEqual(resp.tip, null);
    resp = await wallet.setData(chainId, walletKey, "parent/sibling2", "val2");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "parent");
    assert.deepStrictEqual(resp, {
      data: [{sibling1: "val1", sibling2: "val2"}],
      remainingPath: '',
    });
  });

  it("can set and retrieve first cousin keys", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "parent/sibling1/child", "val1");
    assert.notEqual(resp.tip, null);
    resp = await wallet.setData(chainId, walletKey, "parent/sibling2/child", "val2");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "parent/sibling1/child");
    assert.deepStrictEqual(resp, {
      data: ["val1"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "parent/sibling2/child");
    assert.deepStrictEqual(resp, {
      data: ["val2"],
      remainingPath: '',
    });
  });

  it("can set and retrieve second cousin keys", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "parent/sibling1/child/anotherChild", "val1");
    assert.notEqual(resp.tip, null);
    resp = await wallet.setData(chainId, walletKey, "parent/sibling2/child/anotherChild", "val2");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "parent/sibling1/child/anotherChild");
    assert.deepStrictEqual(resp, {
      data: ["val1"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "parent/sibling2/child/anotherChild");
    assert.deepStrictEqual(resp, {
      data: ["val2"],
      remainingPath: '',
    });
  });

  it("can set and retrieve basic value on ancestor with existing descendant", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "parent/sibling1/child", "val1");
    assert.notEqual(resp.tip, null);
    resp = await wallet.setData(chainId, walletKey, "parent/name", "val2");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "parent/sibling1/child");
    assert.deepStrictEqual(resp, {
      data: ["val1"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "parent/name");
    assert.deepStrictEqual(resp, {
      data: ["val2"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "parent");
    assert.strictEqual(resp.data[0].name, "val2");
    assert.equal(resp.remainingPath, '');
  });

  it("can set and retrieve descendant with with existing ancestor", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "parent", {name: "val1"});
    assert.notEqual(resp.tip, null);
    resp = await wallet.setData(chainId, walletKey, "parent/sibling1/child", "val2");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "parent/name");
    assert.deepStrictEqual(resp, {
      data: ["val1"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "parent");
    assert.strictEqual(resp.data[0].name, "val1");
    assert.equal(resp.remainingPath, '');
    assert.ok(
      (resp.data[0].sibling1 instanceof Tagged) && resp.data[0].sibling1.tag == 42
    , "Expected sibling1 to be a CID (type Tagged with tag 42)");
    resp = await wallet.resolveData(chainId, "parent/sibling1/child");
    assert.deepStrictEqual(resp, {
      data: ["val2"],
      remainingPath: '',
    });
  });

  it("can overwrite keys", async ()=> {
    let {wallet, walletKey, chainId} = await helpers.createWalletWithChain();

    resp = await wallet.setData(chainId, walletKey, "/", {stableKey: "val1", changingKey: "val2"});
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "/");
    assert.deepStrictEqual(resp, {
      data: [{stableKey: "val1", changingKey: "val2"}],
      remainingPath: '',
    });

    resp = await wallet.setData(chainId, walletKey, "changingKey", "val3");
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "/");
    assert.deepStrictEqual(resp, {
      data: [{stableKey: "val1", changingKey: "val3"}],
      remainingPath: '',
    });

    resp = await wallet.setData(chainId, walletKey, "changingKey", ["val4", "val5"]);
    assert.notEqual(resp.tip, null);
    resp = await wallet.resolveData(chainId, "stableKey");
    assert.deepStrictEqual(resp, {
      data: ["val1"],
      remainingPath: '',
    });
    resp = await wallet.resolveData(chainId, "changingKey");
    assert.deepStrictEqual(resp, {
      data: [["val4", "val5"]],
      remainingPath: '',
    });
  });
});
