const Kit = artifacts.require('Kit')

const ensAddr = '0x98df287b6c145399aaa709692c8d308357bc085d'
const factoryAddr = '0x2298d27a9b847c681d2b2c2828ab9d79013f5f1d'

module.exports = async (callback) => {
  if (!ensAddr) {
    callback(new Error("ENS address not found in environment variable ENS"))
  }

  const kit = await Kit.new(factoryAddr, ensAddr)
  console.log(kit.address)

  callback()
}
