pragma ton-solidity >= 0.36.0;

import "../Glossary.sol";

struct ProposalResults {
    uint32 id;
    bool passed;
    uint32 votesFor;
    uint32 votesAgainst;
    uint256 totalVotes;
    VoteCountModel model;
    uint32 ts;
}

struct ProposalInfo {
    uint32 start;
    uint32 end;
    string title;
    ProposalType proposalType;
    TvmCell specific;
    ProposalState state;
    uint32 votesFor;
    uint32 votesAgainst;
    uint128 totalVotes;
}

struct SetCodeProposalSpecific {
    uint8 contractType;
    TvmCell code;
}

struct ReserveProposalSpecific {
    string name;
    uint32 ts;
}

struct SetOwnerProposalSpecific {
    string name;
    address owner;
    uint128 ts;
}

struct SetRootOwnerProposalSpecific {
    uint256 pubkey;
    string comment;
}

interface IProposal {

    function vote(address addrPadawanOwner, bool choice, uint32 deposit) external;
    
    function queryStatus() external;
    function wrapUp() external;
    function getCurrentVotes() external view returns (uint32 votesFor, uint32 votesAgainst);
    function getAll() external view returns (ProposalInfo info);
}
