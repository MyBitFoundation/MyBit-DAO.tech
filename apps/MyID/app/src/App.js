import React from 'react'
//import { getProfile } from '3box'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import BN from 'bn.js'
import showdown from 'showdown'
import {
  AppBar,
  AppView,
  Badge,
  BaseStyles,
  Button,
  PublicUrl,
  SidePanel,
  font,
  observe,
  BreakPoint,
} from '@aragon/ui'
import EmptyState from './screens/EmptyState'
import Identities from './screens/Identities'
import RequestPanelContent from './components/Panels/RequestPanelContent'
import MenuButton from './components/MenuButton/MenuButton'
import { ipfs, ipfsURL } from './ipfs'
import tokenAbi from './abi/minimeToken.json'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    sendMessageToWrapper: PropTypes.func.isRequired,
  }
  static defaultProps = {
    requests: [],
    proposals: [],
    authorized: [],
    failed: [],
    approved: [],
    userAccount: '',
    tokenAddress: null,
  }
  state = {
    users: {},
    //queried: {},
    sidepanelOpened: false,
    token: null,
  }

  componentWillReceiveProps = async ({ app, tokenAddress, userAccount, users }) => {
    if(!this.state.token && tokenAddress){
      const token = app.external(tokenAddress, tokenAbi)
      this.setState({
        ...this.state,
        token,
      })
    }
    /*
    if(users){
      let userDict = this.state.users
      let queriedDict = this.state.queried
      let promiseArray = []
      let userArray = [];
      users
      .filter((user) => !queriedDict[user])
      .forEach((user) => {
        queriedDict[user] = true
        userDict[user] = user
        this.setState({users: userDict})
        this.setState({queried: queriedDict})
        promiseArray.push(getProfile(user))
        userArray.push(user)
      })
      const profiles = await Promise.all(promiseArray)
      for(var i=0; i<profiles.length; i++){
        if(profiles[i].name){
          const userIndex = users.findIndex(user =>
            addressesEqual(user, userArray[i])
          )
          if(profiles[i].name != '') userDict[users[userIndex]] = profiles[i].name
        }
      }
      this.setState({users: userDict})
      this.setState({queried: queriedDict})
    }
    */
  }

  getBalance = (userAccount) => {
    const { token } = this.state
    return new Promise((resolve, reject) =>
      token
        .balanceOf(userAccount)
        .first()
        .subscribe(resolve, reject)
    )
  }

  getUser = () => {
    return this.props.userAccount
  }

  handleSubmission = ({ buffer, type, intro, website, twitter, twitter_name, facebook, facebook_name, github, github_name, keybase, keybase_name }) => {
    const { app, userAccount } = this.props
    if(userAccount !== ''){

      //Generate json file
      const json = JSON.stringify({
                website: website,
                twitter: twitter,
                twitter_name: twitter_name,
                facebook: facebook,
                facebook_name: facebook_name,
                github: github,
                github_name: github_name,
                keybase: keybase,
                keybase_name: keybase_name,
              }, null, 4)

      //Save to IPFS and return address
      const files = [
        {
          path: 'folder/social-media.json',
          content: ipfs.types.Buffer.from(json)
        },
        {
          path: 'folder/pic.' + type,
          content: buffer
        }
      ]

      if(intro != ''){
        const converter = new showdown.Converter()
        const html = converter.makeHtml(intro)
        files.push({
          path: 'folder/introduction.html',
          content: ipfs.types.Buffer.from(html)
        })
      }

      //console.log('Uploading to IPFS. Please wait...')
      ipfs.add(files)
        .then(results => {
          const hashIndex = results.findIndex(ipfsObject => ipfsObject.path === "folder")
          this.handleSidepanelClose()
          //Save request ot Ethereum (two parts -- submitProof, then requestAuthorization (which goes to a vote))
          app
            .submitProof(results[hashIndex].hash)
            .subscribe(
              txHash => {
                //console.log('Tx: ', txHash)
              },
              err => {
                console.error(err)
              })
        })
    }
  }
  handleRequest = (user) => {
    const { app } = this.props
    app
      .requestAuthorization(user)
      .subscribe(
        txHash => {
          //console.log('Tx: ', txHash)
        },
        err => {
          console.error(err)
        })
  }
  handleRevoke = (user) => {
    const { app } = this.props
    app
      .revokeAuthorization(user)
      .subscribe(
        txHash => {
          //console.log('Tx: ', txHash)
        },
        err => {
          console.error(err)
        })
  }
  handleMenuPanelOpen = () => {
    this.props.sendMessageToWrapper('menuPanel', true)
  }
  handleSidepanelOpen = address => {
    this.setState({ sidepanelOpened: true })
  }
  handleSidepanelClose = () => {
    this.setState({ sidepanelOpened: false })
  }
  /*
  handleSidepanelTransitionEnd = open => {
    if (!open) {
      this.setState({ buffer: '' })
    }
  }
  */
  render() {
    const {
      requests,
      proposals,
      approved,
      authorized,
      failed,
      userAccount,
    } = this.props

    const {
      users,
      sidepanelOpened,
    } = this.state
    return (
      <PublicUrl.Provider url="./aragon-ui/">
        <BaseStyles />
        <Main>
          <AppView
            appBar={
              <AppBar
                title={
                  <Title>
                    <BreakPoint to="medium">
                      <MenuButton onClick={this.handleMenuPanelOpen} />
                    </BreakPoint>
                    <TitleLabel>MyID</TitleLabel>
                  </Title>
                }
                endContent={
                  <Button
                    mode="strong"
                    onClick={this.handleSidepanelOpen}
                  >
                    Request Confirmation
                  </Button>
                }
              />
            }
          >
            {(requests.length > 0 || proposals.length > 0 || authorized.length > 0 || failed.length > 0 || approved.length > 0) ? (
              <Identities
                users={users}
                requests={requests}
                proposals={proposals}
                approved={approved}
                authorized={authorized}
                failed={failed}
                userAccount={userAccount}
                ipfsAPI={ipfs}
                ipfsURL={ipfsURL}
                getBalance={this.getBalance}
                onInitiateAuth={this.handleRequest}
                onInitiateRevoke={this.handleRevoke}
              />
            ) : (
              <EmptyState onActivate={this.handleSidepanelOpen} />
            )}
          </AppView>
          <SidePanel
            title={
              'Request Identity Confirmation'
            }
            opened={sidepanelOpened}
            onClose={this.handleSidepanelClose}
            //onTransitionEnd={this.handleSidepanelTransitionEnd}
          >
            <RequestPanelContent
              opened={sidepanelOpened}
              onRequestConfirmation={this.handleSubmission}
              getUser={this.getUser}
            />
          </SidePanel>
        </Main>
      </PublicUrl.Provider>
    )
  }
}

const Main = styled.div`
  height: 100vh;
`

const Title = styled.span`
  display: flex;
  align-items: center;
`

const TitleLabel = styled.span`
  margin-right: 10px;
  ${font({ size: 'xxlarge' })};
`

export default observe(
  observable =>
    observable.map(state => {
      if (!state) {
        return
      }
      const { identities } = state
      return {
        ...state,
        users: identities
          ? identities
              .map(identity => identity.user)
          : [],
        requests: identities
          ? identities
              .filter(({ authorized, initiated }) => (authorized === false && initiated === false))
          : [],
        proposals: identities
          ? identities
              .filter(({ approved, authorized, failed, initiated }) => (approved === false && authorized === false && failed === false && initiated === true))
          : [],
        approved: identities
          ? identities
              .filter(({ approved, authorized }) => (authorized === false && approved === true))
          : [],
        authorized: identities
          ? identities
              .filter(({ authorized }) => authorized === true)
          : [],
        failed: identities
          ? identities
              .filter(({ failed }) => failed === true)
          : [],
      }
    }),
  {}
)(App)
