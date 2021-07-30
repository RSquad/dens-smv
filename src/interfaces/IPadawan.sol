pragma ton-solidity >= 0.36.0;

import './IProposal.sol';

struct TipAccount {
    address addr;
    uint128 balance;
}

interface IPadawan {
    function vote(address proposal, bool choice, uint32 votes) external;
    function depositTokens() external;
    function reclaimDeposit(uint32 votes, address returnTo) external;
    function confirmVote(uint32 deposit) external;
    function rejectVote(uint32 deposit, uint16 ec) external;
    function updateStatus(ProposalState state) external;

    function getVoteInfo() external view returns (uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes);
    function getTokenAccounts() external view returns (mapping (address => TipAccount) allAccounts);
    function getActiveProposals() external returns (mapping(address => uint32) activeProposals);

    function getAll() external view returns (TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes);
}
