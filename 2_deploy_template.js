const Template = artifacts.require('./MyBitTemplate.sol')
//const MiniMeTokenFactory = artifacts.require("./MiniMeTokenFactory.sol")

module.exports = function (deployer) {
  deployer.deploy(Template, '0x98df287b6c145399aaa709692c8d308357bc085d', '0xA2ead4D4185B164c06406872fF8a4A65BBC184A1', '0x027d8BBfd98F9965DFc4B2793De4fEA0173124f8', '0xB24724d93D4181bD35B8b65768FdEB55F0948015').then(function(instance){
    console.log('Template: ', instance.address);
  });
}
