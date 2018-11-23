const tupelo = require('tupelo-client')

const walletCreds = {
  walletName: 'my-wallet',
  passPhrase: 'super secret password'
}

const client = tupelo.connect('localhost:50051', walletCreds)

// client.generateKey().then((keyResult) => {
//   const keyAddr = keyResult.keyAddr
//   console.log('>>>', keyAddr)

//   return client.createChainTree(keyAddr)
// }).then((chainResult) => {
//   console.log('chainID', chainResult)
// })


const KeyAddr = '0xe5a36190F4d6Bc63192bAe013A66B0D6a6Ce7AcD'
const ChainId = 'did:tupelo:0xe5a36190F4d6Bc63192bAe013A66B0D6a6Ce7AcD'
const DataPath = '/petition/test-petition'

client.resolve(ChainId, DataPath)
  .then((value) => console.log('VALUE', value))
  .then(() => client.setData(ChainId, KeyAddr, DataPath, 'some-other-value3'))
  .then(() => client.resolve(ChainId, DataPath))
  .then((val) => console.log('VALUE2', val))
  .catch((err) => {
    console.log('ERR', err)
    return Promise.resolve(1)
  })