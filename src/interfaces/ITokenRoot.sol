pragma ton-solidity >= 0.42.0;

interface ITokenRoot {
    function deployEmptyWallet(
        uint32 _answer_id,
        uint256 pubkey,
        address internal_owner,
        uint128 grams
    ) external functionID(0xd) returns (address value0);

    function getWalletAddress(
        uint256 pubkey,
        address owner
    ) external functionID(0x19) returns (address value0);
}