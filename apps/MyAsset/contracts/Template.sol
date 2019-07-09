pragma solidity 0.4.24;
import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "./MyAsset.sol";
import "./tokens/AssetToken.sol";
import "./tokens/MyBitToken.sol";
import "./MyBitGo/Database.sol";
import "./MyBitGo/Events.sol";
import "./MyBitGo/API.sol";
import "./MyBitGo/ContractManager.sol";
import "./MyBitGo/Platform.sol";
import "./MyBitGo/AssetManagerEscrow.sol";
import "./MyBitGo/EscrowReserve.sol";

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
    AssetTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);
    uint64 constant PERIOD = 2592000; //30 days
    uint256 constant TOKEN_SUPPLY = 10**30;
    address[] owners;
    Database database;
    Events events;
    API api;
    ContractManager contractManager;
    Platform platform;
    AssetManagerEscrow escrow;
    EscrowReserve reserve;
    MyBitToken myb;

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) {
        tokenFactory = new AssetTokenFactory();
        owners = [msg.sender, address(this)];
        myb = new MyBitToken('MyBit', 'MYB', TOKEN_SUPPLY);
        //Deploy MyBit Go contracts
        database = new Database(owners, true);
        events = new Events(address(database));
        api = new API(address(database));
        contractManager = new ContractManager(address(database), address(events));
        database.enableContractManagement(address(contractManager));
        platform = new Platform(address(database), address(events));
        contractManager.addContract('Platform', address(platform));
        reserve = new EscrowReserve(address(database), address(events));
        contractManager.addContract('EscrowReserve', address(reserve));
        escrow = new AssetManagerEscrow(address(database), address(events));
        contractManager.addContract('AssetManagerEscrow', address(escrow));
        contractManager.addContract('Template', address(this));
        platform.setPlatformToken(address(myb));
        myb.transfer(msg.sender, TOKEN_SUPPLY/2);
        myb.transfer(address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb), TOKEN_SUPPLY/4);
        myb.transfer(address(reserve), TOKEN_SUPPLY/4);
    }

    function newInstance() {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        bytes32 myAssetAppId = apmNamehash("myasset");
        bytes32 votingAppId = apmNamehash("voting");
        bytes32 vaultAppId = apmNamehash("vault");

        //Deploy apps
        MyAsset myAsset = MyAsset(dao.newAppInstance(myAssetAppId, latestVersionAppBase(myAssetAppId)));
        Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
        Voting voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));

        AssetToken token = tokenFactory.createCloneToken(AssetToken(0), 0, "MyATM", 18, "MYATM1", true, address(myb));
        token.generateTokens(msg.sender, 2000000000000000000);
        token.generateTokens(address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb), 1000000000000000000);
        token.changeController(myAsset);
        bytes32 assetManagerEscrowID = keccak256(abi.encodePacked(address(token), address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb)));
        database.setUint(keccak256(abi.encodePacked("asset.escrow", assetManagerEscrowID)), TOKEN_SUPPLY/4);
        database.setAddress(keccak256(abi.encodePacked("asset.manager", address(token))), address(0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb));

        // Initialize apps
        vault.initialize();
        myAsset.initialize(address(token), address(voting), address(api));
        voting.initialize(MiniMeToken(token), 50 * PCT, 20 * PCT, 2 minutes);
        database.setAddress(keccak256(abi.encodePacked("asset.dao.admin", address(token))), address(myAsset));

        acl.createPermission(myAsset, voting, voting.CREATE_VOTES_ROLE(), voting);
        acl.createPermission(voting, myAsset, myAsset.FUND_ROLE(), voting);
        acl.createPermission(voting, myAsset, myAsset.REPLACE_ROLE(), voting);
        acl.createPermission(voting, myAsset, myAsset.BURN_ROLE(), voting);
        acl.createPermission(voting, vault, vault.TRANSFER_ROLE(), voting);

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
