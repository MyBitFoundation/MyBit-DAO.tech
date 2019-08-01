const IPFS = require('ipfs-http-client');
let ipfs, ipfsURL;

module.exports = new Promise(function (resolve) {
    ipfs = new IPFS({ host: 'localhost', port: 5001, protocol: 'http'});

    ipfs.id(function(err, identity){
      if(err){
        ipfs = new IPFS({ host: 'ipfs.mybit.io', port: 443, protocol: 'https' });
        ipfsURL = 'https://gateway.mybit.io/ipfs/';
        resolve({ipfs, ipfsURL})

      } else {
        ipfsURL = 'http://127.0.0.1:8080/ipfs/';
        resolve({ipfs, ipfsURL})
      }
    })
  });
