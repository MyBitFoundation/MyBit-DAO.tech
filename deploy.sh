#!/bin/bash

#pkill -f aragon
#aragon ipfs &
#aragon devchain --reset &
#sleep 10
#truffle migrate --reset
TOKEN=$( jq -r .Token contracts.json )
TOKENSALE=$( jq -r .Tokensale contracts.json )
#cd apps/MyTokens
#aragon apm publish major --files app/build
#cd ../MyID
#aragon apm publish major --files app/build
#cd ../MyBitTemplate
cd apps/MyBitTemplate
aragon run --template MyBitTemplate --template-init @ARAGON_ENS $TOKEN $TOKENSALE
