import BN from 'bn.js'

function appStateReducer(state) {
  if (!state) {
    return {
      ...state,
      appStateReady: false,
    }
  }

  const { operators } = state

  const newState = {
    ...state,
    appStateReady: true,
    isSyncing: false,
    confirmed: operators
      ? operators
          .filter(({ confirmed, removed, failed }) => (confirmed === true && removed === false && failed === false))
      : [],
    proposals: operators
      ? operators
          .filter(({ approved, proposed, confirmed, removed, failed }) => (approved === false && proposed === true && confirmed === false && removed === false && failed === false))
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
  return newState
}

export default appStateReducer
