import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  SafeLink,
  Button,
  theme,
} from '@aragon/ui'

class UserCard extends React.Component {
  state = {
    userPic: null,
    socialData: null,
  }
  static defaultProps = {
    user: '',
    ipfs: '',
    ipfsAPI: null,
    isTokenHolder: false,
  }
  handleAuth = () => {
    const { address, onInitiateAuth } = this.props
    onInitiateAuth(address)
  }
  handleRevoke = () => {
    const { address, onInitiateRevoke } = this.props
    onInitiateRevoke(address)
  }

  componentDidMount = async () => {
    const { ipfs, ipfsURL, ipfsAPI, userAccount, getBalance } = this.props
    if(ipfsAPI){
      const ipfsContents = await ipfsAPI.get(ipfs)
      const userPic = `${ipfsURL}${ipfsContents[ipfsContents.findIndex(ipfsObject => (ipfsObject.path.includes('pic') || ipfsObject.path.includes('mugshot')))].path}`
      fetch(`${ipfsURL}${ipfsContents[ipfsContents.findIndex(ipfsObject => ipfsObject.path.includes('social-media.json'))].path}`)
        .then(response => response.json())
        .then((jsonData) => {
          const socialData = jsonData
          this.setState({
            ...this.state,
            userPic,
            socialData
          })
        })
        .catch((error) => {
          // handle your errors here
          console.error(error)
          this.setState({
            ...this.state,
            userPic
          })
        })
    }
  }


  render() {
    const {
      userPic,
      socialData,
    } = this.state
    const {
      address,
      user,
      ipfs,
      ipfsAPI,
      ipfsURL,
      isCurrentUser,
      isTokenHolder,
      onInitiateAuth,
      onInitiateRevoke,
    } = this.props

    return (
      <Card style={{position:'relative'}}>
        <SafeLink href={`${ipfsURL}${ipfs}`} target='_blank'>
          <Pic src={userPic}/>
        </SafeLink>
        {isTokenHolder && (
          <UserButtons>
            {onInitiateAuth && (
              <Button
                size='small'
                mode='secondary'
                onClick={this.handleAuth}
              >
                Initiate Approval
              </Button>
            )}
            {onInitiateRevoke && (
              <Button
                size='small'
                mode='secondary'
                onClick={this.handleRevoke}
              >
                Revoke Approval
              </Button>
            )}
          </UserButtons>
        )}
        <UserContent>
          <Owner>
            <span>{user ? user : address}</span>
            {isCurrentUser && (
              <Badge.Identity
                style={{ fontVariant: 'small-caps' }}
                title='This is your Ethereum address'
              >
                you
              </Badge.Identity>
            )}
          </Owner>
          {user && address.toLowerCase() != user.toLowerCase() && (
            <Subheader>{address}</Subheader>
          )}
          {socialData && socialData.website && socialData.website != '' && (
            <SocialLink href={socialData.website.includes('http') ? socialData.website : `http://${socialData.website}`} target='_blank'>
              <img src='images/globe-solid.svg'/>
            </SocialLink>
          )}
          {socialData && socialData.facebook && socialData.facebook != '' && (
            <SocialLink href={socialData.facebook.includes('http') ? socialData.facebook : `https://${socialData.facebook}`} target='_blank'>
              <img src='images/facebook-brands.svg'/>
            </SocialLink>
          )}
          {socialData && socialData.twitter && socialData.twitter != '' && (
            <SocialLink href={socialData.twitter.includes('http') ? socialData.twitter : `https://${socialData.twitter}`} target='_blank'>
              <img src='images/twitter-brands.svg'/>
            </SocialLink>
          )}
          {socialData && socialData.github && socialData.github != '' && (
              <SocialLink href={socialData.github.includes('http') ? socialData.github : `https://${socialData.github}`} target='_blank'>
                <img src='images/github-brands.svg'/>
              </SocialLink>
          )}
          {socialData && socialData.keybase && socialData.keybase != '' && (
            <SocialLink href={socialData.keybase.includes('http') ? socialData.keybase : `https://${socialData.keybase}`} target='_blank'>
              <img src='images/keybase-brands.svg'/>
            </SocialLink>
          )}
        </UserContent>
      </Card>
    )
  }
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  background: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
  position: relative;
`

const Pic = styled.img`
  object-fit: cover;
  width:100%;
  height: 425px;
  position:absolute;
  top:0;
`
const UserContent = styled.div`
  background-color: white;
  min-height: 65px;
  height:auto;
  width:100%;
  position: absolute;
  bottom: 0;
  padding-top:10px;
  padding-bottom:10px;
`
const UserButtons = styled.div`
  text-align: right;
  margin:10px 10px 0;
  position:absolute;
  top:0;
  right:0;
  z-index:1000;
  width:100%;
`
const Owner = styled.div`
  max-width:100%;
  display: flex;
  font-size:0.8em;
  align-items: center;
  margin-bottom: 5px;
  & > span:first-child {
    font-weight:bold;
    margin-left: 10px;
    margin-right: 10px;
  }
`
const Subheader = styled.div`
  color:${theme.textSecondary};
  max-width:100%;
  display: flex;
  font-size:0.8em;
  align-items: center;
  margin-left: 10px;
  margin-bottom: 5px;
`
const Field = styled.div`
  max-width:100%;
  display: flex;
  font-size:0.9em;
  align-items: center;
  & > img {
    width:15px;
    height:auto;
    margin-left: 10px;
    margin-right: 10px;
  }
`

const SocialLink = styled.a`
  text-decoration: none;
  height:20px;
  & > img {
    vertical-align:middle;
    opacity:0.8;
    height:20px;
    width:auto;
    margin-left: 10px;
  }
  & > img:hover {
    opacity:1;
  }
`

export default UserCard
