# MyBit Tokens Aragon App
## Rinkeby Deployment
###mybit-tokens.open.aragonpm.eth v6.0.1:
 - Contract address: 0x9e30C203E106E6c07cC47E4bfED1252f44cb5516
 - Content (ipfs): QmUUuZQVmjkSz4EbHATo6pDatmjMJB4RecV9B3aFoeK6u8
 - Transaction hash: 0xc6f64624a850068e187e1381507b301bf54497346f910c3efe4eb7c495598514

###mybit-tokens.open.aragonpm.eth v6.0.0:
 - Contract address: 0x9e30C203E106E6c07cC47E4bfED1252f44cb5516
 - Content (ipfs): QmXdd39rTr8Bt5kdaZwPFD1JLJ4Lmktkxn8CG7ZHofxcdN
 - Transaction hash: 0x6646421de7eecb5e53ccbe5cec1bf2754d233fa155d40a264c0fb876af98aa24

### mybit-tokens.open.aragonpm.eth v5.0.1:
 - Contract address: 0xd30Ae575c403C55012805930ae548b7554AF3FBE
 - Content (ipfs): QmdgRFJQjtXpnEEhYdnRpFhD3zMUapriW2KwZXNLgJgsg2
 - Transaction hash: 0xd3de2f26ac05af6078a8556098f31551950c819264465cd9947df071b031659c

### mybit-tokens.open.aragonpm.eth v5.0.0:
 - Contract address: 0xd30Ae575c403C55012805930ae548b7554AF3FBE
 - Content (ipfs): QmeKibxUDxMZnbE74qDJfWuhiny5ZQkiby13X4fdaCaKEt
 - Transaction hash: 0x4897c8e7d7cde3bbd2ece6bda9c773ac26f52e9052380ed0f01698422d3e3813

### mybit-tokens.open.aragonpm.eth v4.0.0:
 - Contract address: 0xcfad9fA6322c37785e1daDd7a0fC591c3AD37305
 - Content (ipfs): QmWo5cXqEmvCRzkLRHxzSeLpEhxLFTJ6Lb9RBScqbDfbhq
 - Transaction hash: 0xaefc89699449ad88d8b2cf1484fde86f1edc456b69723273dec0770b9d60eb4e

### mybit-tokens.open.aragonpm.eth v3.0.2:
 - Contract address: 0x530FD10bc8B2F7B42687E036b046755dE4A8adBC
 - Content (ipfs): QmNn3vqFUmh4vfsbN8kQ3TGRbjNeGR4sqvc8Xpq4DU52m6
 - Transaction hash: 0x253423b86b0c087f7f3db35e1ff6cb92909d2bc66d633ac2c17d8378815dfe61

### mybit-tokens.open.aragonpm.eth v3.0.1:
 - Contract address: 0x530FD10bc8B2F7B42687E036b046755dE4A8adBC
 - Content (ipfs): QmQnzrE1xWh1wrxAYNQJ9jRh19J9gajbUKU5y5FUfdv1pp
 - Transaction hash: 0x55182426b3c5d2f2595acff8e9f73f790261b4724a6f28c1ea5c7a41e847c56a

### mybit-tokens.open.aragonpm.eth v3.0.0:
 - Contract address: 0x530FD10bc8B2F7B42687E036b046755dE4A8adBC
 - Content (ipfs): QmNa3paEtcfV7yRAxqJw5K72AsXR5bVPw9hgiqaSFai41v
 - Transaction hash: 0x760cd70d92315fee871f51831fe681565a9ce5cd44276a7476202cfc9211b01e

## Deploying Kit Locally
 - You will need to open two terminals. One in the root directory and the other in the app directory.
### App Directory
 - First, in the app directory, you must build the front-end with the following command

```sh
npm start
```

### Root Directory
 - Second, to deploy your DAO on the private network, run the following:

 ```sh
 npm run start:aragon:http:kit
 ```

 - The DAO should automtically open in your default browser. In this terminal, you should see the following:

 ```sh
Address \#1:  0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 (this account is used to deploy DAOs, it has more permissions)
Private key: a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563
Address \#2:  0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb
Private key: ce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608
```

  - You can import those private keys into MetaMask to interact with the DAO. They have been given the ERC-20 tokens needed to lock to receive voting tokens.

## Deploying from scratch using aragon-cli
### Notes
 - This app depends on two contracts which we assume are already deployed to the network. First, a standard ERC-20 token contract. The app locks ERC-20s for set periods of time in exchage for voting tokens. Second, it depends on the [MyBit Tokensale Contract](https://github.com/MyBitFoundation/MyBit-Tokensale.tech) because it rewards contributors with voting tokens.
 - If you're deploying an app from scratch, you'll need to deploy both of these contracts first via your preferred method, e.g. Truffle, Remix, MyCrypto, etc...
 - The bulk of this guide is taken from [Luke Duncan's](https://github.com/lkngtn) [post](https://forum.aragon.org/t/guide-custom-aragon-organization-deployment-using-the-cli/507) on the Aragon forums. Which is a great help to anyone interested in customizing an Aragon DAO. If you encounter any issues it is best to look there first, as he mentions several bugs that can come up and their fixes.
 - If you're using a hardware wallet for your deployment, you can use Frame by adding this flag to your commands:
 ```sh
 --use-frame
 ```
 - If you haven't used it, Frame is a great tool for injecting Web3 and signing transactions with a hardware wallet. You can check it out [here](https://github.com/floating/frame).
 - Depending on what network you deploy to, you will have to include environment flags.
 - For Rinkeby:
 ```sh
 --environment aragon:rinkeby
 ```
 - For Mainnet:
 ```sh
 --environment aragon:mainnet
 ```
 - So when I deployed the MyBit DAO to Rinkeby I did every command with the frame and rinkeby flags, e.g. to create a new DAO:
 ```sh
 dao --environment aragon:rinkeby --use-frame new
 ```
 - For this guide, no flags will be included in the instructions but please be aware that you'll need to include them depening on your use case.
 - The MyBit-Tokens app is already deployed to the Rinkeby Aragon Package Manager. So you do not have to download this repo in order to include it in a DAO. However you must install the Aragon Command Line Interface:
 ```sh
 npm install -g @aragon/cli
 ```
### Creating a blank organization
 - To create a new organization simply run:
 ```sh
 dao new
 ```
 - Take note of your DAO's address as you'll be using it a lot.

### Adding the Voting Token
 - Create a MiniMe Token to represent the voting tokens. The command will have the following format:
 ```sh
 dao token new [token-name] [symbol] [decimal-units]
 ```
 - Take note of the token address.
 - At this point, the token will not be associated with our DAO but we'll get to that in a bit.

### Adding the Vault
 - The vault will hold the DAO funds. We need it deployed first, as the MyBit-Tokens uses it to send locked tokens when a user's voting tokens are burned by community vote.
 ```sh
 dao install [dao-address] vault
 ```
 - To get the Vault's proxy address you'll need to run the following command:
 ```sh
 dao apps [dao-address] --all
 ```
 - You should see a list of apps, and a vault instance listed under permissionless apps, make a note of this address as we will need it later.

### Adding MyBit-Tokens
  - First create an instance of MyBit-Tokens in the DAO. But don't initialize it.
  ```sh
  dao install [dao-address] mybit-tokens.open.aragonpm.eth --app-init none
  ```
  - Get the proxy address from the app listing.
  ```sh
  dao apps [dao-address] --all
  ```
  - Make MyBit-Tokens the controller of the Voting Token you created earlier
  ```sh
  dao token change-controller [token-address] [mybit-tokens-address]
  ```
  - Now it's time time initialize our app. But aragon-cli has thrown some roadblocks -- it doesn't like it when we pass it arrays, which this contract uses in its initalization function. So we'll have to use an alternative for calling contract functions. I use MyCrypto, but feel free to use whatever app you're most comfortable with.
  - You'll need the the MyBit-Tokens address and the ABI to call contract functions.
  - Once you have access to the contract, go to the initialize() function.
  - You'll see a lot of fields, I'll walk through each one.
    - \_token: The address of the voting token you created earlier.
    - \_erc20: The address of the erc20 token that should already be deployed. It is used for locking.
    - \_tokensale: The address of the token sale that should also already be deployed.
    - \_vault: The address of the vault which you created earlier.
    - \_lockAmounts: An array of numbers that represent the amount of erc20 tokens that will be locked for each time interval. The amounts depend on the number of decimals used by the ERC-20 token. e.g. if you want to lock 1 token but the contract uses 18 decimals, you write 1000000000000000000. The number of items in the array depends on how many locking intervals you'd like to offer users.
    - \_lockIntervals: An array of numbers that represent the time of each locking interval in months. In the contract each month == 30 days.
    - \_tokenIntervals: An array of numbers that represent the number of voting tokens received for each locking interval. Once again the values given depend on the number of decimals that were passed when creating the contract earlier. So if you used 2 decimals, you write 1 as 100.
  - Each array must contain the same number of values. Understandably, this might be a bit confusing, so I'll try to explain it with an example. Say you want two locking intervals. For the first, you want users to be able to lock 20 erc-20 tokens for 6 months to receive 1 voting token. For the second, you want users to lock 30 erc-20 tokens for 12 months to receive 5 voting tokens. The erc-20 tokens use 18 decimals. The voting tokens use 0 decimals. These are the parameters you pass:
    - \_lockAmounts: [20000000000000000000, 30000000000000000000]
    - \_lockIntervals: [6, 12]
    - \_tokenIntervals: [1, 5]
  - One more note, I find most apps aren't able to accurately calculate gas price. When I initialized this contract with 7 locking intervals, it cost about 700,000 gas.

### Adding Voting
The voting app requires the following initialization parameters:
 - MiniMe Token: address of the voting token
 - Support Required Percentage: Percentage of yeas in casted votes for a vote to succeed (expressed as a percentage of 10^18; eg. 10^16 = 1%, 10^18 = 100%)
 - Min Accept Quorum: Percentage of yeas in total possible votes for a vote to succeed (expressed as a percentage of 10^18; eg. 10^16 = 1%, 10^18 = 100%)
 - Vote Time: Seconds that a vote will be open for token holders to vote (unless enough yeas or nays have been cast to make an early decision)

 For MyBit's Rinkeby DAO we require a support of 50% + 1, a minimum quorum of 25% and a voting period of 2 days so we do the following command:
 ```sh
 dao install [dao-address] voting --app-init-args [token-address] 500000000000000001 250000000000000000 172800
 ```
 - Again, get the app address by calling:
 ```sh
 dao apps [dao-address] --all
 ```
 - Next you'll need to add permissions linking Voting to MyBit-Tokens. The following command gives permission to create votes to users who own voting tokens.
 ```sh
 dao acl create [dao-address] [voting-app-address] CREATE_VOTES_ROLE [mybit-tokens-address] [voting-app-address]
 ```
 - Also, you'll need to give the Voting app permission to burn tokens controlled by the MyBit-Tokens app.
 ```sh
 dao acl create [dao-address] [mybit-token-address] BURN_ROLE [voting-app-address] [voting-app-address]
 ```

### Adding Finance
 - When installing the Finance app, you must pass the budget period. Here it is with a 30 day period (2592000 seconds)
 ```sh
 dao install [dao-address] finance --app-init-args [vault-address] 2592000
 ```
 - Get the app address:
 ```sh
 dao apps [dao-address] --all
 ```
 - Now we want to create a permission that grants the finance app the transfer role on the vault, we will make have voting be required to manage the permission.
 ```sh
 dao acl create [dao-address] [vault-address] TRANSFER_ROLE [finance-address] [voting-address]
 ```
 - We also want to grant some permissions on the finance app to the voting app:  
 ```sh
 dao acl create [dao-address] [finance-address] CREATE_PAYMENTS_ROLE [voting-address] [voting-address]

 dao acl create [dao-address] [finance-address] EXECUTE_PAYMENTS_ROLE [voting-address] [voting-address]

 dao acl create [dao-address] [finance-address] MANAGE_PAYMENTS_ROLE [voting-address] [voting-address]
 ```

 - That should complete your DAO! You can access the front end at https://[network].aragon.org/#/[dao-address]

## Past Rinkeby Deployments
###  mybit-tokens.open.aragonpm.eth v2.1.0:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmairPQn9Dj2Xdn9wThKCPZhE5xfkRaM6nUFYtkjrtVSfX
 - Transaction hash: 0x9c74c52e29e55570d3a112cfbd44a7945311aae601f3facdb37e3fb33a83ec9e

### mybit-tokens.open.aragonpm.eth v2.0.9:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmQNHxW11o9dbM61Jrv4TscL3DDLs8Y2zYigvJkxWhq4NP
 - Transaction hash: 0xee216022a8a2849322f899537ad4162d685f4945d0d8df7ab583e94fcf84f568

### mybit-tokens.open.aragonpm.eth v2.0.8:
- Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
- Content (ipfs): QmcYgoQoM5sDCKe1PzhbFnn2UDvh45VQDDY83dwbBGrFb8
- Transaction hash: 0x120873f5dd3a38b4028fbcbf251857d779419a61290ff804c49bd396095e672e

### mybit-tokens.open.aragonpm.eth v2.0.7:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmcYgoQoM5sDCKe1PzhbFnn2UDvh45VQDDY83dwbBGrFb8
 - Transaction hash: 0xbcb75f485247996a1af4a92b5ae04621b71453802c9802d43303a88eacc66b64

### mybit-tokens.open.aragonpm.eth v2.0.6:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmP4fCXYDyp89ETxR2rTz66XPDUtgfFyL6PLEw59SP5qud
 - Transaction hash: 0x2bb36b5eb27a525128a905d2605e395d6738f1da3440076abec778778ddf1883

### mybit-tokens.open.aragonpm.eth v2.0.5:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmfHh9zgawTta5U6TQedkkBXqFqWrVAXEM4GGcMjXfoUwH
 - Transaction hash: 0x1e4d9691355d934223a91bfce5b97522bad5719ea5041acbd9c52f373ac1d25e

### mybit-tokens.open.aragonpm.eth v2.0.4:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmbL2tQjHSNATkzXeEtJkkCjLkNY1p2QKmjNWueaNUZVkX
 - Transaction hash: 0xa6294193dd12f8cad3f90e1b6a65854cc9c8a1eaa6d5cbf8f2ccf63e209df353

### mybit-tokens.open.aragonpm.eth v2.0.3:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmfE3VdjcYgK1mQUASRYKVvghG7oH1dZs9tpV5DKVNGRBA
 - Transaction hash: 0xe5f385e7b47ca4f1904b5baa99f61ce30038ce4afd0c3a3a28a20157bd65a406

### mybit-tokens.open.aragonpm.eth v2.0.2:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmR2TQw3ba84hcw9gzZhPHPZMBnFtZ7gP8VoLcSac7QLap
 - Transaction hash: 0x7bfcc41c2575575fd0e82f9eebc9cd522d10c65174a8d225b67d5e5ea51376b1

###  mybit-tokens.open.aragonpm.eth v2.0.1:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmYMPeuAFtD1pSAChBBycF27TgMmBXvZPDVj5LXvKF99Ke
 - Transaction hash: 0xf0ed2b6b1d92b91854dbcfc55ad135e81a729e9d8e19b9e26a66c059d925ee79

### mybit-tokens.open.aragonpm.eth v2.0.0:
 - Contract address: 0x6a44c7C94D91D72AbFd5963488CbB2c26e5d9cab
 - Content (ipfs): QmSbSjDbjigLZBUTYpAzhxmf7cC6DwYh5ZgzR5ARyNi1gz
 - Transaction hash: 0xff1ea154139de35e7b1958c97855d4f1523638d81a665cb271eece98e8203679

### mybit-tokens.open.aragonpm.eth v1.0.2:
 - Contract address: 0x300d51e1084256B79A5FD09f153B20920b48e150
 - Content (ipfs): QmaRs1fhbxHw22oBA3Hx5UNEEeNAuRjHBvgUYYhweXL6du
 - Transaction hash: 0xae4ea03fc8f9af632e0dcecb5b7db42f0159199be8cdea3816df63b252c2c20e

### mybit-tokens.open.aragonpm.eth v1.0.1:
 - Contract address: 0x300d51e1084256B79A5FD09f153B20920b48e150
 - Content (ipfs): QmYXZaanjYZMyA6ciirpp9HmU9sPMzsMZAA5c2DQJzGSEX
 - Transaction hash: 0x99d4eb4de0e9fcc1ee483605f35f1537bd5b654ff1e18a7774a991d5053fc03e


### mybit-tokens.open.aragonpm.eth v1.0.0:
 - Contract address: 0x300d51e1084256B79A5FD09f153B20920b48e150
 - Content (ipfs): QmWcJR7JTBBKYC46eC4GJqAB3U76TFdd4AUewvdBdjizL3
 - Transaction hash: 0x5d3d6e8bc6e6825411ee69ccb98b97c0c3cbcc6e4dda1e36f2478c8b27e9a762
