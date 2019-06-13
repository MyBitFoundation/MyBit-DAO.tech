import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  TabBar,
  Table,
  TableHeader,
  TableRow,
  Viewport,
  breakpoint,
} from '@aragon/ui'
import OperatorRow from '../components/OperatorRow'

class Operators extends React.Component {
  static propTypes = {
    operators: PropTypes.array,
  }
  static defaultProps = {
    confirmed: [],
    proposals: [],
    requests: [],
    approved: [],
  }
  state = { selectedTab: 0 }
  render() {
    const {
      confirmed,
      proposals,
      requests,
      approved,
      userAccount,
      ipfsURL,
      onOnboardOperator,
      onRemoveOperator,
    } = this.props
    const { selectedTab } = this.state

    const items = []
    if(requests.length > 0) items.push('Requests')
    if(proposals.length > 0) items.push('Proposals')
    if(confirmed.length > 0) items.push('Confirmed')
    if(approved.length > 0) items.push('Awaiting Confirmation...')

    return (
      <Viewport>
        {({ below }) => {
          const compactTable = below('medium')
          return (
            <Main>
              <TabBarWrapper>
                <TabBar
                  items={items}
                  selected={selectedTab}
                  onChange={this.handleSelectTab}
                />
              </TabBarWrapper>
              <br/>
              <ResponsiveTable
                header={
                  <TableRow>
                    <TableHeader
                      title="Address"
                    />
                    <TableHeader
                      title='Name'
                    />
                    <TableHeader
                      title="Files"
                    />
                  </TableRow>
                }
                noSideBorders={compactTable}
              >
                {items[selectedTab] === 'Requests' && requests.map(({ id, name, address, ipfs }) => (
                    <OperatorRow
                      key={id}
                      id={id}
                      name={name}
                      address={address}
                      ipfs={ipfs}
                      ipfsURL={ipfsURL}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                      tokenHolder={true}
                      onOnboardOperator={onOnboardOperator}
                      onRemoveOperator={false}
                    />
                  )
                )}
                {items[selectedTab] === 'Proposals' && proposals.map(({ id, name, address, ipfs }) => (
                    <OperatorRow
                      key={id}
                      id={id}
                      name={name}
                      address={address}
                      ipfs={ipfs}
                      ipfsURL={ipfsURL}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                      tokenHolder={true}
                      onOnboardOperator={false}
                      onRemoveOperator={false}
                    />
                  )
                )}
                {items[selectedTab] === 'Confirmed' && confirmed.map(({ id, name, address, ipfs }) => (
                    <OperatorRow
                      key={id}
                      id={id}
                      name={name}
                      address={address}
                      ipfs={ipfs}
                      ipfsURL={ipfsURL}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                      tokenHolder={true}
                      onOnboardOperator={false}
                      onRemoveOperator={onRemoveOperator}
                    />
                  )
                )}
                {items[selectedTab] === 'Awaiting Confirmation...' && approved.map(({ id, name, address, ipfs }) => (
                    <OperatorRow
                      key={id}
                      id={id}
                      name={name}
                      address={address}
                      ipfs={ipfs}
                      ipfsURL={ipfsURL}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                      tokenHolder={true}
                      onOnboardOperator={false}
                      onRemoveOperator={false}
                    />
                  )
                )}
              </ResponsiveTable>
            </Main>
          )
        }}
      </Viewport>
    )
  }

  handleSelectTab = index => {
    this.setState({ selectedTab: index })
  }
}

const TabBarWrapper = styled.div`
  margin-top: 16px;
  & ul {
    border-bottom: none !important;
  }
  & li {
    padding: 0 20px;
  }
`

const ResponsiveTable = styled(Table)`
  margin-top: 16px;

  ${breakpoint(
    'medium',
    `
      opacity: 1;
      margin-top: 0;
    `
  )};
`

const Main = styled.div`
  max-width: 100%;

  ${breakpoint(
    'medium',
    `
      width: 100%;
    `
  )};
`

export default Operators
