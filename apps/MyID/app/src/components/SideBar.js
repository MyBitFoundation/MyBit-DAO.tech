import React from 'react'
import styled from 'styled-components'
import { Text, theme } from '@aragon/ui'
import { formatBalance, stakesPercentages } from '../utils'
import TokenBadge from './TokenBadge'

class SideBar extends React.Component {
  static defaultProps = {
    userFocus: '',
  }
  render() {
    const {
      userFocus
    } = this.props

    return (
      <Main>
        <Part>
          <h3>
            <Text color={theme.textSecondary} smallcaps>
              {userFocus}
            </Text>
          </h3>
        </Part>
      </Main>
    )
  }
}

const Main = styled.aside`
  flex-shrink: 0;
  flex-grow: 0;
  width: 260px;
  margin-left: 30px;
  min-height: 100%;
`

const Part = styled.section`
  margin-bottom: 55px;
  h1 {
    margin-bottom: 15px;
    color: ${theme.textSecondary};
    text-transform: lowercase;
    line-height: 30px;
    font-variant: small-caps;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid ${theme.contentBorder};
  }
`

const InfoRow = styled.li`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  list-style: none;

  > span:nth-child(1) {
    font-weight: 400;
    color: ${theme.textSecondary};
  }
  > span:nth-child(2) {
    opacity: 0;
    width: 10px;
  }
  > span:nth-child(3) {
    flex-shrink: 1;
  }
  > strong {
    text-transform: uppercase;
  }
`

const StakesBar = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;
  margin: 10px 0 30px;
  border-radius: 3px;
`

const StakesListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  list-style: none;

  > span:first-child {
    display: flex;
    align-items: center;
    max-width: 80%;
  }
`

const StakesListBullet = styled.span`
  width: 10px;
  height: 10px;
  margin-right: 15px;
  border-radius: 5px;
  flex-shrink: 0;
  & + span {
    flex-shrink: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`

export default SideBar
