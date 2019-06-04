import BN from 'bn.js'

// Convert tokenSupply and holders balances to BNs,
// and calculate tokenDecimalsBase.
function appStateReducer(state) {

  console.log(state)
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
          .filter(({ confirmed, removed }) => (confirmed === true && removed === false))
      : [],
    proposed: operators
      ? operators
          .filter(({ proposed, confirmed, removed }) => (proposed === true && confirmed === false && removed === false))
      : [],
  }
}

export default appStateReducer
