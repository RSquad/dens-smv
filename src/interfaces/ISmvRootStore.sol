pragma ton-solidity >= 0.42.0;

enum ContractCode {
    Proposal,
    Padawan
}

enum ContractAddr {
    Client,
    TokenRoot,
    Faucet
}

interface ISmvRootStore {
    function setPadawanCode(TvmCell code) external;
    function setProposalCode(TvmCell code) external;

    function setClientAddr(address addr) external;
    function setTokenRootAddr(address addr) external;
    function setFaucetAddr(address addr) external;

    function queryCode(ContractCode kind) external;
    function queryAddr(ContractAddr kind) external;
}

interface ISmvRootStoreCb {
    function updateAddr(ContractAddr kind, address addr) external;
    function updateCode(ContractCode kind, TvmCell code) external;
}