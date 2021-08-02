pragma ton-solidity >= 0.42.0;

interface IFaucet {
    function claimTokens(address addrTokenWallet) external;
    function getTotalDistributed() external;
    function changeBalance(uint256 pubkey, uint32 value) external returns (uint32);
    function deployWallet() external;
    function getBalance(uint256 userPubkey) external returns (uint32 balance);
}

interface IFaucetCb {
    function getTotalDistributedCb(uint128 totalDistributed) external;
}
