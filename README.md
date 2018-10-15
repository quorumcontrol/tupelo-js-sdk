# Tupelo.js
A Node.js API client to both manage Tupelo chain trees, and submit chain tree
transactions to a notary group for verification through connecting with a Tupelo
RPC server.

## Installation and Usage
The Node.js client cannot directly manage chain trees or connect to the notary
group, so node applications must instead proxy through an RPC server to work
with Tupelo.

### RPC Server

#### Installation
To install the server, first contact us to get a Tupelo binary for your platform
and save it within your command `PATH` variable. If you do not wish to save the
binary in your `PATH`, you can still execute it with the fully qualified or
relative path to your chosen location for the binary.

#### Usage
You can run the RPC server by invoking `qc3` with the proper options. To get
started quickly in local development, simply run:
```shell
qc3 rpc-server --local-network 3
```

This will spin up a 3 signer local network and bind the rpc server to it. Note
that restarting the server will remove all data stored by the local group of
signers! (You may still have some retained in your application.)

`qc3` also includes a help command that lists the available options and their
descriptions:
```shell
% > ./qc3 help rpc-server
Launches a Tupelo RPC Server

Usage:
  qc3 rpc-server [flags]

Flags:
  -k, --bootstrap-keys string           which public keys to bootstrap the notary groups with
  -s, --bootstrap-private-keys string   which private keys to bootstrap the notary groups with
  -h, --help                            help for rpc-server
  -l, --local-network int               Run local network with randomly generated keys, specifying number of nodes as argument. Mutually exlusive with bootstrap-*
  -t, --tls                             Encrypt connections with TLS/SSL
  -C, --tls-cert string                 TLS certificate file
  -K, --tls-key string                  TLS private key file
```

### Node.js Client

#### Installation
You can install Tupelo.js with npm. Run the following command from your
project's directory to add Tupelo.js to the npm project's dependencies.

```shell
npm install tupelo-client
```

#### Usage
Once you have installed the dependency, require the `tupelo-client` module from
your application.

```javascript
var tupelo = require('tupelo-client');
```

##### Wallet Credentials
The RPC server stores all the chain trees it has access to in an encrypted
wallet with a unique name and secret pass phrase. You must initialize the client
with the correct wallet credentials for the wallet you'd like to unlock for each
RPC request. The wallet credentials should be an
[WalletCredentials object](https://quorumcontrol.github.io/tupelo.js/typedef/index.html#static-typedef-WalletCredentials) with
`walletName` and `passPhrase` keys.

```javascript
var walletCreds = {
    walletName: 'my-wallet',
    passPhrase: 'super secret password'
};
```

##### Obtaining an RPC client connection
The `connect` function takes the host:port string of the RPC server and the
wallet credentials object as arguments and returns an RPC client connection.

```javascript
var client = tupelo.connect('localhost:50051', walletCreds);
```

##### Using the API
Here is how to create a new key and then a chain tree owned by that key as an
example. See the [API docs](https://quorumcontrol.github.io/tupelo.js/) for more information about the
full Tupelo.js API.

```javascript
// save the key address and chain tree id for later use
var keyAddr, chainId;

// generate the key and chain tree
client.generateKey()
  .then(function(generateKeyResult) {
    keyAddr = generateKeyResult.keyAddr;
    return client.createChainTree(keyAddr);
  }, function(err) {
    console.log("-----------Error generating key:----------");
    console.log(err);
  }).then(function(createChainResponse) {
    chainId = createChainResponse.chainId;
    console.log("----------Chain ID:----------");
    console.log(chainId);
    return chainId;
  }, function(err) {
    console.log("-----------Error creating chain tree:----------");
    console.log(err);
  });
```
