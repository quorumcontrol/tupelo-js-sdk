#! /usr/bin/env node
const tupelo = require('tupelo-client');
const fs = require('fs');
const yargs = require('yargs');
const assert = require('assert');

/* configuration file i/o functions */
const localIdentifierPath = './.timestamper-identifiers';

const identifierObj = (keyAddr, chainId) => {
  assert.notEqual(keyAddr, null);
  assert.notEqual(chainId, null);
  return {
    keyAddr,
    chainId,
  };
};

const dataFileExists = () => {
  return fs.existsSync(localIdentifierPath);
};

const writeIdentifierFile = (configObj) => {
  const data = JSON.stringify(configObj);
  fs.writeFileSync(localIdentifierPath, data);
};

const readIdentifierFile = () => {
  const raw = fs.readFileSync(localIdentifierPath);
  return JSON.parse(raw);
};

const TUPELO_HOST = 'localhost:50051';
const CHAIN_TREE_STAMP_PATH = 'timestamper/stamps';
const STAMP_SEPARATOR = ',,';
const NOTE_SEPARATOR = '-:';

const currentTime = () => {
  return new Date().getTime().toString();
};

const connect = (creds) => {
  return tupelo.connect(TUPELO_HOST, creds);
};

const register = async (creds) => {
  const client = connect(creds);

  await client.register();
  const {keyAddr,} = await client.generateKey();
  const {chainId,} = await client.createChainTree(keyAddr);
  const obj = identifierObj(keyAddr, chainId);
  writeIdentifierFile(obj);
};

const stamp = async (creds, notes) => {
  if (!dataFileExists()) {
    console.error('Error: you must register before you can record stamps.');
    process.exit(1);
  }

  const identifiers = readIdentifierFile();
  const client = connect(creds);

  const time = currentTime();
  const entry = time + NOTE_SEPARATOR + notes;

  const {data,} = await client.resolve(identifiers.chainId, CHAIN_TREE_STAMP_PATH);
  let stamps;
  if (data) {
    stamps = data + STAMP_SEPARATOR + entry;
  } else {
    stamps = entry;
  }

  await client.setData(identifiers.chainId, identifiers.keyAddr, CHAIN_TREE_STAMP_PATH, stamps);
};

const printTally = async (creds) => {
  if (!dataFileExists()) {
    console.error('Error: you must register before you can print stamp tallies.');
    process.exit(1);
  }

  const identifiers = readIdentifierFile();
  const client = connect(creds);

  const {data,} = await client.resolve(identifiers.chainId, CHAIN_TREE_STAMP_PATH);
  const tally = data[0];
  if (tally) {
    console.log('----Timestamps----');
    console.log(tally.replace(new RegExp(STAMP_SEPARATOR, 'g'), '\n'));
  } else {
    console.log('----No Stamps-----');
  }
};

yargs
  .demandCommand(1)
  .command('register <name> <passphrase>', 'Register a new timestamp chain tree', (yargs) => {
    yargs.positional('name', {
      describe: 'Name of the wallet to save the chain tree.'
    }).positional('passphrase', {
      describe: 'Wallet passphrase.'
    });
  }, (argv) => {
    const creds = {
      walletName: argv.name,
      passPhrase: argv.passPhrase
    };

    register(creds)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }).command('stamp <name> <passphrase>', 'Save a timestamp', (yargs) => {
    yargs.positional('name', {
      describe: 'Name of the wallet where  the chain tree is saved.'
    }).positional('passphrase', {
      describe: 'Wallet passphrase.'
    }).describe('n', 'Save a note')
      .alias('n', 'note')
      .demand('n');
  }, (argv) => {
    const creds = {
      walletName: argv.name,
      passPhrase: argv.passPhrase
    };

    stamp(creds, argv.n)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }).command('tally <name> <passphrase>', 'Print saved timestamps', (yargs) => {
    yargs.positional('name', {
      describe: 'Name of the wallet where the chain tree is saved.'
    }).positional('passphrase', {
      describe: 'Wallet passphrase.'
    });
  }, (argv) => {
    const creds = {
      walletName: argv.name,
      passPhrase: argv.passPhrase
    };
    printTally(creds)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }).argv;
