import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  SafeLink,
  Button,
  ContextMenu,
  ContextMenuItem,
  IconRemove,
  IconShare,
  theme,
} from '@aragon/ui'

class AssetCard extends React.Component {
  state = {
    assetPic: 'images/mybit.svg',
    website: ''
  }
  static defaultProps = {
    id: '',
    address: '',
    name: '',
    ipfs: '',
    ipfsURL: 'https://gateway.ipfs.io/ipfs/'
  }
  removeAsset = () => {
    const { id, onRemoveAsset } = this.props
    onRemoveAsset(id)
  }

  componentDidMount = async () => {
    const { ipfs, ipfsURL } = this.props
    fetch(`${ipfsURL}${ipfs}`)
      .then(response => response.json())
      .then((jsonData) => {
        if(jsonData.images.length > 0){
          const assetPic = `${ipfsURL}${jsonData.images[0]}`
          this.setState({ assetPic })
        }
        if(jsonData.url !== ''){
          const website = jsonData.url
          this.setState({ website })
        }
      })
  }


  render() {
    const {
      assetPic,
      website
    } = this.state
    const {
      id,
      address,
      name,
      ipfs,
      ipfsURL,
    } = this.props

    return (
      <Card>
        <SafeLink href={`${ipfsURL}${ipfs}`} target='_blank'>
          <Pic src={assetPic}/>
        </SafeLink>
        <CardContextMenu>
          <ContextMenu>
            <ContextMenuItem>
              <IconWrapper css="top: -2px">
                <IconShare />
              </IconWrapper>
              <ActionLabel>
                <a href={(website.startsWith('https://') || website.startsWith('http://')) ? website : `https://${website}`} target="_blank">
                  Website
                </a>
              </ActionLabel>
            </ContextMenuItem>
            <ContextMenuItem onClick={this.removeAsset}>
              <IconWrapper css="top: -2px">
                <IconRemove />
              </IconWrapper>
              <ActionLabel>
                Remove Asset
              </ActionLabel>
            </ContextMenuItem>
          </ContextMenu>
        </CardContextMenu>
        <AssetInfo>
          <AssetName>{name}</AssetName>
          <ModelID>{id}</ModelID>
        </AssetInfo>
      </Card>
    )
  }
}

const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 200px;
  background: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
  position: relative;
`

const Pic = styled.img`
  object-fit: cover;
  width:100%;
  height: 160px;
  position:absolute;
  top:0;
`
const AssetInfo = styled.div`
  background-color: white;
  min-height: 20px;
  height:auto;
  width:100%;
  position: absolute;
  bottom: 0;
  padding-top:10px;
  padding-bottom:10px;
  text-align:center;
`

const AssetName = styled.h2`
  font-weight: bold;
`
const ModelID = styled.p`
  max-width:calc(100% - 20px);
  margin-left:10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size:0.7em;
`

const CardContextMenu = styled.div`
  text-align: right;
  margin:10px 10px 0;
  position:absolute;
  top:0;
  right:0;
  z-index:1000;
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

const ActionLabel = styled.span`
  margin-left: 15px;
  & > a:link {
    text-decoration:none;
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

export default AssetCard
