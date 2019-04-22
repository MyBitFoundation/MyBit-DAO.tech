pragma solidity ^0.4.24;

import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

contract FakeIdentity{
    mapping (address => bool) public whitelist;

    /// ACL
    bytes32 constant public AUTHORIZE_ROLE = keccak256("AUTHORIZE_ROLE");

    function initialize(address[] _whitelist) public {
      for(uint8 i=0; i<_whitelist.length; i++){
        whitelist[_whitelist[i]] = true;
      }
    }

    function checkWhitelist(address _user)
    external
    view
    returns (bool){
      return whitelist[_user];
    }
}
