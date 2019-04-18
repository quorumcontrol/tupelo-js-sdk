# Tupelo.js
A Node.js API client to both manage Tupelo chain trees and submit chain tree
transactions to a notary group for verification, through connecting with a Tupelo
RPC server.

## Installation and Usage
Basic installation and usage instructions are below. Visit the full
[API Documentation](https://quorumcontrol.github.io/tupelo.js/identifiers.html) for more.

### RPC Server
The Node.js client cannot directly manage chain trees nor connect to the notary
group, so Node.js applications must instead proxy through an RPC server to work
with Tupelo.

#### Installation
To install the server, first contact us to get a Tupelo binary for your platform
and save it within your command `PATH` variable. If you do not wish to save the
binary in your `PATH`, you can still execute it with the fully qualified or
relative path to your chosen location for the binary.

#### Usage
You can run the RPC server by invoking `tupelo` along with the necessary options.

##### Connecting to a Local Notary Group
To get started quickly for local development, simply run:
```shell
tupelo rpc-server --local-network 3
```

This will spin up a 3 signer local, in-memory notary group after first
generating three random keypairs for the group to use. Then it will start the
RPC server and bind it to the local notary group. Note that restarting the
server will remove all data stored by the local notary group signers! (You may
still have some retained application state.)

##### Connecting to the Tupelo Alpha Test Network
To connect to the Tupelo alpha test network notary group, contact us to get the
public key file corresponding to the running network. Then you can start the
server and bind it to the notary group with:
```shell
tupelo rpc-server --bootstrap-keys <public key file>
```

##### Other Options
`tupelo` also includes a help command that lists the available options and their
descriptions:
```shell
% > ./tupelo help rpc-server
Launches a Tupelo RPC Server

Usage:
  tupelo rpc-server [flags]

Flags:
  -k, --bootstrap-keys string   which public keys to bootstrap the notary groups with
  -h, --help                    help for rpc-server
  -l, --local-network int       Run local network with randomly generated keys, specifying number of nodes as argument. Mutually exlusive with bootstrap-*
  -t, --tls                     Encrypt connections with TLS/SSL
  -C, --tls-cert string         TLS certificate file
  -K, --tls-key string          TLS private key file
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
const tupelo = require('tupelo-client');
```

##### Wallet Credentials
The RPC server stores all the chain trees it has access to in an encrypted
wallet with a unique name and secret pass phrase. You must initialize the client
with the correct credentials for the wallet you'd like to unlock for each
RPC request. The wallet credentials should be a
[WalletCredentials object](https://quorumcontrol.github.io/tupelo.js/typedef/index.html#static-typedef-WalletCredentials) with
`walletName` and `passPhrase` keys.

```javascript
const walletCreds = {
  walletName: 'my-wallet',
  passPhrase: 'super secret password'
};
```

##### Obtaining an RPC client connection
The [`connect`](https://quorumcontrol.github.io/tupelo.js/function/index.html#static-function-connect) function takes the host:port string of the RPC server and the
wallet credentials object as arguments and returns an RPC client connection.

```javascript
const client = tupelo.connect('localhost:50051', walletCreds);
```

##### Using the API
See the [API docs](https://quorumcontrol.github.io/tupelo.js/identifiers.html) for full
information about the Tupelo.js API.

Here is an example of how to create a new key and then a chain tree owned by that key. 

```javascript
const tupelo = require('tupelo-client');

const main = async () => {
  const walletCreds = {
    walletName: 'my-wallet',
    passPhrase: 'super secret password'
  };
  const client = tupelo.connect('localhost:50051', walletCreds);

  // register a new wallet, then generate a key and chain tree stored there
  await client.register();
  const {keyAddr,} = await client.generateKey();
  const {chainId,} = await client.createChainTree(keyAddr);
  console.log(chainId);
};
```

## Tests

There are some RPC integration tests that can be run against a live Tupelo RPC
server by running `npm test`. Note that you will need a working Docker
environment setup.
