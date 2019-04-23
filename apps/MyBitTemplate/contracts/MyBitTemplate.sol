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

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "../../MyTokens/contracts/MyTokens.sol";
import "../../MyID/contracts/MyID.sol";
import "../../../contracts/StandardToken.sol";
import "../../../contracts/TokenSale.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

contract TemplateBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) {
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
    //address constant myb = address(0x5d60d8d7eF6d37E16EBABc324de3bE57f135e0BC);
    //address constant tokensale = address(0xCcA36039cfDd0753D3aA9F1B4Bf35b606c8Ed971);

    uint64 constant PCT = 10 ** 16;

    //address[] constant whitelist = [address(0x06134Ad890B6eDb42Bc0487c4e8dBbc17e3E0326)];
    address constant whitelist = address(0xb4124cEB3451635DAcedd11767f004d8a28c6eE7);
    string constant hashlist = 'QmanPRXCzxXXfizjnWr7Fe5x57GH4gBTrFN9nUY1vVdLCV';
    uint256[] lockAmounts = [10**18, 10**23, 10**23, 10**23, 10**23];
    uint256[] lockIntervals = [0, 3, 12, 24, 36];
    uint256[] tokenIntervals = [10, 20, 50, 80, 130];

    constructor(ENS ens, address _token, address _tokensale) TemplateBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
        myb = _token;
        tokensale = _tokensale;
    }

    function newInstance() {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        (Voting voting, Vault vault, Finance finance) = setupAragonApps(dao);
        (MyTokens myTokens, MyID myID, MiniMeToken token) = setupMyBitApps(dao);
        initializeApps(voting, vault, finance, token, myTokens, myID);
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
      //bytes32 myTokensAppId = apmNamehash("mytokens.open.aragonpm.eth");
      //bytes32 myIDAppId = apmNamehash("myid.open.aragonpm.eth");
      bytes32 myTokensAppId = apmNamehash("mytokens");
      bytes32 myIDAppId = apmNamehash("myid");

      myTokens = MyTokens(_dao.newAppInstance(myTokensAppId, latestVersionAppBase(myTokensAppId)));
      myID = MyID(_dao.newAppInstance(myIDAppId, latestVersionAppBase(myIDAppId)));

      token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "MyVote", 1, "MYV", true);
      //token.generateTokens(msg.sender, 1);
      token.changeController(myTokens);

      //_acl.createPermission(this, myTokens, myTokens.LOCK_ROLE(), this);
      //myTokens.mint(_root, 1); // Give one token to _root

      //setupPermissions(_dao, _acl, voting, myTokens, vault, finance, myID, root);
      return (myTokens, myID, token);
    }

    function initializeApps(Voting _voting, Vault _vault, Finance _finance, MiniMeToken _token, MyTokens _myTokens, MyID _myID) internal{
      // Initialize apps
      _vault.initialize();
      _finance.initialize(_vault, 30 days);
      _myTokens.initialize(_token, myb, tokensale, address(_myID), lockAmounts, lockIntervals, tokenIntervals);
      _voting.initialize(_token, (50 * PCT)+1, 20 * PCT, 14 days);
      _myID.initialize(address(_token), address(_voting), whitelist, hashlist);
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
