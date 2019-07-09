import React, { useCallback } from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  IconFundraising,
  IconShare,
  TableCell,
  TableRow,
  SafeLink,
  theme,
} from '@aragon/ui'
import IconLabel from './IconLabel'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'
import { formatBalance } from '../utils'
import You from './You'
import { useIdentity } from './IdentityManager/IdentityManager'

class ReceiptRow extends React.PureComponent{
  state = {
    note: ''
  }

  componentDidMount = async () => {
    const { ipfs, ipfsAPI } = this.props
    const files = await ipfsAPI.get(`${ipfs}/description`)
    const note = files[0].content.toString('utf8')
    this.setState({note})
  }

  handleProposal = () => {
    const { id, onCreateProposal } = this.props
    onCreateProposal(id)
  }


  render(){
    const {
      ipfs,
      ipfsAPI,
      ipfsURL,
      amount,
      erc20Symbol,
      erc20DecimalsBase,
      compact,
      onCreateProposal
    } = this.props
    const { note } = this.state

    return (
      <TableRow>

        <TableCell>
          {note}
        </TableCell>
        <AmountTableCell align='right'>
          {`${formatBalance(amount, erc20DecimalsBase)} ${erc20Symbol}`}
        </AmountTableCell>
        <TableCell align="right" css="padding-left: 0">
          <ContextMenu>
            <ContextMenuItem>
              <IconWrapper css="left: 1px">
                <IconShare />
              </IconWrapper>
              <ActionLabel>
                <a href={`${ipfsURL}${ipfs}/receipt`} target="_blank">
                  View Receipt
                </a>
              </ActionLabel>
            </ContextMenuItem>
            {onCreateProposal && (
              <ContextMenuItem onClick={this.handleProposal}>
                <IconWrapper css="left: 1px">
                  <IconFundraising />
                </IconWrapper>
                <ActionLabel>Propose Funding</ActionLabel>
              </ContextMenuItem>
            )}
          </ContextMenu>
        </TableCell>
      </TableRow>
    )
  }
}

const AmountTableCell = styled(TableCell)`
  width:auto;
  white-space:nowrap;
`

const ActionLabel = styled.span`
  margin-left: 15px;
  & > a:link {
    text-decoration:none;
  }
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
  return <ReceiptRow {...props} />
}
