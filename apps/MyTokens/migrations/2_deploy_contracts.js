var bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 80 })
var Kit = artifacts.require('Kit.sol')
var StandardToken = artifacts.require('StandardToken.sol')
var TokenSale = artifacts.require('TokenSale.sol')

var ENS = '0x98df287b6c145399aaa709692c8d308357bc085d'
var DAOFactory = '0x2298d27a9b847c681d2b2c2828ab9d79013f5f1d';
var tokenName = 'MyBit';
var tokenSym = 'MYB';
var tokenDecimals = '18';
var tokenSupply = bn(10**30);
var lockAmount = bn(10**23).toString();
var lockIntervals = ['0', '3', '12'];
var tokenIntervals = ['1', '2', '3'];
let kit, erc20, tokensale;

module.exports = function (deployer) {
  deployer.deploy(StandardToken, tokenName, tokenSym, tokenDecimals, tokenSupply.toString()).then(function(instance){
    erc20 = instance;
    console.log('MYB: ', erc20.address);
    erc20.transfer('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7', tokenSupply.div(2).toString());
    return TokenSale.new(erc20.address, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');


  }).then(function(instance){
    tokensale = instance;
    console.log('Tokensale: ', tokensale.address);
    erc20.approve(tokensale.address, tokenSupply.div(2).toString());
    tokensale.startSale(0);
  });
    /*kit = instance;
    console.log('Kit: ', kit.address)
    return kit.newInstance(erc20.address, lockAmount, lockIntervals, tokenIntervals, {gas:3000000})
  }).then(function(instance){
    console.log(instance)
  })*/
}
