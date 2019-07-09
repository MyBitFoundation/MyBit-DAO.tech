pragma solidity ^0.4.24;

import "./BurnableERC20.sol";
import "./Database.sol";
import "./Events.sol";

contract EscrowReserve{
  Database private database;
  Events private events;

  constructor(address _database, address _events) public {
    database = Database(_database);
    events = Events(_events);
  }
  function issueERC20(address _receiver, uint256 _amount, address _tokenAddress) external returns (bool){
    require(msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "AssetManagerEscrow"))));
    BurnableERC20 erc20 = BurnableERC20(_tokenAddress);
    require(erc20.balanceOf(this) >= _amount);
    require(erc20.transfer(_receiver, _amount));
    events.transaction("ERC20 withdrawn from escrow reserve", address(this), _receiver, _amount, _tokenAddress);
    return true;
  }
  function requestERC20(address _payer, uint256 _amount, address _tokenAddress) external returns (bool){
    require(msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "AssetManagerEscrow"))) ||
            msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "CrowdsaleGeneratorETH"))) ||
            msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "CrowdsaleGeneratorERC20"))));
    require(BurnableERC20(_tokenAddress).transferFrom(_payer, address(this), _amount));
    events.transaction("ERC20 received by escrow reserve", _payer, address(this), _amount, _tokenAddress);
  }
  function approveERC20(address _receiver, uint256 _amount, address _tokenAddress) external returns (bool){
    require(msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "AssetManagerEscrow"))));
    require(BurnableERC20(_tokenAddress).approve(_receiver, _amount));
    events.transaction("ERC20 approval given by escrow reserve", address(this), _receiver, _amount, _tokenAddress);
    return true;
  }
  function burnERC20(uint256 _amount, address _tokenAddress) external returns (bool){
    require(msg.sender == database.addressStorage(keccak256(abi.encodePacked("contract", "AssetManagerEscrow"))));
    require(BurnableERC20(_tokenAddress).burn(_amount));
    events.transaction("ERC20 burnt by escrow reserve", address(this), address(0), _amount, _tokenAddress);
    return true;
  }
}
