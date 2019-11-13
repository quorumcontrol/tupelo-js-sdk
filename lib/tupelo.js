var cbor = require("cbor");

var messages = require("tupelo-messages");
var transactions = messages.transactions;
var services = messages.services;
var rpcclient = messages.rpcclient;
var grpc = messages.grpc;

const CHAINTREE_DATA_PATH = "/tree/data";

const decodeResolveResponse = (resp) => {
  var obj = resp.toObject();
  obj.data = resp.getData_asU8();

  return obj;
};

const promiseAroundRpcCallback = (toExec) => {
  return new Promise((resolve, reject) => {
    var clbk = (err, response) => {
      if (err == null) {
        resolve(response.toObject());
      } else {
        reject(err);
      }
    };
    toExec(clbk);
  });
};

const walletCredentials = (credObj) => {
  var creds = new services.Credentials();
  creds.setWalletName(credObj.walletName);
  creds.setPassPhrase(credObj.passPhrase);

  return creds;
};

const setOwnershipPayload = (newOwnerKeys) => {
  var payload = new transactions.SetOwnershipPayload();
  payload.setAuthenticationList(newOwnerKeys);

  return payload;
};

const setOwnershipTransaction = (newOwnerKeys) => {
  var payload = setOwnershipPayload(newOwnerKeys);
  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.SETOWNERSHIP);
  txn.setSetOwnershipPayload(payload);

  return txn;
};

const setDataPayload = (path, value) => {
  var cborData = cbor.Encoder.encode(value);

  var payload = new transactions.SetDataPayload();
  payload.setPath(path);
  payload.setValue(cborData);

  return payload;
};

const setDataTransaction = (path, value) => {
  var payload = setDataPayload(path, value);
  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.SETDATA);
  txn.setSetDataPayload(payload);

  return txn;
};

const establishTokenPayload = (name, maximum) => {
  var policy = new transactions.TokenMonetaryPolicy();
  policy.setMaximum(maximum);

  var payload = new transactions.EstablishTokenPayload();
  payload.setName(name);
  payload.setMonetaryPolicy(policy);

  return payload;
};

const establishTokenTransaction = (name, maximum) => {
  var payload = establishTokenPayload(name, maximum);

  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.ESTABLISHTOKEN);
  txn.setEstablishTokenPayload(payload);

  return txn;
};

const mintTokenPayload = (name, amount) => {
  var payload = new transactions.MintTokenPayload();
  payload.setName(name);
  payload.setAmount(amount);

  return payload;
};

const mintTokenTransaction = (name, amount) => {
  var payload = mintTokenPayload(name, amount);

  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.MINTTOKEN);
  txn.setMintTokenPayload(payload);

  return txn;
};

const sendTokenPayload = (sendId, name, amount, destinationChainId) => {
  var payload = new transactions.SendTokenPayload();
  payload.setId(sendId);
  payload.setName(name);
  payload.setAmount(amount);
  payload.setDestination(destinationChainId);

  return payload;
};

const sendTokenTransaction = (sendId, name, amount, destinationChainId) => {
  var payload = sendTokenPayload(sendId, name, amount, destinationChainId);

  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.SENDTOKEN);
  txn.setSendTokenPayload(payload);

  return txn;
};

const receiveTokenPayload = (sendId, tip, signature, leaves) => {
  var payload = new transactions.ReceiveTokenPayload();
  payload.setSendTokenTransactionId(sendId);
  payload.setTip(tip);
  payload.setSignature(signature);
  payload.setLeaves(leaves);

  return payload;
};

const receiveTokenTransaction = (sendId, tip, signature, leaves) => {
  var payload = receiveTokenPayload(sendId, tip, signature, leaves);

  var txn = new transactions.Transaction();
  txn.setType(transactions.Transaction.Type.RECEIVETOKEN);
  txn.setReceiveTokenPayload(payload);

  return txn;
};

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
const connect = (walletServer, walletCreds) => {
  console.warn("tupelo-js-sdk has been deprecated. Please use https://github.com/quorumcontrol/tupelo-wasm-sdk")
  return new TupeloClient(walletServer, walletCreds);
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
     * @type {WalletCredentials}
     */
    this.walletCreds = walletCredentials(walletCreds);
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
    this.rpc = new rpcclient
      .WalletRPCServiceClient(walletServer, grpc.credentials.createInsecure());
  }

  /**
   * Register a new wallet with the client credentials.
   *
   * @return {Promise<RegisterResponse, RpcError>}
   */
  register() {
    return promiseAroundRpcCallback((clbk) => {
      var req = new services.RegisterWalletRequest();
      req.setCreds(this.walletCreds);

      this.rpc.register(req, clbk);
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
      var req = new services.GenerateKeyRequest();
      req.setCreds(this.walletCreds);

      this.rpc.generateKey(req, clbk);
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
      var req = new services.ListKeysRequest();
      req.setCreds(this.walletCreds);

      this.rpc.listKeys(req, clbk);
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
      var req = new services.GenerateChainRequest();
      req.setCreds(this.walletCreds);
      req.setKeyAddr(keyAddr);
      req.setStorageAdapter(storageAdapter);

      this.rpc.createChainTree(req, clbk);
    });
  }
  /**
   * @typedef {Object} CreateChainResponse
   * @property {string} chainId - The ID of the new chain tree
   */

  /**
   * Get a Base64 serialized chain tree Export
   *
   * @param {string} chainId - The ID of the chain tree to be exported
   *
   * @return {Promise<ExportChainTreeResponse, RpcError>}
   */
  exportChainTree(chainId) {
    var req = new services.ExportChainRequest();
    req.setCreds(this.walletCreds);
    req.setChainId(chainId);

    return promiseAroundRpcCallback((clbk) => {
      this.rpc.exportChainTree(req, clbk);
    });
  }
  /**
   * @typedef {Object} ExportChainTreeResponse
   * @property {string} chainTree - The base64 serialized chain tree
   */


  /**
   * Import a serialized chain tree and save it to the wallet.
   *
   * @param {string} chainTree - The base64 serialized chain tree to import
   * @param {StorageAdapterConfig} [storageAdapter] - Storage configuration for the chain tree
   *
   *
   * StorageAdapterConfig
   */
  importChainTree(chainTree, storageAdapter) {
    var req = new services.ImportChainRequest();
    req.setCreds(this.walletCreds);
    req.setChainTree(chainTree);

    return promiseAroundRpcCallback((clbk) => {
      this.rpc.importChainTree(req, clbk);
    });
  }

  /**
   * List the IDs of the chain trees associated with the connected wallet.
   *
   * @return {Promise<ListChainIdsResponse, RpcError>}
   */
  listChainIds() {
    var req = new services.ListChainIdsRequest();
    req.setCreds(this.walletCreds);

    return promiseAroundRpcCallback((clbk) => {
      this.rpc.listChainIds(req, clbk);
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
    var req = new services.GetTipRequest();
    req.setCreds(this.walletCreds);
    req.setChainId(chainId);

    return promiseAroundRpcCallback((clbk) => {
      this.rpc.getTip(req, clbk);
    });
  }
  /**
   * @typedef {Object} GetTipResponse
   * @property {string} tip - The chain tree tip as known by the Tupelo signers
   */


  /**
   * Apply a sequence of transactions to a chain tree
   *
   * @param {string} chainId - The ID of the chain tree to store the data on.
   * @param {string} keyAddr - Address of the key that owns the chain tree.
   * @param {Object[]} transactions - List of transactions to apply
   *
   * @return {Promise<PlayTransactionsResponse, RpcError>}
   */
  playTransactions(chainId, keyAddr, transactions) {
    var req = new services.PlayTransactionsRequest();
    req.setCreds(this.walletCreds);
    req.setChainId(chainId);
    req.setKeyAddr(keyAddr);
    req.setTransactionsList(transactions);

    return promiseAroundRpcCallback((clbk) => {
      this.rpc.playTransactions(req, clbk);
    });
  }
  /**
   * @typedef {Object} PlayTransactionsResponse
   * @property {string} tip - The chain tree tip as known by the Tupelo signers after the transactions are applied
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
    var transaction = setDataTransaction(path, value);

    return this.playTransactions(chainId, keyAddr, [transaction]);
  }
  /**
   * @typedef {Object} SetDataResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

  /**
   * Resolve data from the root of the chain tree.
   *
   * The data will be resolved in the tree according to the path until we reach the end
   * of the path or a leaf node. If we reach a leaf node before the end of the path,
   * the data at the leaf node is returned and the remaining unresolved part of the path is
   * set as the response's `remainingPath` property.
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path into the chain tree where the data is stored.
   *
   * @return {Promise<ResolveResponse, RpcError>}
   */
  resolve(chainId, path) {
    return new Promise((resolve, reject) => {
      var clbk = (err, response) => {
        if (err == null) {
          var responseObj = decodeResolveResponse(response);

          cbor.Decoder.decodeAll(responseObj.data)
            .then((decoded) => {
              responseObj.data = decoded;
              if (responseObj.remainingPath == null) {
                responseObj.remainingPath = '';
              }
              resolve(responseObj);
            },(err) => {
              reject(err);
            });
        } else {
          reject(err);
        }
      };

      var req = new services.ResolveRequest();
      req.setCreds(this.walletCreds);
      req.setChainId(chainId);
      req.setPath(path);

      this.rpc.resolve(req, clbk);
    });
  }
  /**
   * @typedef {Object} ResolveResponse
   * @property {string} remainingPath - The path remaining after retrieving the data
   * @property {Object} data - The data retrieved
   */

  /**
   * Resolve data from the user portion ("/tree/data") of the chain tree.
   *
   * The data will be resolved in the tree according to the path until we reach the end
   * of the path or a leaf node. If we reach a leaf node before the end of the path,
   * the data at the leaf node is returned and the remaining unresolved part of the path is
   * set as the response's `remainingPath` property.
   * @param {string} chainId - The ID of the chain tree to retrieve the data from.
   * @param {string} path - '/' delimited path inside of tree/data where the data is stored.
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
      var req = new services.ResolveAtRequest();
      req.setCreds(this.walletCreds);
      req.setChainId(chainId);
      req.setPath(path);
      req.setTip(tip);

      this.rpc.resolveAt(req, (err, response) => {
        if (err == null) {
          resolve(decodeResolveResponse(response));
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
   * Define the set of owners of the chain tree with ID `chainId` as the set of keys in
   * `newOwnerKeys` in a transaction, and register that transaction with the notary group.
   *
   * @param {string} chainId - The ID of the chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string[]} newOwnerKeys - List of key addresses for the new owners.
   *
   * @return {Promise<SetOwnerResponse, RpcError>}
   */
  setOwner(chainId, keyAddr, newOwnerKeys) {
    var transaction = setOwnershipTransaction(newOwnerKeys);

    return this.playTransactions(chainId, keyAddr, [transaction]);
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
    var transaction = establishTokenTransaction(tokenName, maximum);

    return this.playTransactions(chainId, keyAddr, [transaction]);
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
    var transaction = mintTokenTransaction(tokenName, amount);

    return this.playTransactions(chainId, keyAddr, [transaction]);
  }
  /**
   * @typedef {Object} MintTokenResponse
   * @property {string} tip - The chain tree tip after the transaction.
   */

  /**
   * Send an amount of minted tokens to another chain tree.
   *
   * @param {string} chainId - The ID of the sending chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} tokenName - Name of the token type.
   * @param {string} destinationChainId - The ID of the recipient chain tree.
   * @param {number} amount - Number of tokens to send.
   */
   sendToken(chainId, keyAddr, tokenName, destinationChainId, amount) {
     return promiseAroundRpcCallback((clbk) => {
       var req = new services.SendTokenRequest();
       req.setCreds(this.walletCreds);
       req.setChainId(chainId);
       req.setKeyAddr(keyAddr);
       req.setTokenName(tokenName);
       req.setDestinationChainId(destinationChainId);
       req.setAmount(amount);

       this.rpc.sendToken(req, clbk);
     });
   }

   /**
   * Receive a send token payload from another chain tree.
   *
   * @param {string} chainId - The ID of the sending chain tree.
   * @param {string} keyAddr - Address of a key that currently owns the chain tree.
   * @param {string} tokenPayload - The base64-encoded token send payload.
   */
   receiveToken(chainId, keyAddr, tokenPayload) {
     return promiseAroundRpcCallback((clbk) => {
       var req = new services.ReceiveTokenRequest();
       req.setCreds(this.walletCreds);
       req.setChainId(chainId);
       req.setKeyAddr(keyAddr);
       req.setTokenPayload(tokenPayload);

       this.rpc.receiveToken(req, clbk);
     });
   }

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
   * @typedef {Object} RpcError - gRPC error object
   * @property {number} code - A [gRPC status](https://grpc.io/grpc/node/grpc.html#.status)
   * @property {string} details - Details about the error
   * @property {?Object} metadata - Additional information about the error
   */
}

exports.setOwnershipPayload = setOwnershipPayload;
exports.setOwnershipTransaction = setOwnershipTransaction;
exports.setDataPayload = setDataPayload;
exports.setDataTransaction = setDataTransaction;
exports.establishTokenPayload = establishTokenPayload;
exports.establishTokenTransaction = establishTokenTransaction;
exports.mintTokenPayload = mintTokenPayload;
exports.mintTokenTransaction = mintTokenTransaction;
exports.connect = connect;
exports.TupeloClient = TupeloClient;
