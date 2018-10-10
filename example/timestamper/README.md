# Timestamper
A simple timestamp logging application to demonstrate the Tupelo JavaScript API.
Save notes over time and display them in the order in which they're received
along with the UTC timestamp creation time.

## Usage
You must have Node.js installed as well as a running Tupelo RPC server listening
on "localhost:50051".

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
