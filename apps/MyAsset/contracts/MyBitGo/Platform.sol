pragma solidity ^0.4.24;

import './Database.sol';
import './Events.sol';

contract Platform {

  Database public database;
  Events public events;

  // @notice initialize database
  constructor(address _database, address _events)
  public {
    database = Database(_database);
    events = Events(_events);
  }

  // @notice owners must set the wallet to receive payments here before initiating crowdsale
  // @dev will overwrite old wallet address
  function setPlatformFundsWallet(address _walletAddress)
  external
  onlyOwner {
    database.setAddress(keccak256(abi.encodePacked("platform.wallet.funds")), _walletAddress);
    //emit LogPlatformWallet(_walletAddress);
    events.registration('Platform funds wallet', _walletAddress);
  }

  // @notice owners must set the wallet to receive asset tokens here before initiating crowdsale
  // @dev will overwrite old wallet address
  function setPlatformAssetsWallet(address _walletAddress)
  external
  onlyOwner {
    database.setAddress(keccak256(abi.encodePacked("platform.wallet.assets")), _walletAddress);
    //emit LogPlatformWallet(_walletAddress);
    events.registration('Platform assets wallet', _walletAddress);
  }

  // @notice
  function setPlatformToken(address _tokenAddress)
  external
  onlyOwner {
    //@dev Set the address for the platform token
    database.setAddress(keccak256(abi.encodePacked("platform.token")), _tokenAddress);
    events.registration('Platform token', _tokenAddress);
  }

  function setPlatformFee(uint _percent)
  external
  onlyOwner {
    database.setUint(keccak256(abi.encodePacked("platform.fee")), _percent);
  }

  function setPlatformPercentage(uint _percent)
  external
  onlyOwner {
    database.setUint(keccak256(abi.encodePacked("platform.percentage")), _percent);
  }

  function setTokenFactory(address _factory)
  external
  onlyOwner {
    database.setAddress(keccak256(abi.encodePacked("platform.tokenFactory")), _factory);
  }

  function setCollateralLevels(uint _base, uint _low, uint _mid, uint _high)
  external
  onlyOwner {
    database.setUint(keccak256(abi.encodePacked("collateral.base")), _base);
    for(uint i=0; i<5; i++){
      database.setUint(keccak256(abi.encodePacked("collateral.level", i)), _low);
    }
    for(i=5; i<10; i++){
      database.setUint(keccak256(abi.encodePacked("collateral.level", i)), _mid);
    }
    for(i=10; i<25; i++){
      database.setUint(keccak256(abi.encodePacked("collateral.level", i)), _high);
    }
  }

  /*
  function setBurnrate(uint _percent)
  external
  onlyOwner {
    require(_percent < 100 && _percent >= 0);
    database.setUint(keccak256(abi.encodePacked("platform.burnRate")), _percent);
  }
  */

  // @notice platform owners can destroy contract here
  function destroy()
  onlyOwner
  external {
    events.transaction('PlatformFunds destroyed', address(this), msg.sender, address(this).balance, address(0));
    selfdestruct(msg.sender);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                Modifiers                                                                     //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @notice Sender must be a registered owner
  modifier onlyOwner {
    require(database.boolStorage(keccak256(abi.encodePacked("owner", msg.sender))));
    _;
  }






}
