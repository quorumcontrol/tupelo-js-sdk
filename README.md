# Tupelo.JS

## Usage

```javascript
var tupelo = require('tupelo');

var walletCreds = {
    walletName: 'my-wallet',
    passPhrase: 'super secret password'
}

var client = tupelo.connect('localhost:50051', walletCreds)

client.generateKey(function(err, response){
    console.log(response.keyAddr);
})
```
