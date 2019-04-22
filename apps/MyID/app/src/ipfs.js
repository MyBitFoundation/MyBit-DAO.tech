const IPFS = require('ipfs-http-client');
let ipfs, ipfsURL;
//console.log('Attempting to load local IPFS node...');
ipfs = new IPFS({ host: 'localhost', port: 5001, protocol: 'http' });
ipfs.id(function (err, identity) {
  if (err) {
    //console.log('Failed. Loading Infura IPFS node...');
    ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    ipfsURL = 'http://ipfs.mybit.io/ipfs/';
    //console.log('Success!')
  } else {
    ipfsURL = 'http://localhost:8080/ipfs/';
    //console.log('Success!');
  }

})

export { ipfs, ipfsURL}
