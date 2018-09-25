var net = require("net");
var fs = require("fs");
var protoLoader = require("@grpc/proto-loader");
var grpc = require("@grpc/grpc-js");

var TUPELO_PROTO_FILE = __dirname + "/proto/tupelo_rpc.proto";

var tupeloPackageDefinition = protoLoader.loadSync(TUPELO_PROTO_FILE, {});
var tupeloPackage = grpc
    .loadPackageDefinition(tupeloPackageDefinition)
    .walletrpc;

/**
 * Represents a connection to a specific Tupelo wallet managed by a remote
 * Tupelo RPC server
 */
class TupeloClient {
  constructor(walletServer, walletCreds) {
    /**
     * The URL ("host:port") of the RPC wallet server to connect to
     *
     * @type {string}
     */
    this.walletServer = walletServer;

    /**
     * The name and passphrase of the wallet to connect to
     *
     * @type {Object}
     * @property {string} walletCreds.walletName - Wallet name
     * @property {string} walletCreds.passPhrase - Wallet passphrase
     */
    this.walletCreds = walletCreds;

    /**
     * Back end RPC service connection
     *
     * @type {WalletRPCService}
     */
    this.rpc = new tupeloPackage
      .WalletRPCService(walletServer, grpc.credentials.createInsecure());

  }

  /**
   * Generate a new chain tree ownership key pair.
   *
   * @param {generateKeyCallback} clbk - Will be called with the results.
   */
  generateKey(clbk) {
    this.rpc.generateKey({ creds: this.walletCreds }, clbk);
  }
  /**
   * @typedef {function} generateKeyCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.keyAddr - Public key address
   */


  /**
   * List the addresses of the keys associated with the connected wallet.
   *
   * @param {listKeysCallback} clbk - Will be called with the results.
   */
  listKeys(clbk) {
    this.rpc.listKeys({ creds: this.walletCreds }, clbk);
  }
  /**
   * @typedef {function} listKeysCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string[]} response.keyAddrs - Public key addresses associated with the connected wallet.
   */


  /**
   * Create a new chain tree owned by the key at `keyAddr`.
   *
   * @param {string} keyAddr - Address of the key that owns the new chain tree.
   * @param {createChainCallback} clbk - Will be called with the results.
   */
  createChain(keyAddr, clbk) {
    this.rpc.createChain({ creds: this.walletCreds, keyAddr: keyAddr }, clbk);
  }
  /**
   * @typedef {function} createChainCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.chainId - The ID of the new chain tree
   */


  /**
   * List the IDs of the chain trees associated with the connected wallet.
   *
   * @param {listChainIdsCallback} clbk - Will be called with the results.
   */
  listChainIds(clbk) {
    this.rpc.listChainIds({ creds: this.walletCreds }, clbk);
  }
  /**
   * @typedef {function} listKeysCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string[]} response.chainIds - Chain tree IDs associated with this wallet.
   */


  /**
   * Get the latest tip (as known by the Tupelo network signers) of the chain
   * tree with id `chainId`
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {getTipCallback} clbk - Will be called with the results.
   */
  getTip(chainId, clbk) {
    this.rpc.getTip({ creds: this.walletCreds, chainId: chainId }, clbk);
  }
  /**
   * @typedef {function} getTipCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.tip - The chain tree tip as known by the Tupelo signers
   */


  /**
   * Store data on a chain tree with a transaction validated by the network's
   * notary group.
   *
   * @param {string} chainId - The ID of the chain tree to store the data on.
   * @param {string} keyAddr - Address of the key that owns the chain tree.
   * @param {string} path - '/' delimited path into the chain tree to store the data
   * @param {string} value - The data to store.
   * @param {setDataCallback} clbk - Will be called with the results.
   */
  setData(chainId, keyAddr, path, value, clbk) {
    this.rpc.setData({
      creds: this.walletCreds,
      chainId: chainId,
      keyAddr: keyAddr,
      path: path,
      value: value,
    }, clbk);
  }
  /**
   * @typedef {function} setDataCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.tip - The chain tree tip after the transaction.
   */



  /**
   * Add the keys specified by `newOwnerKeys` to the set of owners of the chain
   * tree with id `chainId` in a transaction, and register that transaction with
   * the notary group
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string[]} newOwnerKeys - List of key addresses for the new owners
   * @param {setOwnerCallback} clbk - Will be called with the results.
   */
  setOwner(chainId, keyAddr, newOwnerKeys, clbk) {
    this.rpc.setOwner({
      creds: this.walletCreds,
      chainId: chainId,
      keyAddr: key,
      newOwnerKeys: newOwnerKeys,
    }, clbk);
  }
  /**
   * @typedef {function} setOwnerCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.tip - The chain tree tip after the transaction.
   */


  /**
   * Establish a new coin type associated with a chain tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} coinName - Name of the new coin
   * @param {number} maximum - Maximum number of coins of this type that can exist
   * @param {establishCoinCallback} clbk - Will be called with the results.
   */
  establishCoin(chainId, keyAddr, coinName, maximum, clbk) {
    this.rpc.establishCoin({
      creds: this.walletCreds,
      chainId: chainId,
      keyAddr: key,
      coinName: coinName,
      maximum: maximum,
    }, clbk);
  }
  /**
   * @typedef {function} establishCoinCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.tip - The chain tree tip after the transaction.
   */


  /**
   * Mint new coins of an already established coin type associated with a chain
   * tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} coinName - Name of the coin type
   * @param {number} amount - Number of coins to mint.
   * @param {establishCoinCallback} clbk - Will be called with the results.
   */
  mintCoin(chainId, keyAddr, coinName, amount, clbk) {
    this.rpc.mintCoin({
      creds: this.walletCreds,
      chainId: chainId,
      keyAddr: keyAddr,
      coinName: coinName,
      amount: amount,
    }, clbk);
  }
  /**
   * @typedef {function} mintCoinCallback
   * @param {?Object} error - gRPC error object (null for successful requests)
   * @param {number} error.code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @param {?Object} response - RPC server response (null for failed requests)
   * @param {string} response.tip - The chain tree tip after the transaction.
   */

}

/**
 * Connect to a Tupelo wallet managed by a remote Tupelo RPC server.
 *
 * @param {string} walletServer - "host:port" string of the RPC wallet server
 * @param {Object} walletCreds - Credentials for the connecting wallet
 * @param {string} walletCreds.walletName - Wallet name
 * @param {string} walletCreds.passPhrase - Wallet passphrase
 *
 * @return {TupeloClient} Tupelo client connection.
 */
function connect(walletServer, walletCreds) {
  return new TupeloClient(walletServer, walletCreds);
}

exports.connect = connect;
