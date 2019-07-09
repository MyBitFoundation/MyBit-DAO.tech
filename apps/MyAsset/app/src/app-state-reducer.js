import BN from 'bn.js'
import { hasLoadedTokenSettings } from './token-settings'

// Convert tokenSupply and holders balances to BNs,
// and calculate tokenDecimalsBase.
function appStateReducer(state) {
  const appStateReady = hasLoadedTokenSettings(state)
  if (!appStateReady) {
    return {
      ...state,
      appStateReady,
    }
  }

  console.log(state)
  const {
    holders,
    fundingRequests,
    erc20Decimals,
    tokenDecimals,
    tokenSupply,
    tokenIncome,
    tokenTransfersEnabled,
    fundingGoal,
    fundingProgress
  } = state
  const tokenDecimalsBase = new BN(10).pow(new BN(tokenDecimals))
  const erc20DecimalsBase = new BN(10).pow(new BN(erc20Decimals))

  return {
    ...state,
    appStateReady,
    tokenDecimalsBase,
    erc20DecimalsBase,
    isSyncing: false,

    // Note that numbers in `numData` are not safe for accurate computations
    // (but are useful for making divisions easier)
    numData: {
      erc20Decimals: parseInt(erc20Decimals, 10),
      tokenDecimals: parseInt(tokenDecimals, 10),
      tokenSupply: parseInt(tokenSupply, 10),
    },
    holders: holders
      ? holders
          .map(holder => ({ ...holder, balance: new BN(holder.balance) }))
          .sort((a, b) => b.balance.cmp(a.balance))
      : [],
    proposals: fundingRequests
      ? fundingRequests
          .filter(({ approved, proposed, confirmed, failed }) => (approved === false && proposed === true && confirmed === false && failed === false))
          .map(request => ({ ...request, amount: new BN(request.amount) }))
      : [],
    requests: fundingRequests
      ? fundingRequests
          .filter(({ proposed, confirmed, failed }) => (proposed === false && confirmed === false && failed === false))
          .map(request => ({ ...request, amount: new BN(request.amount) }))
      : [],
    approved: fundingRequests
      ? fundingRequests
          .filter(({ approved, confirmed, failed }) => ((approved === true || confirmed === true) && failed === false))
          .map(request => ({ ...request, amount: new BN(request.amount) }))
      : [],
    erc20Decimals: new BN(erc20Decimals),
    tokenDecimals: new BN(tokenDecimals),
    tokenSupply: new BN(tokenSupply),
    tokenIncome: new BN(tokenIncome),
    fundingGoal: new BN(fundingGoal),
    fundingProgress: new BN(fundingProgress)
  }
}

export default appStateReducer
