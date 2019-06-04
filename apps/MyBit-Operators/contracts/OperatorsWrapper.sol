/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

/* solium-disable function-order */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

interface OperatorsInterface {
  function events() external view returns(address);
  function registerOperator(address _operatorAddress, string _operatorURI, string _assetType, address _referrerAddress) external;
  function removeOperator(bytes32 _operatorID) external;
}

interface APIInterface {
  function getOperatorAddress(bytes32 _operatorID) external view returns(address);
}

contract OperatorsWrapper is AragonApp {

    bytes32 public constant ONBOARD_ROLE = keccak256("ONBOARD_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct Operator {
        address operator;
        address referrer;
        string name;
        string assetType;
        string ipfs;
    }

    mapping (bytes32 => Operator) public requests;

    OperatorsInterface public operators;
    APIInterface public api;

    event NewRequest(bytes32 operatorID, string name, address operatorAddress, address referrerAddress, string ipfs, string assetType);
    event NewOperator(bytes32 operatorID);

    /**
    * @notice Initialize OperatorsWrapper contract
    */
    function initialize(
        address _operators,
        address _api
    )
        external
        onlyInit
    {
        initialized();
        operators = OperatorsInterface(_operators);
        api = APIInterface(_api);
    }

    /**
    * @notice Onboard `_operatorID` onto the MyBit Go platform
    * @param _operatorID The ID of the operator being onboarded
    */
    function onboardOperator(bytes32 _operatorID) external auth(ONBOARD_ROLE) {
      require(requests[_operatorID].operator != address(0));
      operators.registerOperator(requests[_operatorID].operator, requests[_operatorID].name, requests[_operatorID].assetType, requests[_operatorID].referrer);
      emit NewOperator(_operatorID);
    }

    /**
    * @notice Remove `_operatorID` from the MyBit Go platform
    * @param _operatorID The ID of the operator being removed
    */
    function revokeOperator(bytes32 _operatorID) external auth(ONBOARD_ROLE) {
      operators.removeOperator(_operatorID);
    }

    /**
    * @notice Request that an operator be added to the MyBit Go platform
    * @param _name The name of the operator
    * @param  _operatorAddress The address of the operator
    * @param _referrerAddress The address of the user who has referred the operator
    * @param _ipfs The ipfs address of supporting documents
    * @param _assetType The type of asset
    */
    function newRequest(string _name, address _operatorAddress, address _referrerAddress, string _ipfs, string _assetType) external {
      bytes32 operatorID = keccak256(abi.encodePacked("operator.uri", _name));
      require(api.getOperatorAddress(operatorID) == address(0));
      requests[operatorID] = Operator(
          _operatorAddress,
          _referrerAddress,
          _name,
          _assetType,
          _ipfs
      );
      emit NewRequest(operatorID, _name, _operatorAddress, _referrerAddress, _ipfs, _assetType);
    }

    function getEvents() external view returns (address){
      return operators.events();
    }

    function changeOperatorsContract(address _newAddress) external auth(MANAGER_ROLE) {
      operators = OperatorsInterface(_newAddress);
    }

    function changeAPIContract(address _newAddress) external auth(MANAGER_ROLE) {
      api = APIInterface(_newAddress);
    }


}
