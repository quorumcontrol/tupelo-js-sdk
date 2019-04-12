var cbor = require("cbor");

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

const CHAINTREE_DATA_PATH = "/tree/data";

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
     * @type {WalletCredentials}
     */
    this.walletCreds = walletCreds;
    /**
     * @typedef {Object} WalletCredentials
     * @property {string} walletName - Wallet name
     * @property {string} passPhrase - Wallet passphrase
     */


    /**
     * Back end Tupelo Wallet RPC service connection
     *
     * @type {WalletRPCService}
     */
    this.rpc = new tupeloPackage
      .WalletRPCService(walletServer, grpc.credentials.createInsecure());
  }

  /**
   * Register a new wallet with the client credentials.
   *
   * @return {Promise<RegisterResponse, RpcError>}
   */
  register() {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.register({ creds: this.walletCreds }, clbk);
    });
  }
  /**
   * @typedef {Object} RegisterResponse
   * @property {string} walletName - The name of the newly registered wallet
   */

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
   * @param {StorageAdapterConfig} [storageAdapter] - Storage configuration for the chain tree
   * @return {Promise<CreateChainResponse, RpcError>}
   */
  createChainTree(keyAddr, storageAdapter) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.createChainTree({
        creds: this.walletCreds,
        keyAddr: keyAddr,
        storageAdapter: storageAdapter
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
   * @param {SerializedChaintree} chainTree - Serialized chain tree to import
   * @param {StorageAdapterConfig} [storageAdapter] - Storage configuration for the chain tree
   *
   *
   * StorageAdapterConfig
   */
  importChainTree(chainTree, storageAdapter) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.importChainTree({
        creds: this.walletCreds,
        chainTree: chainTree,
        storageAdapter: storageAdapter
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
   * @param {string|number|boolean|Array|Object} value - The data to store.
   *
   * @return {Promise<SetDataResponse, RpcError>}
   */
  setData(chainId, keyAddr, path, value) {
    return promiseAroundRpcCallback((clbk) => {
      var cborData = cbor.Encoder.encode(value);
      this.rpc.setData({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        path: path,
        value: cborData,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} SetDataResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

  /**
   * Resolve data from the root of the chain tree
   *
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path into the chain tree where the data is stored
   *
   * @return {Promise<ResolveResponse, RpcError>}
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
   * Resolve data from the user portion of the chain tree
   *
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path inside of tree/data where the data is stored
   *
   * @return {Promise<ResolveResponse, RpcError>}
   */
  resolveData(chainId, path) {
    let resolvePath = CHAINTREE_DATA_PATH;
    let trimmedPath = path ? path.replace(/^\/+/g, '') : path;

    if (trimmedPath) {
      resolvePath += "/" + trimmedPath;
    }

    return this.resolve(chainId, resolvePath);
  }
  
  /**
   * Resolve data from a tip of a chain tree given a certain path.
   *
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path into the chain tree where the data is stored
   * @param {string} tip - The tip in question.
   *
   * @return {Promise<ResolveResponse, RpcError>}
   */
  async resolveAt(chainId, path, tip) {
    const response = await new Promise((resolve, reject) => {
      this.rpc.resolveAt({
        creds: this.walletCreds,
        tip,
        chainId,
        path,
      }, (err, response) => {
        if (err == null) {
          resolve(response);
        } else {
          reject(err);
        }
      });
    });

    const decoded = await cbor.Decoder.decodeAll(response.data);
    response.data = decoded;
    return response;
  }

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
   * Establish a new token type associated with a chain tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} tokenName - Name of the new token
   * @param {number} maximum - Maximum number of tokens of this type that can exist
   *
   * @return {Promise<EstablishTokenResponse, RpcError>}
   */
  establishToken(chainId, keyAddr, tokenName, maximum) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.establishToken({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        tokenName: tokenName,
        maximum: maximum,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} EstablishTokenResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */


  /**
   * Mint new tokens of an already established token type associated with a chain
   * tree.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} tokenName - Name of the token type
   * @param {number} amount - Number of tokens to mint.
   *
   * @return {Promise<MintTokenResponse, RpcError>}
   */
  mintToken(chainId, keyAddr, tokenName, amount) {
    return promiseAroundRpcCallback((clbk) => {
      this.rpc.mintToken({
        creds: this.walletCreds,
        chainId: chainId,
        keyAddr: keyAddr,
        tokenName: tokenName,
        amount: amount,
      }, clbk);
    });
  }
  /**
   * @typedef {Object} MintTokenResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

   /**
   * @typedef {Object} StorageAdapterConfigForBadger
   * @property {string} path - Path for badger db
   */

  /**
   * @typedef {Object} StorageAdapterConfigForIpld
   * @property {string} [path] - Path to ipld initialized configuration. Either path or address is required.
   * @property {string} [address] - Multiaddr for ipfs http api. Either path or address is required.
   * @property {boolean} [online=false] - if true, starts IPFS node in online mode
   */

  /**
   * @typedef {Object} StorageAdapterConfig
   * @property {StorageAdapterConfigForBadger} badger - Configure and use the badger storage adapter
   * @property {StorageAdapterConfigForIpld} ipld - Configure and use the ipld storage adapter
   */

  /**
   * @typedef {Object} SerializedChainTree
   * @property {string} tip - Hash of the latest root tree node.
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
