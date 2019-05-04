#!/usr/bin/env node
const tupelo = require('tupelo-client');
const fs = require('fs');
const yargs = require('yargs');

const TUPELO_HOST = 'localhost:50051';
const STATE_FNAME = '.wallet-state';

const readWalletState = (walletName) => {
  const data = fs.existsSync(STATE_FNAME) ? fs.readFileSync(STATE_FNAME) : '';
  const state = JSON.parse(data || '{}');
  return state[walletName];
}

const writeWalletState = (walletName, walletState) => {
  const data = fs.existsSync(STATE_FNAME) ? fs.readFileSync(STATE_FNAME) : '';
  const state = JSON.parse(data || '{}');
  state[walletName] = walletState;
  fs.writeFileSync(STATE_FNAME, JSON.stringify(state));
}

const createChainTree = async ({name: walletName, passphrase,}) => {
  const state = readWalletState(walletName);
  if (state == null) {
    console.error(`You must register wallet ${walletName} first`);
    process.exit(1);
  }

  const client = tupelo.connect(TUPELO_HOST, {walletName, passphrase,});
  const {chainId,} = await client.createChainTree(state.keyAddr);
  
  state.chainId = chainId;
  writeWalletState(walletName, state);
};

const transferOwnership = async ({sourceName, sourcePassphrase, destName, destPassphrase,}) => {
  const sourceState = readWalletState(sourceName);
  if (sourceState == null) {
    console.error(`You must register wallet ${sourceName} first`);
    process.exit(1);
  }
  const destState = readWalletState(destName);
  if (destState == null) {
    console.error(`You must register wallet ${destName} first`);
    process.exit(1);
  }

  // Transfer ownership of chaintree from source to destination wallet
  const {chainId,} = sourceState;
  const client1 = tupelo.connect(TUPELO_HOST, {walletName: sourceName,
    passphrase: sourcePassphrase,});
  const client2 = tupelo.connect(TUPELO_HOST, {walletName: destName, passphrase: destPassphrase,});
  await client1.setOwner(sourceState.chainId, sourceState.keyAddr, [destState.keyAddr]);
  const {chainTree,} = await client1.exportChainTree(chainId);
  await client2.importChainTree(chainTree);
  
  delete sourceState.chainId;
  writeWalletState(sourceName, sourceState);

  destState.chainId = chainId;
  writeWalletState(destName, destState);

  console.log(`Successfully transferred ownership of chaintree from ${sourceName} to ${destName}`);
};

const register = async ({name: walletName, passphrase}) => {
  const client = tupelo.connect(TUPELO_HOST, {walletName, passphrase,});
  await client.register();

  const {keyAddr,} = await client.generateKey();
  writeWalletState(walletName, {keyAddr,});
};

yargs
  .demandCommand(1)
  .command('register <name> <passphrase>', 'Register a new wallet', (yargs) => {
    yargs
      .positional('name', {
        describe: 'Name of wallet.'
      })
      .positional('passphrase', {
        describe: 'Wallet passphrase.'
      })
  }, (argv) => {
    register(argv)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  })
  .command('create <name> <passphrase>', 'Create a new chain tree for a certain wallet', (yargs) => {
    yargs
      .positional('name', {
        describe: 'Name of the wallet to save the chain tree in.'
      })
      .positional('passphrase', {
        describe: 'Wallet passphrase.'
      });
  }, (argv) => {
    createChainTree(argv)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  })
  .command('transfer-ownership <source-name> <source-passphrase> <dest-name> <dest-passphrase>', 'Transfer ownership of a chain tree', (yargs) => {
    yargs
      .positional('source-name', {
        describe: 'Name of the wallet owning the chaintree.'
      })
      .positional('source-passphrase', {
        describe: 'Passphrase for wallet owning the chaintree.'
      })
      .positional('dest-name', {
        describe: 'Name of the wallet to transfer ownership to.'
      })
      .positional('dest-passphrase', {
        describe: 'Passphrase for wallet to transfer ownership to.'
      })
  }, (argv) => {
    transferOwnership(argv)
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  })
  .argv;
