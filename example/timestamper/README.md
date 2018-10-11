# stamper.js
A simple example program illustrating the basic use of Tupelo.

This sample program allows a user to register a wallet to place a chaintree in,
place a simple timestamp into a chaintree and then tally to retrieve the results
of those timestamps.

It is not useful and is provided only as a trivial example to help developers get started.

## Installation
First you must ensure that you have installed Node.js and a Tupelo RPC server is
listening on "localhost:50051". See the Tupelo.js README for more details if
necessary before running this sample program.

NOTE: restarting the local RPC server will wipe out all data, therefore existing registered chains will no longer work. Either remove the `.timestamp-identifiers` state file to get a clean slate, or simply register a new timestamp chain tree.

#### Usage
Once the RPC is running you can run three basic timestamping commands with
stamper.js. After you register, you can save notes over time and display them in
the order in which they're received along with the UTC timestamp creation time.

```shell
% > ./stamper.js --help
stamper.js [command]

Commands:
  stamper.js register [name           Register a new timestamp chain
  passphrase]                         tree
  stamper.js stamp [name passphrase]  Save a timestamp
  stamper.js tally [name passphrase   Print saved timestamps
  -n <notes>]

Options:
  --help     Show help                                     [boolean]
  --version  Show version number                           [boolean]
```

#### Examples

A sample registration request:
```shell
node stamper.js register wallet_name wallet_password
```

A sample stamp request to add a timestamp to a chaintree:
```shell
node stamper.js stamp wallet_name wallet_password -n "stamp 1"
```

A sample tally request:
```shell
node stamper.js tally wallet_name wallet_password
```