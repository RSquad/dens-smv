pragma ton-solidity >= 0.36.0;

import './Proposal.sol';

import "./interfaces/IClient.sol";
import './Glossary.sol';


contract SmvRoot is IClient {
    ProposalInfo public _proposalInfo;
    ReserveProposalSpecific public _specific;

    constructor() public {
        tvm.accept();
    }

    function onProposalDeploy(
        address addr,
        ProposalType proposalType,
        TvmCell specific
    ) external override {
        addr;
        proposalType;
        specific;
        msg.sender.transfer(0, false, 64);
    }

    function onProposalPassed(ProposalInfo proposalInfo) external override {
        _proposalInfo = proposalInfo;
        TvmCell c = proposalInfo.specific;
        _specific = c.toSlice().decode(ReserveProposalSpecific);
        msg.sender.transfer(0, false, 64);
    }
}
