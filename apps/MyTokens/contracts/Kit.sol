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

//import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "./MyTokens.sol";
import "../../../contracts/StandardToken.sol";
import "../../../contracts/TokenSale.sol";
import "./FakeIdentity.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

contract KitBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = KitBase(latestVersionAppBase(bareKit)).fac();
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

contract Kit is KitBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);
    uint64 constant PERIOD = 2592000; //30 days
    uint256 constant TOKEN_SUPPLY = 10**30;

    uint256[] lockAmounts = [10**18, 10**23, 10**23, 10**23];
    uint256[] lockIntervals = [0, 3, 6, 12];
    uint256[] tokenIntervals = [10, 15, 20, 30];
    address[] whitelist = [address(0xb4124cEB3451635DAcedd11767f004d8a28c6eE7), address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb)];

    constructor(ENS ens) KitBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        setupDAO(dao, acl);
    }

    function setupDAO(Kernel _dao, ACL _acl) internal {
      _acl.createPermission(this, _dao, _dao.APP_MANAGER_ROLE(), this);
      address root = msg.sender;
      //bytes32 votingAppId = apmNamehash("voting");
      bytes32 vaultAppId = apmNamehash("vault");
      bytes32 financeAppId = apmNamehash("finance");
      bytes32 tokenLockerAppId = apmNamehash("mybit-tokens");

      Vault vault = Vault(_dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId), '', true));
      //vault.initialize();
      Finance finance = Finance(_dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));
      //Voting voting = Voting(_dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
      MyTokens tokenLocker = MyTokens(_dao.newAppInstance(tokenLockerAppId, latestVersionAppBase(tokenLockerAppId)));
      FakeIdentity myID = new FakeIdentity();
      //_dao.setRecoveryVaultAppId(vaultAppId);


      MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "MyVote", 1, "MYV", true);
      //token.generateTokens(msg.sender, 1);
      token.changeController(tokenLocker);

      StandardToken erc20 = new StandardToken("MyBit", "MYB", 18, TOKEN_SUPPLY);
      //TokenSale tokensale = new TokenSale(address(erc20), address(0), address(0));
      erc20.transfer(msg.sender, TOKEN_SUPPLY/4);
      erc20.transfer(address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb), TOKEN_SUPPLY/4);
      //erc20.approve(address(tokensale), TOKEN_SUPPLY/2);
      //tokensale.startSale(now);
      //tokensale.fund(0, 10**18, address(0xb4124cEB3451635DAcedd11767f004d8a28c6eE7));
      //tokensale.fund(1, 10**18, address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb));

      // Initialize apps

      finance.initialize(vault, PERIOD);
      tokenLocker.initialize(token, address(erc20), address(0), address(myID), lockAmounts, lockIntervals, tokenIntervals);
      //voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);
      myID.initialize(whitelist);


      //_acl.createPermission(this, tokenLocker, tokenLocker.LOCK_ROLE(), this);
      //tokenLocker.mint(root, 1); // Give one token to root

      setupPermissions(_dao, _acl, /*voting,*/ tokenLocker, vault, finance, root);
    }

    function setupPermissions(Kernel _dao, ACL _acl, /*Voting _voting,*/ MyTokens _tokenLocker, Vault _vault, Finance _finance, address _root) internal{
      //_acl.createPermission(ANY_ENTITY, _voting, _voting.CREATE_VOTES_ROLE(), _root);
      _acl.createPermission(_tokenLocker, _tokenLocker, _tokenLocker.BURN_ROLE(), _tokenLocker);
      _acl.createPermission(_tokenLocker, _tokenLocker, _tokenLocker.MANAGER_ROLE(), _tokenLocker);
      //_acl.createPermission(_voting, _vault, _vault.TRANSFER_ROLE(), _voting);

      _acl.createPermission(_finance, _vault, _vault.TRANSFER_ROLE(), _tokenLocker);
      _acl.createPermission(_tokenLocker, _finance, _finance.CREATE_PAYMENTS_ROLE(), _tokenLocker);
      _acl.createPermission(_tokenLocker, _finance, _finance.EXECUTE_PAYMENTS_ROLE(), _tokenLocker);
      _acl.createPermission(_tokenLocker, _finance, _finance.MANAGE_PAYMENTS_ROLE(), _tokenLocker);


      // Clean up permissions
      _acl.grantPermission(_root, _dao, _dao.APP_MANAGER_ROLE());
      _acl.revokePermission(this, _dao, _dao.APP_MANAGER_ROLE());
      _acl.setPermissionManager(_root, _dao, _dao.APP_MANAGER_ROLE());

      _acl.grantPermission(_root, _acl, _acl.CREATE_PERMISSIONS_ROLE());
      _acl.revokePermission(this, _acl, _acl.CREATE_PERMISSIONS_ROLE());
      _acl.setPermissionManager(_root, _acl, _acl.CREATE_PERMISSIONS_ROLE());

      emit DeployInstance(_dao);
    }
}
