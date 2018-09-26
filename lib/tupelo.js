var net = require("net");
var fs = require("fs");
var protoLoader = require("@grpc/proto-loader");
var grpc = require("@grpc/grpc-js");

var TUPELO_PROTO_FILE = __dirname + "/proto/tupelo_rpc.proto";

var tupeloPackageDefinition = protoLoader.loadSync(TUPELO_PROTO_FILE, {});
var tupeloPackage = grpc
    .loadPackageDefinition(tupeloPackageDefinition)
    .walletrpc;

const promiseAroundRpcCallback = (toExec) => {
  return new Promise((resolve, reject) => {  
    var clbk = (err, response) => {
      if (err == null) {
        resolve(response);
      } else {
        reject(err);
      }
    }
    toExec(clbk);
  });
}

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
   * @return {Promise<generateKeyResponse, RpcError>}
   */
  generateKey() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.generateKey({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} generateKeyResponse
   * @property {string} keyAddr - Public key address
   */


  /**
   * List the addresses of the keys associated with the connected wallet.
   *
   * @return {Promise<listKeysResponse, RpcError>}
   */
  listKeys() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.listKeys({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} listKeysResponse
   * @property {string[]} keyAddrs - Public key addresses associated with the connected wallet.
   */


  /**
   * Create a new chain tree owned by the key at `keyAddr`.
   *
   * @param {string} keyAddr - Address of the key that owns the new chain tree.
   * @return {Promise<createChainResponse, RpcError>}
   */
  createChain(keyAddr) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.createChain({ creds: this.walletCreds, keyAddr: keyAddr }, clbk);
    });
  }
  /**
   * @typedef {Object} createChainResponse
   * @property {string} chainId - The ID of the new chain tree
   */


  /**
   * List the IDs of the chain trees associated with the connected wallet.
   *
   * @return {Promise<listChainIdsResponse, RpcError>}
   */
  listChainIds() {
    return promiseAroundRpcCallback(() => {
      this.rpc.listChainIds({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} listChainIdsResponse
   * @property {string[]} chainIds - Chain tree IDs associated with this wallet.
   */


  /**
   * Get the latest tip (as known by the Tupelo network signers) of the chain
   * tree with id `chainId`
   *
   * @param {string} chainId - The ID of the chain tree.
   * 
   * @return {Promise<getTipResponse, RpcError>}
   */
  getTip(chainId) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.getTip({ creds: this.walletCreds, chainId: chainId }, clbk);
    });
  }
  /**
   * @typedef {Object} getTipResponse
   * @property {string} tip - The chain tree tip as known by the Tupelo signers
   */


  /**
   * Store data on a chain tree with a transaction validated by the network's
   * notary group.
   *
   * @param {string} chainId - The ID of the chain tree to store the data on.
   * @param {string} keyAddr - Address of the key that owns the chain tree.
   * @param {string} path - '/' delimited path into the chain tree to store the data
   * @param {string} value - The data to store.
   * 
   * @return {Promise<setDataResponse, RpcError>}
   */
  setData(chainId, keyAddr, path, value) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.setData({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        path: path,
        value: value,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} setDataResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */



  /**
   * Add the keys specified by `newOwnerKeys` to the set of owners of the chain
   * tree with id `chainId` in a transaction, and register that transaction with
   * the notary group
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string[]} newOwnerKeys - List of key addresses for the new owners
   * 
   * @return {Promise<setOwnerResponse, RpcError>}
   */
  setOwner(chainId, keyAddr, newOwnerKeys) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.setOwner({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: key,
        newOwnerKeys: newOwnerKeys,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} setOwnerResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */


  /**
   * Establish a new coin type associated with a chain tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} coinName - Name of the new coin
   * @param {number} maximum - Maximum number of coins of this type that can exist
   * 
   * @return {Promise<establishCoinResponse, RpcError>}
   */
  establishCoin(chainId, keyAddr, coinName, maximum) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.establishCoin({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: key,
        coinName: coinName,
        maximum: maximum,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} establishCoinResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */


  /**
   * Mint new coins of an already established coin type associated with a chain
   * tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} coinName - Name of the coin type
   * @param {number} amount - Number of coins to mint.
   * 
   * @return {Promise<mintCoinResponse, RpcError>}
   */
  mintCoin(chainId, keyAddr, coinName, amount) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.mintCoin({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        coinName: coinName,
        amount: amount,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} mintCoinResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

  /**
   * @typedef {Object} RpcError - gRPC error object
   * @property {number} code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @property {string} details - Details about the error
   * @property {?Object} metadata - Additional information about the error
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

exports.TupeloClient = TupeloClient;
exports.connect = connect;
