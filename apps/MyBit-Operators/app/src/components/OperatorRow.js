import React, { useCallback } from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  IconRemove,
  TableCell,
  TableRow,
  SafeLink,
  theme,
  breakpoint
} from '@aragon/ui'
import IconLabel from './IconLabel'
import { useNetwork } from '@aragon/api-react'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import You from './You'
import { useIdentity } from './IdentityManager/IdentityManager'

const OperatorRow = React.memo(
  ({
    id,
    name,
    address,
    ipfs,
    ipfsURL,
    isCurrentUser,
    tokenHolder,
    network,
    compact,
    onOnboardOperator,
    onRemoveOperator,
  }) => {
    const handleOnboardOperator = useCallback(() => onOnboardOperator(name))

    const handleRemoveOperator = useCallback(() => onRemoveOperator(name))

    const [label, showLocalIdentityModal] = useIdentity(address)
    const handleEditLabel = useCallback(() => showLocalIdentityModal(address))

    return (
      <TableRow>
        <TableCell>
          <Operator>
            <LocalIdentityBadge
              entity={address}
              networkType={network.type}
              connectedAccount={isCurrentUser}
            />
            {isCurrentUser && <You />}
          </Operator>
        </TableCell>
        <TableCell css="padding-right: 0">
            {name}
        </TableCell>
        <TableCell>
          <Truncate>
            <SafeLink href={`${ipfsURL}${ipfs}`} target='_blank'>
              {ipfs}
            </SafeLink>
          </Truncate>
        </TableCell>
        <TableCell align="right" css="padding-left: 0">
          {tokenHolder && (
            <ContextMenu>
              {onOnboardOperator && (
                <ContextMenuItem onClick={handleOnboardOperator}>
                  <IconWrapper css="top: -2px">
                    <IconAdd />
                  </IconWrapper>
                  <ActionLabel>Add Operator</ActionLabel>
                </ContextMenuItem>
              )}
              {onRemoveOperator && (
                <ContextMenuItem onClick={handleRemoveOperator}>
                  <IconWrapper css="top: -2px">
                    <IconRemove />
                  </IconWrapper>
                  <ActionLabel>
                    Remove Operator
                  </ActionLabel>
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={handleEditLabel}>
                <IconWrapper css="left: 1px">
                  <IconLabel />
                </IconWrapper>
                <ActionLabel>{label ? 'Edit' : 'Add'} custom label</ActionLabel>
              </ContextMenuItem>
            </ContextMenu>
          )}
        </TableCell>
      </TableRow>
    )
  }
)

OperatorRow.defaultProps = {
  address: '',
  onOnboardOperator: () => {},
  onRemoveOperator: () => {},
}

const Operator = styled.div`
  display: flex;
  align-items: center;
  & > span:first-child {
    margin-right: 10px;
  }
`

const Truncate = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
  ${breakpoint(
    'medium',
    `
      max-width:200px;
    `
  )};
  ${breakpoint(
    'large',
    `
      max-width:100%;
    `
  )};
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const IconWrapper = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: ${theme.textSecondary};
`

export default props => {
  const network = useNetwork()
  return <OperatorRow network={network} {...props} />
}
