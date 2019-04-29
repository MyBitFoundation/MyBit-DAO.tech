DAO: 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd
MiniMeToken: 0xcbd95520a09E2A8913AfCa197443a6332744f77c
MiniMeTokenFactory: 0x10277296053e8c9DC737de3AF5B0ff64274F4530
Vault: 0x96135D7F57ed40755b64aaCc06026d3F2f78c1Cf
Finance: 0xD06460dA85A055dC1B417367d7cA2DE6AE82c1cD
Voting: 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE
MyTokens: 0x6159ed12247a6bFBEf9efE2b5f88110A3086c4d9
MyID: 0x6927f3C783037dA65d2feDCdA34f5B6f0d463679


/* Install apps */
dao new --environment aragon:rinkeby --use-frame
dao token new MyVote MYV 1 --environment aragon:rinkeby --use-frame
dao install 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd vault --environment aragon:rinkeby --use-frame
dao apps 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd --all --environment aragon:rinkeby --use-frame
dao install 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd mytokens.open.aragonpm.eth --app-init none --environment aragon:rinkeby --use-frame
dao apps 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd --all --environment aragon:rinkeby --use-frame
dao token change-controller 0xcbd95520a09E2A8913AfCa197443a6332744f77c 0x6159ed12247a6bFBEf9efE2b5f88110A3086c4d9 --environment aragon:rinkeby --use-frame
dao install 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd finance --app-init-args 0x96135D7F57ed40755b64aaCc06026d3F2f78c1Cf 2592000 --environment aragon:rinkeby --use-frame
dao apps 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd --all --environment aragon:rinkeby --use-frame
dao install 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd voting --app-init-args 0xcbd95520a09E2A8913AfCa197443a6332744f77c 500000000000000001 200000000000000000 1209600 --environment aragon:rinkeby --use-frame
dao apps 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd --all --environment aragon:rinkeby --use-frame
dao install 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd myid.open.aragonpm.eth --app-init-args 0xcbd95520a09E2A8913AfCa197443a6332744f77c 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x0db0961aE68F07e25707ed132a6B6fb9A1d14a51 QmRxP22s7mXZicSh1jvQq6s1Vuosye6H887JUXCrc4t3gd --environment aragon:rinkeby --use-frame
dao apps 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd --all --environment aragon:rinkeby --use-frame

/* MYCRYPTO */
Set Vault as recovery vault
setApp():
Vault appID: 0x7e852e0fcfce6551c13800f1e7476f982525c2b5277ba14b24339c68416336d1
KERNEL_APP_ADDR_NAMESPACE: 0xd6f028ca0e8edb4a8c9757ca4fdccab25fa1e0317da1188108f7d2dee14902fb

setRecoveryVaultAppId()

Inititalize MyTokens:
["1000000000000000000", "100000000000000000000000", "100000000000000000000000", "100000000000000000000000", "100000000000000000000000"]
[0, 3, 12, 24, 36]
[10, 15, 50, 80, 130]

/* PERMISSIONS */
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE CREATE_VOTES_ROLE 0x6159ed12247a6bFBEf9efE2b5f88110A3086c4d9 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0x6159ed12247a6bFBEf9efE2b5f88110A3086c4d9 BURN_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0x6159ed12247a6bFBEf9efE2b5f88110A3086c4d9 MANAGER_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0x6927f3C783037dA65d2feDCdA34f5B6f0d463679 AUTHORIZE_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0x96135D7F57ed40755b64aaCc06026d3F2f78c1Cf TRANSFER_ROLE 0xD06460dA85A055dC1B417367d7cA2DE6AE82c1cD 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0xD06460dA85A055dC1B417367d7cA2DE6AE82c1cD CREATE_PAYMENTS_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0xD06460dA85A055dC1B417367d7cA2DE6AE82c1cD EXECUTE_PAYMENTS_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame
dao acl create 0x9809c05fc283e85Ff83963Eb0904264152a7dBdd 0xD06460dA85A055dC1B417367d7cA2DE6AE82c1cD MANAGE_PAYMENTS_ROLE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE 0x9c1260E1Ca188E3b69c6170004249d8a0B0dF3bE --environment aragon:rinkeby --use-frame