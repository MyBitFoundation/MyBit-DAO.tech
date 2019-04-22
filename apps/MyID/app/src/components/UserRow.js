import React from 'react'
import styled from 'styled-components'
import {
  TableRow,
  TableCell,
  Badge,
  SafeLink,
  Button,
} from '@aragon/ui'

class UserRow extends React.Component {
  static defaultProps = {
    user: '',
    ipfs: '',
    isTokenHolder: false,
  }
  handleInitiateAuth = () => {
    const { user, onInitiateAuth } = this.props
    onInitiateAuth(user)
  }
  render() {
    const {
      user,
      ipfs,
      ipfsURL,
      isCurrentUser,
      isTokenHolder,
    } = this.props

    return (
      <TableRow>
        <TableCell>
          <Owner>
            <span>{user}</span>
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
        <TableCell>
          <SafeLink href={`${ipfsURL}${ipfs}`} target='_blank'>
            {ipfs}
          </SafeLink>
        </TableCell>
        {isTokenHolder && (
          <TableCell>
            <Button
              mode="outline"
              onClick={this.handleInitiateAuth}
            >
              Initiate Approval
            </Button>
          </TableCell>
        )}
      </TableRow>
    )
  }
}

const Owner = styled.div`
  display: flex;
  align-items: center;
  & > span:first-child {
    margin-right: 10px;
  }
`
export default UserRow
