var cbor = require("cbor");

var fs = require("fs");
var net = require("net");
var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");

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
    };
    toExec(clbk);
  });
};

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
     * Back end Tupelo Wallet RPC service connection
     *
     * @type {WalletRPCService}
     */
    this.rpc = new tupeloPackage
      .WalletRPCService(walletServer, grpc.credentials.createInsecure());

  }

  /**
   * Generate a new chain tree ownership key pair.
   *
   * @return {Promise<GenerateKeyResponse, RpcError>}
   */
  generateKey() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.generateKey({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} GenerateKeyResponse
   * @property {string} keyAddr - Public key address
   */


  /**
   * List the addresses of the keys associated with the connected wallet.
   *
   * @return {Promise<ListKeysResponse, RpcError>}
   */
  listKeys() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.listKeys({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} ListKeysResponse
   * @property {string[]} keyAddrs - Public key addresses associated with the connected wallet.
   */


  /**
   * Create a new chain tree owned by the key at `keyAddr`.
   *
   * @param {string} keyAddr - Address of the key that owns the new chain tree.
   * @return {Promise<CreateChainResponse, RpcError>}
   */
  createChainTree(keyAddr) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.createChainTree({
        creds: this.walletCreds,
        keyAddr: keyAddr
      }, clbk);
    });
  }
  /**
   * @typedef {Object} CreateChainResponse
   * @property {string} chainId - The ID of the new chain tree
   */

  /**
   * Get a Base58 serialized chain tree Export
   *
   * @param {string} chainId - The ID of the chain tree to be exported
   *
   * @return {Promise<ExportChainTreeResponse, RpcError>}
   */
  exportChainTree(chainId) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.exportChainTree({
        creds: this.walletCreds,
        chainId: chainId
      }, clbk);
    });
  }
  /**
   * @typedef {Object} ExportChainTreeResponse
   * @property {SerializedChainTree} chainTree - The serialized chain tree
   */


  /**
   * Import a serialized chain tree and save it to the wallet.
   *
   * @param {string} keyAddr - Address of the key that owns the new chain tree.
   * @param {SerializedChaintree} chainTree - Serialized chain tree to import
   */
  importChainTree(keyAddr, chainTree) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.importChainTree({
        creds: this.walletCreds,
        keyAddr: keyAddr,
        chainTree: chainTree
      }, clbk);
    });
   }

  /**
   * List the IDs of the chain trees associated with the connected wallet.
   *
   * @return {Promise<ListChainIdsResponse, RpcError>}
   */
  listChainIds() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.listChainIds({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} ListChainIdsResponse
   * @property {string[]} chainIds - Chain tree IDs associated with this wallet.
   */


  /**
   * Get the latest tip (as known by the Tupelo network signers) of the chain
   * tree with id `chainId`
   *
   * @param {string} chainId - The ID of the chain tree.
   *
   * @return {Promise<GetTipResponse, RpcError>}
   */
  getTip(chainId) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.getTip({ creds: this.walletCreds, chainId: chainId }, clbk);
    });
  }
  /**
   * @typedef {Object} GetTipResponse
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
   * @return {Promise<SetDataResponse, RpcError>}
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
   * @typedef {Object} SetDataResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */


  /**
   * Resolve data stored in a specific chain tree path.
   *
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path into the chain tree where the data is stored
   */
  resolve(chainId, path) {
    return new Promise((resolve, reject) => {
      var clbk = (err, response) => {
        if (err == null) {
          cbor.Decoder.decodeAll(response.data)
            .then((decoded) => {
              response.data = decoded;
              resolve(response);
            },(err) => {
              reject(err);
            });
        } else {
          reject(err);
        }
      };

      this.rpc.resolve({
        creds: this.walletCreds,
        chainId: chainId,
        path: path,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} ResolveResponse
   * @property {string} remainingPath - The path remaining after retrieving the data
   * @property {Object} data - The data retrieved
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
   * @return {Promise<SetOwnerResponse, RpcError>}
   */
  setOwner(chainId, keyAddr, newOwnerKeys) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.setOwner({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        newOwnerKeys: newOwnerKeys,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} SetOwnerResponse
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
   * @return {Promise<EstablishCoinResponse, RpcError>}
   */
  establishCoin(chainId, keyAddr, coinName, maximum) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.establishCoin({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        coinName: coinName,
        maximum: maximum,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} EstablishCoinResponse
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
   * @return {Promise<MintCoinResponse, RpcError>}
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
   * @typedef {Object} MintCoinResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

  /**
   * @typedef {Object} SerializedChainTree
   * @property {string[]} dag - base58 encoded string array representing the chain tree dag nodes
   * @property {Map<String, SerializedSignature>} signatures - Map of serialized signatures
   */

  /**
   * @typedef {Object} SerializedSignature
   * @property {boolean[]} signers - Array indicating which signers have signed
   * @property {string} signature - base58 encoded signature
   * @property {string} type - Signature type
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
