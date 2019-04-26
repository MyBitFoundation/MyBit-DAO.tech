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

import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
//import "@aragon/apps-finance/contracts/Finance.sol";
import "./MyID.sol";
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
    address constant whitelist = msg.sender;
    //string hashlist = 'QmanPRXCzxXXfizjnWr7Fe5x57GH4gBTrFN9nUY1vVdLCV';
    string constant hashlist = 'QmRxP22s7mXZicSh1jvQq6s1Vuosye6H887JUXCrc4t3gd';

    constructor(ENS ens) KitBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        address root = msg.sender;

        bytes32 tokenManagerAppId = apmNamehash("token-manager");
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 vaultAppId = apmNamehash("vault");
        //bytes32 financeAppId = apmNamehash("finance");
        bytes32 myIDAppId = apmNamehash("myid");

        TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));
        Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
        //Finance finance = Finance(dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
        MyID myID = MyID(dao.newAppInstance(myIDAppId, latestVersionAppBase(myIDAppId)));

        MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "MyVote", 0, "MYV", true);
        token.generateTokens(root, 2);
        token.generateTokens(address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb), 1);
        token.changeController(tokenManager);

        // Initialize apps
        vault.initialize();
        //finance.initialize(vault, PERIOD);
        tokenManager.initialize(token, true, 1);
        voting.initialize(token, 50 * PCT, 20 * PCT, 2 minutes);
        myID.initialize(address(token), address(voting), whitelist, hashlist);

        //acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        //tokenManager.mint(root, 1); // Give one token to root
        acl.createPermission(ANY_ENTITY, voting, voting.CREATE_VOTES_ROLE(), root);
        acl.createPermission(voting, tokenManager, tokenManager.MINT_ROLE(), voting);
        acl.createPermission(voting, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(voting, myID, myID.AUTHORIZE_ROLE(), voting);
        /*
        acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.MANAGE_PAYMENTS_ROLE(), voting);
        */

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
