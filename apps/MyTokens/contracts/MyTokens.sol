/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

/* solium-disable function-order */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";

import "@aragon/os/contracts/lib/token/ERC20.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "@aragon/apps-shared-minime/contracts/ITokenController.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "../../../contracts/WhitelistInterface.sol";

interface TokenSaleInterface {
  function getWeiContributed(uint16 _day, address _contributor) external view returns (uint256);
}

interface VaultInterface {
  function deposit(address _token, uint256 _value) external payable;
}

contract MyTokens is ITokenController, IForwarder, AragonApp {
    using SafeMath for uint256;

    //Events
    event TokenClaimed(address user);
    event TokensLocked(address user, uint256 amount);
    event TokensBurned(address user, uint256 amount, string message);

    bytes32 public constant BURN_ROLE = keccak256("BURN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    string private constant ERROR_TOKEN_CONTROLLER = "TM_TOKEN_CONTROLLER";
    string private constant ERROR_CAN_NOT_FORWARD = "TM_CAN_NOT_FORWARD";
    string private constant ERROR_PROXY_PAYMENT_WRONG_SENDER = "TM_PROXY_PAYMENT_WRONG_SENDER";

    uint256 private constant MONTH = 2592000; //30 days in seconds
    uint256 private constant CLAIM_TOKENS = 1;

    MiniMeToken public token;
    ERC20 public erc20;
    TokenSaleInterface public tokensale;
    WhitelistInterface public whitelist;

    bool public recoveryStatus;
    uint256 public claimAmount;
    uint256[] private lockAmounts;
    uint256[] private lockIntervals;
    uint256[] private tokenIntervals;
    mapping(address => bool) private claimedToken;
    mapping(address => uint256) private lockStart;
    mapping(address => uint256) private lockExpiry;
    mapping(address => uint256) private lockAmount;

    /**
    * @notice Initialize Token Manager for `_token.symbol(): string`, whose tokens are `transferable ? 'not' : ''` transferable`_maxAccountTokens > 0 ? ' and limited to a maximum of ' + @tokenAmount(_token, _maxAccountTokens, false) + ' per account' : ''`
    * @param _token The MiniMetoken that is used for voting in the DAO
    * @param _erc20 The ERC20 token that is locked in order to receive voting tokens
    * @param _lockAmounts An array of amounts ERC20 that is required to receive voting tokens
    * @param _lockIntervals An array of lock times (in months)
    * @param _tokenIntervals An array of token amounts given for locking ERC20s for the amount of time defined by _lockIntervals
    */
    function initialize(
        MiniMeToken _token,
        address _erc20,
        address _tokensale,
        address _whitelist,
        uint256[] _lockAmounts,
        uint256[] _lockIntervals,
        uint256[] _tokenIntervals
    )
        external

    {
        initialized();

        require(MiniMeToken(_token).controller() == address(this), ERROR_TOKEN_CONTROLLER);
        require(_lockAmounts.length == _lockIntervals.length);
        require(_lockIntervals.length == _tokenIntervals.length);

        token = _token;
        token.enableTransfers(false);
        erc20 = ERC20(_erc20);
        tokensale = TokenSaleInterface(_tokensale);
        whitelist = WhitelistInterface(_whitelist);
        lockAmounts = _lockAmounts;
        lockIntervals = _lockIntervals;
        tokenIntervals = _tokenIntervals;
        setClaimAmount();
    }

    function setClaimAmount() public {
      uint256 decimals = uint256(token.decimals());
      claimAmount = CLAIM_TOKENS.mul(10**decimals);
    }

    /**
    * @notice Claim Tokens
    */
    function claim(uint16 _day) external {
      if(whitelist != address(0)){
        require(whitelist.checkWhitelist(msg.sender), 'User not in whitelist');
      }
      require(_authorized(msg.sender, _day), 'User not authorized to claim any tokens');
      require(!claimedToken[msg.sender], 'User has already claimed tokens');
      claimedToken[msg.sender] = true;
      token.generateTokens(msg.sender, claimAmount); // minime.generateTokens() never returns false
      emit TokenClaimed(msg.sender);
    }

    /**
    * @notice Lock Tokens
    */
    function lock(uint256 _lockTime) external {
      if(whitelist != address(0)){
        require(whitelist.checkWhitelist(msg.sender), 'User not in whitelist');
      }
      uint amount;
      uint lockVal;
      uint expiry;
      uint claimed = 0;
      if(claimedToken[msg.sender]){ claimed = claimAmount;}
      require(token.balanceOf(msg.sender) >= claimed, 'Ya burnt');
      if(token.balanceOf(msg.sender) == claimed){
        (amount, lockVal, expiry) = _calcLockingValues(_lockTime);
        lockStart[msg.sender] = now;
        lockExpiry[msg.sender] = lockStart[msg.sender] + expiry;
        lockAmount[msg.sender] = lockVal;
      } else {
        //In this case we are updating the lock times and the user's voting tokens
        expiry = _lockTime.mul(MONTH); //Convert from months to seconds
        //Get amount owed. _updateLock will subtract any voting tokens already minted
        (amount, lockVal) = _updateLock(msg.sender, expiry);
      }
      require(amount > 0);
      require(erc20.transferFrom(msg.sender, address(this), lockVal), 'Transfer from msg sender failed');
      require(token.generateTokens(msg.sender, amount));
      emit TokensLocked(msg.sender, lockAmount[msg.sender]);
    }

    /**
    * @notice Unlock Tokens
    */
    function unlock() external {
      require(lockExpiry[msg.sender] < now, 'Tokens are still locked');
      delete lockExpiry[msg.sender];
      delete lockStart[msg.sender];
      uint claimed = 0;
      if(claimedToken[msg.sender]){ claimed = claimAmount;}
      require(token.destroyTokens(msg.sender, token.balanceOf(msg.sender).sub(claimed)), 'Tokens not destroyed');
      require(erc20.transfer(msg.sender, lockAmount[msg.sender]), 'ERC20 not returned');
      delete lockAmount[msg.sender];
      emit TokensLocked(msg.sender, 0);
    }

    /**
    * @notice Burn Tokens of `_user` for '`_message`'
    */
    function burn(address _user, string _message) external authP(BURN_ROLE, arr(_user)){
      uint balance = token.balanceOf(_user);
      require(balance > 0, 'User has no tokens to burn');
      if(lockAmount[_user] > 0){
        //If user has locked ERC20, send lockAmount to the vault
        address vault = getRecoveryVault();
        uint amount = lockAmount[_user];
        delete lockAmount[_user];
        if(vault != address(0)){
          require(erc20.approve(vault, amount));
          VaultInterface(vault).deposit(address(erc20), amount);
        }
      }
      require(token.destroyTokens(_user, balance));
      emit TokensBurned(_user, balance, _message);
    }

    function getLockAmounts() external view returns (uint256[]){
      return lockAmounts;
    }

    function getLockIntervals() external view returns (uint256[]){
      return lockIntervals;
    }

    function getTokenIntervals() external view returns (uint256[]){
      return tokenIntervals;
    }

    /**
     * @notice Change locking values to lock `_lockAmounts` for `_lockIntervals` amount of time to receive `_tokenIntervals`
     */
    function changeLocks(
        uint256[] _lockAmounts,
        uint256[] _lockIntervals,
        uint256[] _tokenIntervals
    )
        external
        auth(MANAGER_ROLE)
    {
        require(_lockAmounts.length == _lockIntervals.length);
        require(_lockIntervals.length == _tokenIntervals.length);
        lockAmounts = _lockAmounts;
        lockIntervals = _lockIntervals;
        tokenIntervals = _tokenIntervals;
    }

    /**
     * @notice Give control of token over to `_newController`
     * @param _newController Ethereum address of contract or user that will controll the token
     */
    function changeTokenController(address _newController) external auth(MANAGER_ROLE){
      token.changeController(_newController);
    }

    /**
     * @notice Change the whitelist to `_newNewWhitelist`
     * @param _newWhitelist Ethereum address of the new whitelist
     */
    function changeWhitelist(address _newWhitelist) external auth(MANAGER_ROLE){
      whitelist = WhitelistInterface(_newWhitelist);
    }


    /**
    *
    *
    */
    function _updateLock(address _user, uint256 _seconds)
    private
    returns (uint256, uint256){
      require(lockStart[_user] > 0, 'User has not started locking, nothing to update');
      (uint amount, uint lockVal, uint lockInterval) = _calcLockingValues(_seconds.div(MONTH));
      lockExpiry[_user] = lockStart[_user] + lockInterval;
      uint lockDiff = lockVal.sub(lockAmount[_user]);
      lockAmount[_user] = lockVal;
      uint claimed = 0;
      if(claimedToken[_user]){ claimed = claimAmount;}
      return (amount.sub(token.balanceOf(_user).sub(claimed)), lockDiff);
    }

    /**
    *
    *
    */
    function _calcLockingValues(uint256 _months)
    private
    returns (uint256, uint256, uint256){
      //Reverse loop
      for(uint i=lockIntervals.length-1; i>=0; i--){
        if(_months >= lockIntervals[i]){
          return(tokenIntervals[i], lockAmounts[i], lockIntervals[i].mul(MONTH));
        }
      }
    }

    /**
    *
    *
    */
    function _authorized(address _user, uint16 _day)
    private
    returns (bool) {
      uint contribution = tokensale.getWeiContributed(_day, _user);
      return(contribution > 0);
    }

    /**
    * @notice Execute desired action as a token holder
    * @dev IForwarder interface conformance. Forwards any token holder action.
    * @param _evmScript Script being executed
    */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        bytes memory input = new bytes(0); // TODO: Consider input for this

        // Add the managed token to the blacklist to disallow a token holder from executing actions
        // on the token controller's (this contract) behalf
        address[] memory blacklist = new address[](1);
        blacklist[0] = address(token);

        runScript(_evmScript, input, blacklist);
    }

    function isForwarder() public pure returns (bool) {
        return true;
    }

    function canForward(address _sender, bytes) public view returns (bool) {
        return hasInitialized() && token.balanceOf(_sender) > 0;
    }

    /*
    * @dev Notifies the controller about a token transfer allowing the controller to decide whether to allow it or react if desired (only callable from the token)
    * @param _from The origin of the transfer
    * @param _to The destination of the transfer
    * @param _amount The amount of the transfer
    * @return False if the controller does not authorize the transfer
    */
    function onTransfer(address _from, address _to, uint _amount) public isInitialized returns (bool) {
        return false;
    }

    /**
    * @notice Called when ether is sent to the MiniMe Token contract
    * @return True if the ether is accepted, false for it to throw
    */
    function proxyPayment(address) public payable returns (bool) {
        // Sender check is required to avoid anyone sending ETH to the Token Manager through this method
        // Even though it is tested, solidity-coverage doesnt get it because
        // MiniMeToken is not instrumented and entire tx is reverted
        require(msg.sender == address(token), ERROR_PROXY_PAYMENT_WRONG_SENDER);
        return false;
    }

    /**
    * @dev Notifies the controller about an approval allowing the controller to react if desired
    * @return False if the controller does not authorize the approval
    */
    function onApprove(address, address, uint) public returns (bool) {
        return false;
    }

    /**
    * @notice Set the recovery status to `_status`
    */
    function setRecoveryStatus(bool _status)  external auth(MANAGER_ROLE){
      recoveryStatus = _status;
    }

    /**
    * @dev Disable recovery escape for erc20 depending on recoveryStatus
    */
    function allowRecoverability(address _token) public view returns (bool) {
      if(_token == address(erc20)){
        return recoveryStatus;
      } else {
        return true;
      }
    }
}
