pragma ton-solidity >= 0.42.0;

import '../Proposal.sol';

contract ProposalResolver {
    TvmCell _codeProposal;

    function resolveCodeHashProposal(
        address addrRoot
    ) public view returns (uint256 codeHashProposal) {
        codeHashProposal = tvm.hash(_buildProposalCode(addrRoot));
    }

    function resolveProposal(
        address addrRoot,
        uint32 id
    ) public view returns (address addrProposal) {
        TvmCell code = _buildProposalCode(addrRoot);
        TvmCell state = _buildProposalState(code, id);
        uint256 hashState = tvm.hash(state);
        addrProposal = address.makeAddrStd(0, hashState);
    }

    function _buildProposalCode(
        address addrRoot
    ) internal view returns (TvmCell) {
        TvmBuilder salt;
        salt.store(addrRoot);
        return tvm.setCodeSalt(_codeProposal, salt.toCell());
    }

    function _buildProposalState(
        TvmCell code,
        uint32 id
    ) internal view returns (TvmCell) {
        return tvm.buildStateInit({
            contr: Proposal,
            varInit: {_id: id},
            code: code
        });
    }
}