/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 *
 * This file requires contract dependencies which are licensed as
 * GPL-3.0-or-later, forcing it to also be licensed as such.
 *
 * This is the only file in your project that requires this license and
 * you are free to choose a different license for the rest of the project.
 */

pragma solidity 0.4.24;

//import "@aragon/os/contracts/factory/DAOFactory.sol";
//import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/AbstractENS.sol";
//import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";
import "@aragon/os/contracts/lib/misc/ERCProxy.sol";

//import "@aragon/apps-voting/contracts/Voting.sol";
//import "@aragon/apps-vault/contracts/Vault.sol";
//import "@aragon/apps-finance/contracts/Finance.sol";
//import "../../MyTokens/contracts/MyTokens.sol";
//import "../../MyID/contracts/MyID.sol";

//import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

interface ACL{
  function createPermission(address _entity, address _app, bytes32 _role, address _manager) external;
  function grantPermission(address _entity, address _app, bytes32 _role) external;
  function revokePermission(address _entity, address _app, bytes32 _role) external;
  function setPermissionManager(address _newManager, address _app, bytes32 _role) external;
  function CREATE_PERMISSIONS_ROLE() external returns (bytes32);
}

interface Kernel{
  function acl() external returns (ACL);
  function newAppInstance(bytes32 _appId, address _appBase) external returns (ERCProxy appProxy);
  function newAppInstance(bytes32 _appId, address _appBase, bytes _initializePayload, bool _setDefault) external returns (ERCProxy appProxy);
  function APP_MANAGER_ROLE() external returns (bytes32);
}
interface DAOFactory{
  function newDAO(address _root) external returns (Kernel);
}

interface Repo{
  function getLatest() external returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI);
}

interface PublicResolver{
  function addr(bytes32 node) external returns (address ret);
}

interface Voting{
  function initialize(MiniMeToken _token, uint64 _supportRequiredPct, uint64 _minAcceptQuorumPct, uint64 _voteTime) external;
  function CREATE_VOTES_ROLE() external returns (bytes32);
  function MODIFY_SUPPORT_ROLE() external returns (bytes32);
  function MODIFY_QUORUM_ROLE() external returns (bytes32);
}

interface Vault{
  function initialize() external;
  function TRANSFER_ROLE() external returns (bytes32);
}

interface Finance{
  function initialize(Vault _vault, uint64 _periodDuration) external;
  function CREATE_PAYMENTS_ROLE() external returns (bytes32);
  function CHANGE_PERIOD_ROLE() external returns (bytes32);
  function CHANGE_BUDGETS_ROLE() external returns (bytes32);
  function EXECUTE_PAYMENTS_ROLE() external returns (bytes32);
  function MANAGE_PAYMENTS_ROLE() external returns (bytes32);
}

interface MyID{
  function initialize(address _token, address _voting, address _founder, string _hash) external;
  function AUTHORIZE_ROLE() external returns (bytes32);
}

interface MyTokens{
  function initialize(MiniMeToken _token, address _erc20, address _tokensale, address _whitelist, uint256[] _lockAmounts, uint256[] _lockIntervals, uint256[] _tokenIntervals) external;
  function BURN_ROLE() external returns (bytes32);
  function MANAGER_ROLE() external returns (bytes32);
}

interface MiniMeTokenFactory{
  function createCloneToken(
      MiniMeToken _parentToken,
      uint _snapshotBlock,
      string _tokenName,
      uint8 _decimalUnits,
      string _tokenSymbol,
      bool _transfersEnabled
  ) external returns (MiniMeToken);
}

interface MiniMeToken{
  function changeController(address _newController) external;
}

contract TemplateBase is APMNamehash {
    AbstractENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, AbstractENS _ens) {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = TemplateBase(latestVersionAppBase(bareKit)).fac();
        } else {
            fac = _fac;
        }
    }

    function latestVersionAppBase(bytes32 appId) public view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (,base,) = repo.getLatest();

        return base;
    }
}

contract MyBitTemplate is TemplateBase {
    MiniMeTokenFactory tokenFactory;
    address myb;
    address tokensale;

    uint64 constant PCT = 10 ** 16;
    uint256[] lockAmounts = [10**18, 10**23, 10**23, 10**23, 10**23];
    uint256[] lockIntervals = [0, 3, 12, 24, 36];
    uint256[] tokenIntervals = [10, 15, 50, 80, 130];

    constructor(AbstractENS ens, MiniMeTokenFactory _tokenFactory, address _token, address _tokensale) TemplateBase(DAOFactory(0), ens) {
        tokenFactory = _tokenFactory;

        myb = _token;
        tokensale = _tokensale;
    }

    function newInstance(address _whitelisted, string _hash) {
      Kernel dao = fac.newDAO(this);
      ACL acl = ACL(dao.acl());
      acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
      (Voting voting, Vault vault, Finance finance) = setupAragonApps(dao);
      (MyTokens myTokens, MyID myID, MiniMeToken token) = setupMyBitApps(dao);
      initializeAragonApps(voting, vault, finance, token);
      initializeMyBitApps(voting, token, myTokens, myID, _whitelisted, _hash);
      setupPermissions(dao, acl, voting, myTokens, vault, finance, myID, msg.sender);
      emit DeployInstance(dao);
    }

    function setupAragonApps(Kernel _dao) internal returns (Voting voting, Vault vault, Finance finance){
      bytes32 votingAppId = apmNamehash("voting");
      bytes32 vaultAppId = apmNamehash("vault");
      bytes32 financeAppId = apmNamehash("finance");

      vault = Vault(_dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId), '', true));
      finance = Finance(_dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));
      voting = Voting(_dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));

      return (voting, vault, finance);
    }

    function setupMyBitApps(Kernel _dao) internal returns (MyTokens myTokens, MyID myID, MiniMeToken token){
      bytes32 myTokensAppId = apmNamehash("mytokens.open.aragonpm.eth");
      bytes32 myIDAppId = apmNamehash("myid.open.aragonpm.eth");
      //bytes32 myTokensAppId = apmNamehash("mytokens");
      //bytes32 myIDAppId = apmNamehash("myid");

      myTokens = MyTokens(_dao.newAppInstance(myTokensAppId, latestVersionAppBase(myTokensAppId)));
      myID = MyID(_dao.newAppInstance(myIDAppId, latestVersionAppBase(myIDAppId)));

      token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "MyVote", 1, "MYV", true);
      token.changeController(myTokens);
      return (myTokens, myID, token);
    }

    function initializeAragonApps(Voting _voting, Vault _vault, Finance _finance, MiniMeToken _token) internal{
      // Initialize apps
      _vault.initialize();
      _finance.initialize(_vault, 30 days);
      _voting.initialize(_token, (50 * PCT)+1, 20 * PCT, 14 days);
    }

    function initializeMyBitApps(Voting _voting, MiniMeToken _token, MyTokens _myTokens, MyID _myID, address _whitelisted, string _hash) internal{
      // Initialize apps
      _myTokens.initialize(_token, myb, tokensale, address(_myID), lockAmounts, lockIntervals, tokenIntervals);
      _myID.initialize(address(_token), address(_voting), _whitelisted, _hash);
    }

    function setupPermissions(Kernel _dao, ACL _acl, Voting _voting, MyTokens _myTokens, Vault _vault, Finance _finance, MyID _myID, address _root) internal{
      _acl.createPermission(_myTokens, _voting, _voting.CREATE_VOTES_ROLE(), _voting);

      _acl.createPermission(_voting, _myID, _myID.AUTHORIZE_ROLE(), _voting);
      _acl.createPermission(_voting, _myTokens, _myTokens.BURN_ROLE(), _voting);
      _acl.createPermission(_voting, _myTokens, _myTokens.MANAGER_ROLE(), _voting);
      //_acl.createPermission(_voting, _vault, _vault.TRANSFER_ROLE(), _voting);

      _acl.createPermission(_finance, _vault, _vault.TRANSFER_ROLE(), _voting);
      _acl.createPermission(_voting, _finance, _finance.CREATE_PAYMENTS_ROLE(), _voting);
      _acl.createPermission(_voting, _finance, _finance.EXECUTE_PAYMENTS_ROLE(), _voting);
      _acl.createPermission(_voting, _finance, _finance.MANAGE_PAYMENTS_ROLE(), _voting);

      // Clean up permissions
      _acl.grantPermission(_root, _dao, _dao.APP_MANAGER_ROLE());
      _acl.revokePermission(this, _dao, _dao.APP_MANAGER_ROLE());
      _acl.setPermissionManager(_root, _dao, _dao.APP_MANAGER_ROLE());

      _acl.grantPermission(_root, _acl, _acl.CREATE_PERMISSIONS_ROLE());
      _acl.revokePermission(this, _acl, _acl.CREATE_PERMISSIONS_ROLE());
      _acl.setPermissionManager(_root, _acl, _acl.CREATE_PERMISSIONS_ROLE());
    }
}
