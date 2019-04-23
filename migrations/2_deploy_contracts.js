const fs = require('fs');
const bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 80 })
const StandardToken = artifacts.require('StandardToken.sol')
const TokenSale = artifacts.require('TokenSale.sol')

var tokenName = 'MyBit';
var tokenSym = 'MYB';
var tokenDecimals = '18';
var tokenSupply = bn(10**30);
let erc20, tokensale;

module.exports = function (deployer) {
  deployer.deploy(StandardToken, tokenName, tokenSym, tokenDecimals, tokenSupply.toString()).then(function(instance){
    erc20 = instance;
    console.log('MYB: ', erc20.address);
    erc20.transfer('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7', tokenSupply.div(4).toString());
    erc20.transfer('0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', tokenSupply.div(4).toString());
    return TokenSale.new(erc20.address, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');

  }).then(function(instance){
    tokensale = instance;
    console.log('Tokensale: ', tokensale.address);
    erc20.approve(tokensale.address, tokenSupply.div(2).toString());
    var ts = Math.round((new Date()).getTime() / 1000);
    return tokensale.startSale(ts);

  }).then(function(){
    return tokensale.fund(0, bn(10**18).toString(), '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7');
  }).then(function(instance){
    let contracts = {
      "Token" : erc20.address,
      "Tokensale" : tokensale.address,
    }
    let contracts_json = JSON.stringify(contracts, null, 4);
    fs.writeFile('./contracts.json', contracts_json, (err) => {
      if (err) throw err;
      console.log('Contracts Saved');
    });
  });
}
