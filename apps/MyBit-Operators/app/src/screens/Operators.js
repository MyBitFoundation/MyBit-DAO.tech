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

const TABS = ['Confirmed', 'Proposed']

class Operators extends React.Component {
  static propTypes = {
    operators: PropTypes.array,
  }
  static defaultProps = {
    operators: [],
  }
  state = { selectedTab: 0 }
  render() {
    const {
      operators,
      userAccount,
    } = this.props
    const { selectedTab } = this.state

    return (
      <Viewport>
        {({ below }) => {
          const compactTable = below('medium')

          return (
            <Main>
              <TabBarWrapper>
                <TabBar
                  items={TABS}
                  selected={selectedTab}
                  onSelect={this.handleSelectTab}
                />
              </TabBarWrapper>
              {selectedTab === 0 && (
                <ResponsiveTable
                  header={
                    <TableRow>
                      <TableHeader
                        title='Operator'
                        colSpan={groupMode ? '2' : '1'}
                      />
                      {!compactTable && <TableHeader />}
                    </TableRow>
                  }
                  noSideBorders={compactTable}
                >
                  {operators.map(({ address, balance }) => (
                    <OperatorRow
                      key={address}
                      address={address}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                    />
                  ))}
                </ResponsiveTable>
              )}
              {selectedTab === 1 && (
                <ResponsiveTable
                  header={
                    <TableRow>
                      <TableHeader
                        title='Operator'
                        colSpan={groupMode ? '2' : '1'}
                      />
                      {!compactTable && <TableHeader />}
                    </TableRow>
                  }
                  noSideBorders={compactTable}
                >
                  {operators.map(({ address, balance }) => (
                    <OperatorRow
                      key={address}
                      address={address}
                      isCurrentUser={Boolean(
                        userAccount && userAccount === address
                      )}
                      compact={compactTable}
                    />
                  ))}
                </ResponsiveTable>
              )}
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
const TwoPanels = styled.div`
  width: 100%;
  ${breakpoint(
    'medium',
    `
      display: flex;
    `
  )};
`

export default Operators
