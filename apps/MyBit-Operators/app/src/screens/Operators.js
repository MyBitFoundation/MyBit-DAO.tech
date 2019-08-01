import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  TabBar,
  Table,
  TableHeader,
  TableRow,
  Text,
  Viewport,
  breakpoint,
} from '@aragon/ui'
import OperatorRow from '../components/OperatorRow'
import AssetCard from '../components/AssetCard'
import { addressesEqual } from '../web3-utils'

class Operators extends React.Component {
  static propTypes = {
    operators: PropTypes.array,
  }
  static defaultProps = {
    assets: [],
    confirmed: [],
    proposals: [],
    requests: [],
    approved: [],
  }
  state = { selectedTab: 0 }
  render() {
    const {
      assets,
      confirmed,
      proposals,
      requests,
      approved,
      userAccount,
      isOperator,
      ipfsAPI,
      ipfsURL,
      onOnboardOperator,
      onRemoveOperator,
      onRemoveAsset,
    } = this.props
    const { selectedTab } = this.state

    const items = []
    if(requests.length > 0) items.push('Requests')
    if(proposals.length > 0) items.push('Proposals')
    if(confirmed.length > 0) items.push('Confirmed')
    if(approved.length > 0) items.push('Awaiting Confirmation...')

    const operatorAssets = assets.filter(({ address }) => (addressesEqual(address, userAccount)));

    return (
      <Viewport>
        {({ below }) => {
          const compactTable = below('medium')
          return (
            <Main>
              {isOperator && (operatorAssets.length > 0) && (
                <Assets>
                  <Text.Block size="large" weight="bold" style={{ marginLeft: '20px', marginBottom: '10px', width: '100%' }}>
                    Your Assets
                  </Text.Block>
                  <Grid>
                    {operatorAssets.map(({ id, name, ipfs }) => (
                        <AssetCard
                          key={id}
                          id={id}
                          name={name}
                          ipfs={ipfs}
                          ipfsAPI={ipfsAPI}
                          ipfsURL={ipfsURL}
                          onRemoveAsset={onRemoveAsset}
                        />
                      )
                    )}
                  </Grid>
                </Assets>
              )}

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

const Assets = styled.div`
  margin-top:20px;
  margin-bottom:20px;
  width: calc(100% - 20px);
  ${breakpoint(
    'medium',
    `
      margin-top:0;
      width:100%;
     `
  )};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 30px;
  margin-left:20px;

  ${breakpoint(
    'small',
    `
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
     `
  )};

  ${breakpoint(
    'medium',
    `
      margin-left:0;
     `
  )};
`

export default Operators
