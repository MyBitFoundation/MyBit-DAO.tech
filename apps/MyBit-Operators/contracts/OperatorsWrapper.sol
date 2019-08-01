pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

interface OperatorsInterface {
  function events() external view returns(address);
  function registerOperator(address _operatorAddress, string _operatorURI, string _ipfs, address _referrerAddress) external;
  function removeOperator(bytes32 _operatorID) external;
  function addAsset(bytes32 _operatorID, string _name, string _ipfs, bool _acceptCrypto, bool _payoutCrypto, address _token) external returns (bool);
  function removeAsset(bytes32 _modelID) external returns (bool);
  function updateIPFS(bytes32 _operatorID, string _ipfs) external returns(bool);
  function updateModelIPFS(bytes32 _modelID, string _ipfs) external returns(bool);
  function updateModelOperator(bytes32 _modelID, address _newAddress) external returns(bool);
}

interface APIInterface {
  function getOperatorAddress(bytes32 _operatorID) external view returns(address);
  function getModelOperator(bytes32 _modelID) external view returns(address);
  function getOperatorID(address _operatorAddress) external view returns(bytes32);
}

contract OperatorsWrapper is AragonApp {

    bytes32 public constant ONBOARD_ROLE = keccak256("ONBOARD_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct Operator {
        address operator;
        address referrer;
        string name;
        string ipfs;
    }

    mapping (bytes32 => Operator) public requests;

    OperatorsInterface public operators;
    APIInterface public api;
    address public voting;

    event NewRequest(bytes32 operatorID, string name, address operatorAddress, address referrerAddress, string ipfs);
    event NewOperator(bytes32 operatorID);
    event RemovedAsset(address operator, bytes32 operatorID, bytes32 modelID);
    event NewIPFS(address operator, bytes32 id, string ipfs, bool isModel);
    event NewModelOperator(bytes32 modelID, address oldAddress, address newAddress);

    /**
    * @notice Initialize OperatorsWrapper contract
    */
    function initialize(
        address _operators,
        address _api,
        address _voting
    )
        external
        onlyInit
    {
        initialized();
        operators = OperatorsInterface(_operators);
        api = APIInterface(_api);
        voting = _voting;
    }

    /**
    * @notice Onboard `_name` onto the MyBit Go platform
    * @param _name The name of the operator being onboarded
    */
    function onboardOperator(string _name) external auth(ONBOARD_ROLE) {
      bytes32 operatorID = keccak256(abi.encodePacked("operator.uri", _name));
      require(requests[operatorID].operator != address(0));
      operators.registerOperator(requests[operatorID].operator, requests[operatorID].name, requests[operatorID].ipfs, requests[operatorID].referrer);
      emit NewOperator(operatorID);
    }

    /**
    * @notice Remove `_name` from the MyBit Go platform
    * @param _name The name of the operator being removed
    */
    function revokeOperator(string _name) external auth(ONBOARD_ROLE) {
      bytes32 operatorID = keccak256(abi.encodePacked("operator.uri", _name));
      operators.removeOperator(operatorID);
    }

    /**
    * @notice Request that an operator be added to the MyBit Go platform
    * @param _name The name of the operator
    * @param  _operatorAddress The address of the operator
    * @param _referrerAddress The address of the user who has referred the operator
    * @param _ipfs The ipfs address of supporting documents
    */
    function newRequest(string _name, address _operatorAddress, address _referrerAddress, string _ipfs) external {
      bytes32 operatorID = keccak256(abi.encodePacked("operator.uri", _name));
      require(api.getOperatorAddress(operatorID) == address(0));
      require(api.getOperatorID(_operatorAddress) == bytes32(0));
      requests[operatorID] = Operator(
          _operatorAddress,
          _referrerAddress,
          _name,
          _ipfs
      );
      emit NewRequest(operatorID, _name, _operatorAddress, _referrerAddress, _ipfs);
    }

    /**
    * @notice Add an asset to the MyBit Go Platform
    */
    function addOperatorAsset(bytes32 _operatorID, string _name, string _ipfs, bool _acceptCrypto, bool _payoutCrypto, address _token)
    external {
      require(api.getOperatorAddress(_operatorID) == msg.sender);
      operators.addAsset(_operatorID, _name, _ipfs, _acceptCrypto, _payoutCrypto, _token);
    }

    /**
    * @notice Remove an asset from the MyBit Go Platform
    */
    function removeOperatorAsset(bytes32 _modelID)
    external {
      require(api.getModelOperator(_modelID) == msg.sender);
      operators.removeAsset(_modelID);
    }

    /**
    * @notice Update operator's IPFS hash
    */
    function changeOperatorIPFS(bytes32 _operatorID, string _ipfs)
    external {
      require(api.getOperatorAddress(_operatorID) == msg.sender);
      operators.updateIPFS(_operatorID, _ipfs);
      emit NewIPFS(msg.sender, _operatorID, _ipfs, false);
    }

    /**
    * @notice Update model's IPFS hash
    */
    function changeModelIPFS(bytes32 _modelID, string _ipfs)
    external {
      require(api.getModelOperator(_modelID) == msg.sender);
      operators.updateModelIPFS(_modelID, _ipfs);
      emit NewIPFS(msg.sender, _modelID, _ipfs, true);
    }

    /**
    * @notice Update model's operator address
    */
    function changeModelOperator(bytes32 _modelID, address _newAddress)
    external {
      require(api.getModelOperator(_modelID) == msg.sender);
      operators.updateModelOperator(_modelID, _newAddress);
      emit NewModelOperator(_modelID, msg.sender, _newAddress);
    }

    /**
    * @notice Get the current Events contract
    */
    function getEvents() external view returns (address){
      return operators.events();
    }

    /**
    * @notice Update the Operators contract
    */
    function changeOperatorsContract(address _newAddress) external auth(MANAGER_ROLE) {
      operators = OperatorsInterface(_newAddress);
    }

    /**
    * @notice Update the API contract
    */
    function changeAPIContract(address _newAddress) external auth(MANAGER_ROLE) {
      api = APIInterface(_newAddress);
    }
}
