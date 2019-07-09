import styled from 'styled-components'
import { Badge } from '@aragon/ui'

const HoldingContract = styled(Badge.Identity).attrs({
  title: 'This is the holding contract for tokens reserved for the current Asset Manager',
  children: 'holding contract',
})`
  font-variant: small-caps;
  margin-left: 10px;
`

export default HoldingContract
