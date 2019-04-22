pragma solidity 0.4.24;

interface WhitelistInterface {
  function checkWhitelist(address _user) external view returns (bool);
}
