pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";

import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";
import "./tokens/AssetToken.sol";

interface AssetManagerEscrowInterface {
  function changeAssetManager(address _assetAddress, address _newAssetManager, uint256 _amount, bool _withhold) external returns (bool);
  function voteToBurn(address _assetAddress) external returns (bool);
}

interface APIInterface {
  function getContract(string _name) external view returns (address);
  function getAssetManager(address _assetAddress) external view returns(address);
}


contract MyAsset is IForwarder, AragonApp {
    using SafeMath for uint256;

    event NewFundingRequest(uint requestID, uint amount, string receipt);
    event FundingStarted(uint requestID, uint fundingGoal);
    event Contribution(address contributor, uint amount, uint currentProgress, uint currentGoal);
    event Withdrawal(address manager, uint amount);
    event ReplaceManager(address asset, address newManager, uint amount, bool withhold);

    bytes32 public constant FUND_ROLE = keccak256("FUND_ROLE");
    bytes32 public constant REPLACE_ROLE = keccak256("REPLACE_ROLE");
    bytes32 public constant BURN_ROLE = keccak256("BURN_ROLE");

    string private constant ERROR_CALLER_NOT_TOKEN = "TM_CALLER_NOT_TOKEN";
    string private constant ERROR_TOKEN_CONTROLLER = "TM_TOKEN_CONTROLLER";
    string private constant ERROR_CAN_NOT_FORWARD = "TM_CAN_NOT_FORWARD";

    struct FundingRequest {
      uint amount;
      string receipt;
    }

    AssetToken public token;
    ERC20 public erc20;
    APIInterface public api;
    address public voting;
    uint256 public fundingGoal;
    uint256 public fundingProgress;
    uint256 public requestCount;
    mapping (uint => FundingRequest) public fundingRequests;

    modifier onlyToken() {
        require(msg.sender == address(token), ERROR_CALLER_NOT_TOKEN);
        _;
    }

    /**
    * @notice Initialize MyAsset for `_token.symbol(): string`
    * @param _token AssetToken address for the managed token (Token Manager instance must be already set as the token controller)
    */
    function initialize(address _token, address _voting, address _api) external onlyInit {
      initialized();
      token = AssetToken(_token);
      require(token.controller() == address(this), ERROR_TOKEN_CONTROLLER);
      erc20 = ERC20(token.erc20());
      api = APIInterface(_api);
      voting = _voting;
      requestCount = 0;
      fundingGoal = 0;
      fundingProgress = 0;
    }

    /**
    * @notice Request the sale of more tokens to cover expenses
    * @param _amount The amount of funds needed to cover exenses
    * @param _receipt The IPFS hash of a receipt of expenses that was uploaded to IPFS
    */
    function requestFunds(uint _amount, string _receipt) external {
      require(msg.sender == api.getAssetManager(address(token)));
      requestCount = requestCount.add(1);
      fundingRequests[requestCount] = FundingRequest(
          _amount,
          _receipt
        );
      emit NewFundingRequest(requestCount, _amount, _receipt);
    }

    /**
    * @notice Initiate funding for request `_fundingRequest`
    * @param _fundingRequest The ID of the funding request
    */
    function startFunding(uint _fundingRequest) external auth(FUND_ROLE) {
      require(fundingRequests[_fundingRequest].amount > 0);
      fundingGoal = fundingGoal.add(fundingRequests[_fundingRequest].amount);
      emit FundingStarted(_fundingRequest, fundingGoal);
    }

    /**
    * @notice Contribute towards funding
    * @param _amount The amount being contributed
    */
    function contribute(uint _amount) payable external {
      uint actualAmount = _amount;
      if(address(erc20) == address(0)){
        actualAmount = msg.value;
      } else {
        require(msg.value == 0);
      }
      uint256 fundingRemaining = fundingGoal.sub(fundingProgress);
      if(actualAmount >= fundingRemaining){
        if(address(erc20) == address(0)){
          msg.sender.transfer(actualAmount.sub(fundingRemaining));
        } else {
          erc20.transferFrom(msg.sender, address(this), fundingRemaining);
        }
        actualAmount = fundingRemaining;
        fundingGoal = 0;
        fundingProgress = 0;
      } else {
        if(address(erc20) == address(0)){
          erc20.transferFrom(msg.sender, address(this), actualAmount);
        }
        fundingProgress = fundingProgress.add(actualAmount);
      }
      token.generateTokens(msg.sender, actualAmount);
      emit Contribution(msg.sender, actualAmount, fundingProgress, fundingGoal);
    }

    /**
    * @notice Withdraw funds from this contract
    */
    function withdraw() external {
      require(msg.sender == api.getAssetManager(address(token)));
      uint balance;
      if(address(erc20) == address(0)){
        balance = erc20.balanceOf(this);
        erc20.transfer(msg.sender, balance);
      } else {
        balance = address(this).balance;
        msg.sender.transfer(balance);
      }
      emit Withdrawal(msg.sender, balance);
    }

    /**
    * @notice Replace current asset manager with `_newManager`
    * @param _newManager The address of the new manager
    * @param _amount The amount of MYB they will put up as escrow
    * @param _withhold A boolean to withhold returning of the previous asset manager's escrow
    */
    function replaceManager(address _newManager, uint _amount, bool _withhold) external auth(REPLACE_ROLE){
      emit ReplaceManager(address(token), _newManager, _amount, _withhold);
      AssetManagerEscrowInterface(api.getContract('AssetManagerEscrow')).changeAssetManager(address(token), _newManager, _amount, _withhold);
    }

    /**
    * @notice Burn the current manager's escrow
    */
    function burnEscrow() external auth(BURN_ROLE) {
      AssetManagerEscrowInterface(api.getContract('AssetManagerEscrow')).voteToBurn(address(token));
    }

    // Forwarding fns
    function isForwarder() external pure returns (bool) {
        return true;
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

    function canForward(address _sender, bytes) public view returns (bool) {
        return hasInitialized() && token.balanceOf(_sender) > 0;
    }

    /**
    * @dev Disable recovery escape hatch for own token,
    *      as the it has the concept of issuing tokens without assigning them
    */
    function allowRecoverability(address _token) public view returns (bool) {
        return _token != address(erc20);
    }
}
