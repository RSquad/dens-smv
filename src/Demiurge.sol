pragma ton-solidity >= 0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import "./resolvers/PadawanResolver.sol";
import "./resolvers/ProposalResolver.sol";
import "./Proposal.sol";
import "./DemiurgeStore.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IClient.sol";
import "./interfaces/IFaucet.sol";
import "./interfaces/IDemiurge.sol";
import './Glossary.sol';

import {Errors} from './Errors.sol';

// TODO: move to interface

struct NewProposal {
    uint256 totalVotes;
    address addrClient;
    ProposalType proposalType;
    TvmCell specific;
    TvmCell codePadawan;
    TvmCell state;
}


contract Demiurge is Base, PadawanResolver, ProposalResolver, IDemiurgeStoreCb, IFaucetCb {
    uint8 constant CHECK_PROPOSAL = 1;
    uint8 constant CHECK_PADAWAN = 2;

    uint128 constant TOTAL_EMISSION = 21000000;

    uint32 _deployedPadawansCounter = 0;
    uint32 _deployedProposalsCounter = 0;
    uint16 _version = 3;

    address _addrStore;
    address _addrDensRoot;
    address _addrTokenRoot;
    address _addrFaucet;

    uint8 _checkList;

    NewProposal[] public _newProposals;
    uint8 public _getBalancePendings = 0;
    uint128 public _totalVotes = 0;

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
            DemiurgeStore(_addrStore).queryAddr{value: 0.2 ton, bounce: true}(ContractAddr.Faucet);
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
    ) external onlyContract {
        require(msg.value >= DEPLOY_PROPOSAL_FEE);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();

        NewProposal _newProposal = NewProposal(
            0,
            _addrDensRoot,
            ProposalType.Reserve,
            cellSpecific,
            _codePadawan,
            _buildProposalState(title)
        );
        _newProposals.push(_newProposal);
        
        _beforeProposalDeploy(uint8(_newProposals.length - 1));
    }

    function _beforeProposalDeploy(
        uint8 i
    ) private {
        uint256 hashState = tvm.hash(_newProposals[i].state);
        address addrProposal = address.makeAddrStd(0, hashState);
        IClient(_addrDensRoot).onProposalDeploy
            {value: 1 ton, bounce: true}
            (addrProposal, _newProposals[i].proposalType, _newProposals[i].specific);

        IFaucet(_addrFaucet).getTotalDistributed
            {value: 0.2 ton, flag: 1, bounce: false}();
        _getBalancePendings += 1;
    }

    function getTotalDistributedCb(
        uint128 totalDistributed
    ) public override {
        _totalVotes = totalDistributed;
        _getBalancePendings -= 1;
        _deployProposals();
    }

    function _deployProposals() private {
        if(_getBalancePendings == 0) {
            for(uint8 i = 0; i < _newProposals.length; i++) {
                new Proposal {stateInit: _newProposals[i].state, value: START_BALANCE}(
                    _totalVotes,
                    _newProposals[i].addrClient,
                    _newProposals[i].proposalType,
                    _newProposals[i].specific,
                    _newProposals[i].codePadawan
                );
                _deployedProposalsCounter++;
            }
            delete _newProposals;
        }
    }

    // Setters

    function updateAddr(ContractAddr kind, address addr) external override onlyStore {
        require(addr != address(0));
        if (kind == ContractAddr.DensRoot) {
            _addrDensRoot = addr;
        } else if (kind == ContractAddr.TokenRoot) {
            _addrTokenRoot = addr;
        } else if (kind == ContractAddr.Faucet) {
            _addrFaucet = addr;
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
        address addrFaucet
    ) {
        codePadawan = _codePadawan;
        codeProposal = _codeProposal;
        addrStore = _addrStore;
        addrDensRoot = _addrDensRoot;
        addrTokenRoot = _addrTokenRoot;
        addrFaucet = _addrFaucet;
    }

    function getStats() public view returns (uint16 version, uint32 deployedPadawansCounter, uint32 deployedProposalsCounter) {
        version = _version;
        deployedPadawansCounter = _deployedPadawansCounter;
        deployedProposalsCounter = _deployedProposalsCounter;
    }
}