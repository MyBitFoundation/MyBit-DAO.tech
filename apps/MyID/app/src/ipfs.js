const IPFS = require('ipfs-http-client');
let ipfs, ipfsURL;
//console.log('Attempting to load local IPFS node...');
ipfs = new IPFS({ host: 'ipfs.mybit.io', port: 443, protocol: 'https' });
ipfsURL = 'https://gateway.mybit.io/ipfs/';

export { ipfs, ipfsURL}
