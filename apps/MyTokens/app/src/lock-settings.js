const lockSettings = [
  ['getLockAmounts', 'lockAmounts', 'array'],
  ['getLockIntervals', 'lockIntervals', 'array'],
  ['getTokenIntervals', 'tokenIntervals', 'array'],
]

export function hasLoadedLockSettings(state) {
  state = state || {}
  return lockSettings.reduce(
    // Use null check as totalSupply may be 0
    (loaded, [_, key]) => loaded && state[key] != null,
    true
  )
}

export default lockSettings
