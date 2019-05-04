# ownership.js
A simple example program illustrating transferring ownership of a chaintree.

This sample program allows a user to register a chaintree and then to change its owner to another
key pair.

## Installation
First you must ensure that you have installed Node.js and a Tupelo RPC server is
listening on "localhost:50051". See the Tupelo.js README for more details if
necessary before running this sample program.

NOTE: restarting the local RPC server will wipe out all data, therefore existing registered
chains will no longer work. Either remove the `.wallet-state` file to get a clean slate, or
simply register a new chain tree.

#### Usage
Once the RPC server is running you can run three commands with ownership.js. After registering a
source and a destination wallet, you can create a new chain tree and transfer it from the
originating wallet to the other one.

```shell
% > ./ownership.js --help
ownership.js <command>

Commands:
  ownership.js register <name>              Register a new wallet
  <passphrase>
  ownership.js create <name> <passphrase>   Create a new chain tree for a
                                            certain wallet
  ownership.js transfer-ownership           Transfer ownership of a chain tree
  <source-name> <source-passphrase>
  <dest-name> <dest-passphrase>

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

#### Example Usage

The following is an example of how you can use the app to register two wallets, creating
a chain tree with one of them and finally transfer ownership of the tree:
```shell
./ownership.js register wallet1 p@ssphr4se
./ownership.js register wallet2 p@ssphr4se
./ownership.js create wallet1 p@ssphr4se
./ownership.js transfer-ownership wallet1 p@ssphr4se wallet2 p@ssphr4se
```
