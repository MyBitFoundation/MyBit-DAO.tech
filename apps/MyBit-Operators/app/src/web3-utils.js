import { isAddress, isHex } from 'web3-utils'

// Check address equality
export function addressesEqual(first, second) {
  return (
    isAddress(first) &&
    isAddress(second) &&
    first.toLowerCase() === second.toLowerCase()
  )
}

export function bytesEqual(first, second) {
  return (
    isHex(first) &&
    isHex(second) &&
    first.toLowerCase() === second.toLowerCase()
  )
}

// Re-export some web3-utils functions
export { isAddress, asciiToHex, padRight } from 'web3-utils'
