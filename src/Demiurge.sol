pragma ton-solidity >= 0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import "./resolvers/PadawanResolver.sol";
import "./resolvers/ProposalResolver.sol";
import "./Proposal.sol";
import "./DemiurgeStore.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IClient.sol";
import './Glossary.sol';
import './interfaces/IDemiurgeStoreCallback.sol';

import {Errors} from './Errors.sol';

contract Demiurge is Base, PadawanResolver, ProposalResolver, IDemiurgeStoreCallback {
    uint8 constant CHECK_PROPOSAL = 1;
    uint8 constant CHECK_PADAWAN = 2;

    uint32 _deployedPadawansCounter = 0;
    uint32 _deployedProposalsCounter = 0;
    uint16 _version = 3;

    address _addrStore;
    address _addrDensRoot;
    address _addrTokenRoot;
    address _addrFaucetWallet;

    uint8 _checkList;

    /*
    *  Inline work with checklist
    */

    function _createChecks() private inline {
        _checkList = CHECK_PADAWAN | CHECK_PROPOSAL;
    }

    function _passCheck(uint8 check) private inline {
        _checkList &= ~check;
    }

    function _allCheckPassed() private view inline returns (bool) {
        return (_checkList == 0);
    }

    modifier checksEmpty() {
        require(_allCheckPassed(), Errors.NOT_ALL_CHECKS_PASSED);
        tvm.accept();
        _;
    }

    modifier onlyStore() {
        require(msg.sender == _addrStore);
        tvm.accept();
        _;
    }

    /*
    * Initialization functions
    */

    constructor(address addrStore) public {
        if (msg.sender == address(0)) {
            require(msg.pubkey() == tvm.pubkey(), 101);
        }
        require(addrStore != address(0), Errors.STORE_SHOULD_BE_NOT_NULL);
        tvm.accept();
        
        if (addrStore != address(0)) {
            _addrStore = addrStore;
            DemiurgeStore(_addrStore).queryCode{value: 0.2 ton, bounce: true}(ContractType.Proposal);
            DemiurgeStore(_addrStore).queryCode{value: 0.2 ton, bounce: true}(ContractType.Padawan);
            DemiurgeStore(_addrStore).queryAddr{value: 0.2 ton, bounce: true}(ContractAddr.DensRoot);
            DemiurgeStore(_addrStore).queryAddr{value: 0.2 ton, bounce: true}(ContractAddr.TokenRoot);
            DemiurgeStore(_addrStore).queryAddr{value: 0.2 ton, bounce: true}(ContractAddr.FaucetTokenWallet);
        }

        _createChecks();
    }

    // Padawans
    
    function deployPadawan(address owner) external onlyContract {
        require(msg.value >= DEPLOY_FEE + 2 ton);
        require(owner != address(0));
        TvmCell state = _buildPadawanState(owner);
        new Padawan{stateInit: state, value: START_BALANCE + 2 ton}(_addrTokenRoot);
    }

    // Proposals

    function deployReserveProposal(
        string title,
        ReserveProposalSpecific specific
    ) external view onlyContract {
        require(msg.value >= DEPLOY_PROPOSAL_FEE);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();
        _beforeProposalDeploy(title, ProposalType.Reserve, cellSpecific);
    }

    function _beforeProposalDeploy(
        string title,
        ProposalType proposalType,
        TvmCell specific
    ) private view {
        TvmCell state = _buildProposalState(title);
        uint256 hashState = tvm.hash(state);
        address addrProposal = address.makeAddrStd(0, hashState);
        IClient(_addrDensRoot).onProposalDeploy{value: 1 ton, bounce: true}(addrProposal, proposalType, specific);
        this._deployProposal{value: 4 ton}(title, proposalType, specific);
    }

    function _deployProposal(
        string title,
        ProposalType proposalType,
        TvmCell specific
    ) public onlyMe {
        TvmCell state = _buildProposalState(title);
        new Proposal {stateInit: state, value: START_BALANCE}(
            _addrFaucetWallet,
            _addrDensRoot,
            proposalType,
            specific,
            _codePadawan
        );
        _deployedProposalsCounter++;
    }

    // Setters

    function updateAddr(ContractAddr kind, address addr) external override onlyStore {
        require(addr != address(0));
        tvm.accept();
        if (kind == ContractAddr.DensRoot) {
            _addrDensRoot = addr;
        } else if (kind == ContractAddr.TokenRoot) {
            _addrTokenRoot = addr;
        } else if (kind == ContractAddr.FaucetTokenWallet) {
            _addrFaucetWallet = addr;
        }
    }

    function updateCode(ContractType kind, TvmCell code) external override onlyStore {
        tvm.accept();
        if (kind == ContractType.Proposal) {
            _codeProposal = code;
            _passCheck(CHECK_PROPOSAL);
        } else if (kind == ContractType.Padawan) {
            _codePadawan = code;
            _passCheck(CHECK_PADAWAN);
        }
    }

    // Getters

    function getStored() public view returns (
        TvmCell codePadawan,
        TvmCell codeProposal,
        address addrStore,
        address addrDensRoot,
        address addrTokenRoot,
        address addrFaucetWallet
    ) {
        codePadawan = _codePadawan;
        codeProposal = _codeProposal;
        addrStore = _addrStore;
        addrDensRoot = _addrDensRoot;
        addrTokenRoot = _addrTokenRoot;
        addrFaucetWallet = _addrFaucetWallet;
    }

    function getStats() public view returns (uint16 version, uint32 deployedPadawansCounter, uint32 deployedProposalsCounter) {
        version = _version;
        deployedPadawansCounter = _deployedPadawansCounter;
        deployedProposalsCounter = _deployedProposalsCounter;
    }
}