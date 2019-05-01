const erc20Settings = [
  ['decimals', 'erc20Decimals', 'bignumber'],
  ['symbol', 'erc20Symbol', 'string'],
]

export function hasLoadedERC20Settings(state) {
  state = state || {}
  return erc20Settings.reduce(
    // Use null check as totalSupply may be 0
    (loaded, [_, key]) => loaded && state[key] != null,
    true
  )
}

export default erc20Settings
