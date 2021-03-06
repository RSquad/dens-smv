pragma ton-solidity >= 0.42.0;

import "../Proposal.sol";
import '../Glossary.sol';

interface ISmvRoot {
    function deployPadawan(address owner) external;
    function onPadawanDeploy(uint key) external;

    function deployReserveProposal(
        string title,
        ReserveProposalSpecific specific
    ) external;

    function getProposalInfo() external view returns (mapping (uint32 => ProposalInfo) proposals);
    function getPadawan(uint key) external view returns (PadawanData data);

    function resolvePadawan(address deployer, address owner) external view returns (address addrPadawan);
}