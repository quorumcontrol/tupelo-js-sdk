#! /usr/bin/env node

const tupelo = require('tupelo-client');
const fs = require('fs');
const yargs = require('yargs');

/* configuration file i/o functions */
const localIdentifierPath = './.timestamper-identifiers';


function identifierObj(key, chain) {
    return {
        keyAddr: key,
        chainId: chain
    };
};

function dataFileExists() {
    return fs.existsSync(localIdentifierPath);
}

function writeIdentifierFile(configObj) {
    let data = JSON.stringify(configObj);
    fs.writeFileSync(localIdentifierPath, data);
};

function readIdentifierFile() {
    let raw = fs.readFileSync(localIdentifierPath);
    return JSON.parse(raw);
};

/* tupelo chain tree manipulation functions */
const TUPELO_HOST = 'localhost:50051';
const CHAIN_TREE_STAMP_PATH = 'timestamper/stamps';
const STAMP_SEPARATOR = ',,';
const NOTE_SEPARATOR = '-:';

function currentTime() {
    return new Date().getTime().toString();
};

function connect(creds) {
    return tupelo.connect(TUPELO_HOST, creds);
};

function register(creds) {
    let client = connect(creds);
    var keyAddr, chainId;

    client.generateKey()
        .then(function(generateKeyResult) {
            keyAddr = generateKeyResult.keyAddr;
            return client.createChainTree(keyAddr);
        }, function(err) {
            console.log("Error generating key.");
            console.log(err);
        }).then(function(createChainResponse) {
            chainId = createChainResponse.chainId;
            let obj = identifierObj(keyAddr, chainId);
            console.log("Saving registration.");
            return writeIdentifierFile(obj);
        }, function(err) {
            console.log("Error creating chain tree.");
            console.log(err);
        });
};

function stamp(creds, notes) {
    if (!dataFileExists()) {
        console.log("Error: you must register before you can record stamps.");

        return;
    }

    let identifiers = readIdentifierFile();
    let client = connect(creds);

    let time = currentTime();
    let entry = time + NOTE_SEPARATOR + notes;

    client.resolve(identifiers.chainId, CHAIN_TREE_STAMP_PATH)
        .then(function(resp) {
            let stamps,
                data = resp.data;

            if (data) {
                stamps = data + STAMP_SEPARATOR + entry;
            } else {
                stamps = entry;
            }

            return client.setData(identifiers.chainId,
                                  identifiers.keyAddr,
                                  CHAIN_TREE_STAMP_PATH,
                                  stamps);
        }, function(err) {
            console.log('Error reading stamps: ' + err);
        }).then(function(setDataResult) {
            console.log('Stamp recorded');
        }, function(err) {
            console.log('Error recording stamp: ' + err);
        });
};

function printTally(creds) {
    if (!dataFileExists()) {
        console.log("Error: you must register before you can print stamp tallies.");

        return;
    }

    let identifiers = readIdentifierFile();
    let client = connect(creds);
    let path = CHAIN_TREE_STAMP_PATH;

    client.resolve(identifiers.chainId, CHAIN_TREE_STAMP_PATH)
        .then(function(resp) {
            let tally = resp.data[0];

            if (tally) {
                console.log('----Timestamps----');
                console.log(tally.replace(new RegExp(STAMP_SEPARATOR, 'g'), '\n'));
            } else {
                console.log('----No Stamps-----');
            }
        }, function(err) {
            console.log('Error fetching tally: '  + err);
        });
};

yargs.command('register [name passphrase]', 'Register a new timestamp chain tree', (yargs) => {
    yargs.positional('name', {
        describe: 'Name of the wallet to save the chain tree.'
      }).positional('passphrase', {
          describe: 'Wallet passphrase.'
      });
  }, (argv) => {
      let creds = {
          walletName: argv.name,
          passPhrase: argv.passPhrase
      };

      register(creds);
  }).command('stamp [name passphrase]', 'Save a timestamp', (yargs) => {
      yargs.positional('name', {
        describe: 'Name of the wallet where  the chain tree is saved.'
      }).positional('passphrase', {
          describe: 'Wallet passphrase.'
      }).describe('n', 'Save a note')
          .alias('n', 'note')
          .demand('n');
  }, (argv) => {
      let creds = {
          walletName: argv.name,
          passPhrase: argv.passPhrase
      };

      stamp(creds, argv.n);
  }).command('tally [name passphrase -n <notes>]', 'Print saved timestamps', (yargs) => {
      yargs.positional('name', {
        describe: 'Name of the wallet where  the chain tree is saved.'
      }).positional('passphrase', {
          describe: 'Wallet passphrase.'
      });
  }, (argv) => {
      let creds = {
          walletName: argv.name,
          passPhrase: argv.passPhrase
      };

      printTally(creds);
  }).argv;
