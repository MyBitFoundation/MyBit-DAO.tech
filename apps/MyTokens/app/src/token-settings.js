const tokenSettings = [
  ['decimals', 'tokenDecimals', 'bignumber'],
  ['symbol', 'tokenSymbol', 'string'],
  ['name', 'tokenName', 'string'],
]

export function hasLoadedTokenSettings(state) {
  state = state || {}
  return tokenSettings.reduce(
    // Use null check as totalSupply may be 0
    (loaded, [_, key]) => loaded && state[key] != null,
    true
  )
}

export default tokenSettings
