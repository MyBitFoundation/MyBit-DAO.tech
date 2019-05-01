const IPFS = require('ipfs-http-client');
let ipfs, ipfsURL;
//console.log('Attempting to load local IPFS node...');
ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
ipfsURL = 'http://ipfs.mybit.io/ipfs/';

export { ipfs, ipfsURL}
