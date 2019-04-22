pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


/* This is only a dummy contract to make Aragon happy
when it looks for a standard aragon app structure */
contract Dummy is AragonApp {
    function initialize(string) public onlyInit {
        initialized();
    }
}
