# MyBit-DAO.tech
Custom aragon apps + template for deploying the MyBit DAO

## Deploying Kit Locally

```sh
npm start
```

 - The DAO should automtically open in your default browser. The following addresses are available to use:

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
