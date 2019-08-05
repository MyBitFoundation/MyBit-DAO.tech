pragma solidity 0.4.24;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "./OperatorsWrapper.sol";
import "./MyBitGo/Database.sol";
import "./MyBitGo/Events.sol";
import "./MyBitGo/API.sol";
import "./MyBitGo/ContractManager.sol";
import "./MyBitGo/Operators.sol";

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

contract Template is TemplateBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);
    uint64 constant PERIOD = 2592000; //30 days
    uint256 constant TOKEN_SUPPLY = 10**30;
    address[] owners;
    Database database;
    Events events;
    API api;
    ContractManager contractManager;
    Operators operators;

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) {
        tokenFactory = new MiniMeTokenFactory();
        owners = [msg.sender, address(this)];
        //Deploy MyBit Go contracts
        database = new Database(owners, true);
        events = new Events(address(database));
        api = new API(address(database));
        contractManager = new ContractManager(address(database), address(events));
        database.enableContractManagement(address(contractManager));
        operators = new Operators(address(database), address(events));
        contractManager.addContract('Operators', address(operators));
        contractManager.addContract('Template', address(this));
        operators.registerOperator(msg.sender, 'MyBit', 'Qmehrm7FihTscxVr2GXvqf7YWGy7gxzVhKcAMbcG', address(0));
    }

    function newInstance() {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        bytes32 tokenManagerAppId = apmNamehash("token-manager");
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 vaultAppId = apmNamehash("vault");
        bytes32 mybitOperatorsAppId = apmNamehash("mybit-operators");

        //Deploy apps
        TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));
        Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));
        OperatorsWrapper mybitOperators = OperatorsWrapper(dao.newAppInstance(mybitOperatorsAppId, latestVersionAppBase(mybitOperatorsAppId)));

        MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "MyVote", 0, "MYV", true);
        token.generateTokens(msg.sender, 2);
        token.generateTokens(address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb), 1);
        token.changeController(tokenManager);

        // Initialize apps
        vault.initialize();
        tokenManager.initialize(token, true, 1);
        voting.initialize(token, 50 * PCT, 20 * PCT, 2 minutes);
        mybitOperators.initialize(address(operators), address(api), address(voting));
        database.setBool(keccak256(abi.encodePacked('owner', address(mybitOperators))), true);

        //acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        //tokenManager.mint(msg.sender, 1); // Give one token to msg.sender
        acl.createPermission(tokenManager, voting, voting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(voting, tokenManager, tokenManager.MINT_ROLE(), voting);
        acl.createPermission(voting, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(voting, mybitOperators, mybitOperators.ONBOARD_ROLE(), voting);
        /*
        acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), voting);
        acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), voting);
        acl.createPermission(voting, finance, finance.MANAGE_PAYMENTS_ROLE(), voting);
        */

        // Clean up permissions
        acl.grantPermission(msg.sender, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(msg.sender, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(msg.sender, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(msg.sender, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
