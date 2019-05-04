# ownership.js
A simple example program illustrating transferring ownership of a chaintree.

This sample program allows a user to register a chaintree and then to change its owner to another
key pair.

## Installation
First you must ensure that you have installed Node.js and a Tupelo RPC server is
listening on "localhost:50051". See the Tupelo.js README for more details if
necessary before running this sample program.

NOTE: restarting the local RPC server will wipe out all data, therefore existing registered
chains will no longer work. Either remove the `.ownership-identifiers` state file to get a clean
slate, or simply register a new chain tree.

#### Usage
Once the RPC is running you can run three commands with ownership.js. After registering,
you can generate a new key pair and assign it as the new chaintree owner.

```shell
% > ./ownership.js --help
ownership.js <command>

Commands:
  ownership.js register <name>              Register a new chain tree
  <passphrase>
  ownership.js generate-key <name>          Generate a new key pair
  <passphrase>
  ownership.js set-owner <name>             Set new owner for a chain tree
  <passphrase> <key>

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

#### Examples

Creating a chaintree:
```shell
./ownership.js register wallet_name wallet_password
```

Generating a new key pair:
```shell
./ownership.js generate-key wallet_name wallet_password
```

Transferring ownership of previously created chaintree to public key generated in previous step:
```shell
./ownership.js transfer-ownership wallet_name wallet_password $PUBLIC_KEY
```

