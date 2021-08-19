pragma ton-solidity >= 0.42.0;

interface ITokenWallet {
    function requestBalance(uint32 _answer_id) external functionID(0xe) returns (uint128);
    function transfer(address answer_addr, address dest, uint128 tokens, uint128 grams, bool return_ownership) functionID(0xa) external;
    
    function getBalance() external functionID(0x16) returns (uint128 value0);
}