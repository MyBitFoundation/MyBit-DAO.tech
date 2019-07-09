import React, { useCallback } from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  IconRemove,
  TableCell,
  TableRow,
  theme,
} from '@aragon/ui'
import IconLabel from './IconLabel'
import { useNetwork } from '@aragon/api-react'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import { formatBalance } from '../utils'
import You from './You'
import AssetManager from './AssetManager'
import HoldingContract from './HoldingContract'
import { useIdentity } from './IdentityManager/IdentityManager'

const HolderRow = React.memo(
  ({
    address,
    balance,
    groupMode,
    isCurrentUser,
    isAssetManager,
    isHoldingContract,
    network,
    tokenDecimalsBase,
    compact,
  }) => {
    const singleToken = balance.eq(tokenDecimalsBase)

    const [label, showLocalIdentityModal] = useIdentity(address)
    const handleEditLabel = useCallback(() => showLocalIdentityModal(address))

    return (
      <TableRow>
        <FirstTableCell css="padding-right: 0">
          <Owner>
            <LocalIdentityBadge
              entity={address}
              networkType={network.type}
              connectedAccount={isCurrentUser}
            />
            {isHoldingContract && <HoldingContract />}
            {isAssetManager && <AssetManager />}
            {isCurrentUser && <You />}
          </Owner>
        </FirstTableCell>
        <TableCell align={compact ? 'left' : 'right'}>
          {formatBalance(balance, tokenDecimalsBase)}
        </TableCell>
        <TableCell align="right" css="padding-left: 0">
          <ContextMenu>
            <ContextMenuItem onClick={handleEditLabel}>
              <IconWrapper css="left: 1px">
                <IconLabel />
              </IconWrapper>
              <ActionLabel>{label ? 'Edit' : 'Add'} custom label</ActionLabel>
            </ContextMenuItem>
          </ContextMenu>
        </TableCell>
      </TableRow>
    )
  }
)

HolderRow.defaultProps = {
  address: '',
  balance: 0,
  groupMode: false,
}

const FirstTableCell = styled(TableCell)`
  max-width: 0;
  width: 100%;
  overflow: hidden;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const Owner = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  & > span:first-child {
    margin-right: 10px;
  }
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
  return <HolderRow network={network} {...props} />
}
