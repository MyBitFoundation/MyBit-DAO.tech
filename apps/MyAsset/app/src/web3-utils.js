import { isAddress, hexToNumber } from 'web3-utils'

// Check address equality
export function addressesEqual(first, second) {
  return (
    isAddress(first) &&
    isAddress(second) &&
    first.toLowerCase() === second.toLowerCase()
  )
}

// Re-export some web3-utils functions
export { isAddress, hexToNumber } from 'web3-utils'
