import React from 'react'
import styled from 'styled-components'
import {
  TableRow,
  TableCell,
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  IconRemove,
  Badge,
  theme,
} from '@aragon/ui'
import { formatBalance } from '../utils'

class HolderRow extends React.Component {
  static defaultProps = {
    address: '',
    balance: 0,
    onLockTokens: () => {},
    onUnlockTokens: () => {},
  }
  handleLockTokens = () => {
    const { address, onLockTokens } = this.props
    onLockTokens(address)
  }
  handleUnlockTokens = () => {
    const { address, onUnlockTokens } = this.props
    onUnlockTokens(address)
  }
  handleBurnTokens = () => {
    const { address, onBurnTokens } = this.props
    onBurnTokens(address)
  }
  render() {
    const {
      address,
      name,
      balance,
      contribution,
      claimed,
      claimAmount,
      isCurrentUser,
      maxAccountTokens,
      tokenDecimalsBase,
      ethDecimalsBase,
      erc20Symbol
    } = this.props
    const singleToken = balance.eq(tokenDecimalsBase)
    const canLock = balance.lt(maxAccountTokens)

    return (
      <TableRow>
        <TableCell>
          <Owner>
            <span>{name}</span>
            {isCurrentUser && (
              <Badge.Identity
                style={{ fontVariant: 'small-caps' }}
                title="This is your Ethereum address"
              >
                you
              </Badge.Identity>
            )}
          </Owner>
        </TableCell>
        <TableCell align="right">
          {formatBalance(contribution, ethDecimalsBase)}
        </TableCell>
        <TableCell align="right">
          {formatBalance(balance, tokenDecimalsBase)}
        </TableCell>
        <TableCell align="right">
          <ContextMenu>
            {isCurrentUser && canLock && (
              <ContextMenuItem onClick={this.handleLockTokens}>
                <IconWrapper>
                  <IconAdd />
                </IconWrapper>
                <ActionLabel>Lock {erc20Symbol}</ActionLabel>
              </ContextMenuItem>
            )}
            {isCurrentUser && balance > (claimed ? claimAmount : 0) && (
              <ContextMenuItem onClick={this.handleUnlockTokens}>
                <IconWrapper>
                  <IconRemove />
                </IconWrapper>
                <ActionLabel>
                  Unlock {erc20Symbol}
                  {singleToken ? '' : 's'}
                </ActionLabel>
              </ContextMenuItem>
            )}
            {!isCurrentUser && balance > 0 && (
              <ContextMenuItem onClick={this.handleBurnTokens}>
                <IconWrapper>
                  <IconRemove />
                </IconWrapper>
                <ActionLabel>
                  Burn Token
                  {singleToken ? '' : 's'}
                </ActionLabel>
              </ContextMenuItem>
            )}
          </ContextMenu>
        </TableCell>
      </TableRow>
    )
  }
}

const ActionLabel = styled.span`
  margin-left: 15px;
`

const Owner = styled.div`
  display: flex;
  align-items: center;
  & > span:first-child {
    margin-right: 10px;
  }
`

const IconWrapper = styled.span`
  display: flex;
  align-content: center;
  margin-top: -3px;
  color: ${theme.textSecondary};
`

export default HolderRow
