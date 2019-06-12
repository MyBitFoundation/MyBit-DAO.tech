import BN from 'bn.js'

function appStateReducer(state) {
  if (!state) {
    return {
      ...state,
      appStateReady: false,
    }
  }

  const { operators } = state

  return {
    ...state,
    appStateReady: true,
    isSyncing: false,
    confirmed: operators
      ? operators
          .filter(({ confirmed, removed, failed }) => (confirmed === true && removed === false && failed === false))
      : [],
    proposals: operators
      ? operators
          .filter(({ proposed, confirmed, removed, failed }) => (proposed === true && confirmed === false && removed === false && failed === false))
      : [],
    requests: operators
      ? operators
          .filter(({ proposed, confirmed, removed, failed }) => (proposed === false && confirmed === false && removed === false && failed === false))
      : [],
    approved: operators
      ? operators
          .filter(({ approved, confirmed, removed, failed }) => (approved === true && confirmed === false && removed === false && failed === false))
      : [],
  }
}

export default appStateReducer
