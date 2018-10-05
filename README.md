# Tupelo.JS

## Usage

```javascript
var tupelo = require('tupelo');

var walletCreds = {
    walletName: 'my-wallet',
    passPhrase: 'super secret password'
};

var client = tupelo.connect('localhost:50051', walletCreds);

var success = function(result) {
  console.log('----- success: -----');
  console.log(result);
};

var error = function(err) {
  console.log('----- error:   -----');
  console.log(err);
};

client.generateKey().then(success, error);
// ----- success: -----
// { keyAddr: '<new key address>' }
```
