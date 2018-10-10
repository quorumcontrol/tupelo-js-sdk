# stamper.js
A simple example program illustrating the basic use of Tupelo.

This sample program allows a user to register a wallet to place a chaintree in, 
place a simple timestamp into a chaintree and then tally to retrieve the results 
of those timestamps.  

It is not useful and is provided only as a trivial example to help developers get started.

## Installation
First you must ensure a Tupelo RPC server is running.  See the Tupelo.js README for details
on completeing that before running this sample program.

#### Usage
Once the RPC is running you can run three basic timestamping commands with stamper.js. 

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
