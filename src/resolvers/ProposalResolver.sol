pragma ton-solidity >= 0.42.0;

import '../Proposal.sol';

contract ProposalResolver {
    TvmCell _codeProposal;

    function resolveProposal(string title) public view returns (address addrProposal) {
        TvmCell state = _buildProposalState(title);
        uint256 hashState = tvm.hash(state);
        addrProposal = address.makeAddrStd(0, hashState);
    }
    
    function _buildProposalState(string title) internal view returns (TvmCell) {
        return tvm.buildStateInit({
            contr: Proposal,
            varInit: {_deployer: address(this), _title: title},
            code: _codeProposal
        });
    }
}