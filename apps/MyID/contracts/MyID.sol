pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "../../../contracts/WhitelistInterface.sol";

contract MyID is AragonApp, WhitelistInterface {
    /// Events
    event NewSubmission(address indexed user, string ipfs);
    event Authorized(address indexed user);
    event Revoked(address indexed user);

    /// Values
    address public token;
    address public voting;
    mapping (address => string) public ipfs;
    mapping (address => bool) public whitelist;

    /// ACL
    bytes32 constant public AUTHORIZE_ROLE = keccak256("AUTHORIZE_ROLE");

    function initialize(address _token, address _voting, address _founder, string _hash) onlyInit public {
      initialized();
      token = _token;
      voting = _voting;
      whitelist[_founder] = true;
      ipfs[_founder] = _hash;
      emit NewSubmission(_founder, _hash);
      emit Authorized(_founder);
    }

    /**
     * @notice Submit supporting evidence that you are a real person.
     * @param _ipfs The ipfs address where supporting evidence is located
     */
    function submitProof(string _ipfs) external returns (bool){
      require(!whitelist[msg.sender]);
      ipfs[msg.sender] = _ipfs;
      emit NewSubmission(msg.sender, _ipfs);
      return true;
    }


    /**
     * @notice Request approval for `_user`
     * @param _user Ethereum address of the user
     */
    function requestAuthorization(address _user)
    external
    auth(AUTHORIZE_ROLE)
    returns (bool){
      require(bytes(ipfs[_user]).length != 0);
      whitelist[_user] = true;
      emit Authorized(_user);
      return true;
    }

    /**
     * @notice Revoke approval for `_user`
     * @param _user Ethereum address of the user
     */
    function revokeAuthorization(address _user)
    external
    auth(AUTHORIZE_ROLE)
    returns (bool){
      whitelist[_user] = false;
      emit Revoked(_user);
      return true;
    }

    function checkWhitelist(address _user)
    external
    view
    returns (bool){
      return whitelist[_user];
    }
}
