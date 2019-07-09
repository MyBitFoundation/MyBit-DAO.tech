import styled from 'styled-components'
import { Badge } from '@aragon/ui'

const AssetManager = styled(Badge.Identity).attrs({
  title: "This is the Asset Manage\'r Ethereum address",
  children: 'asset manager',
})`
  font-variant: small-caps;
  margin-left: 10px;
`

export default AssetManager
