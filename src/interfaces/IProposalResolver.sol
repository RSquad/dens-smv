pragma ton-solidity >= 0.45.0;

interface IProposalResolver {
    function resolveCodeHashProposal(
        address addrRoot
    ) external returns (uint256 codeHashProposal);

    function resolveProposal(
        address addrRoot,
        uint32 id
    ) external returns (address addrProposal);
}