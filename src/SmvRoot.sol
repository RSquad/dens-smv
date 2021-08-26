pragma ton-solidity >= 0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import "./resolvers/PadawanResolver.sol";
import "./resolvers/ProposalResolver.sol";
import "./Proposal.sol";
import "./SmvRootStore.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IClient.sol";
import "./interfaces/IFaucet.sol";
import "./interfaces/ISmvRoot.sol";
import './Glossary.sol';
import './Checks.sol';

import {Errors} from './Errors.sol';

// TODO: move to interface

struct NewProposal {
    uint256 totalVotes;
    address addrClient;
    string title;
    ProposalType proposalType;
    TvmCell specific;
    TvmCell state;
}


contract SmvRoot is Base, PadawanResolver, ProposalResolver, ISmvRootStoreCb, IFaucetCb, Checks {

/* -------------------------------------------------------------------------- */
/*                                ANCHOR Checks                               */
/* -------------------------------------------------------------------------- */

    uint8 constant CHECK_PROPOSAL = 1;
    uint8 constant CHECK_PADAWAN = 2;
    uint8 constant CHECK_ADDR_CLIENT = 4;
    uint8 constant CHECK_ADDR_TOKEN_ROOT = 8;
    uint8 constant CHECK_ADDR_FAUCET = 16;

    function _createChecks() private inline {
        _checkList =
            CHECK_PROPOSAL |
            CHECK_PADAWAN |
            CHECK_ADDR_CLIENT |
            CHECK_ADDR_TOKEN_ROOT |
            CHECK_ADDR_FAUCET;
    }

/* -------------------------------------------------------------------------- */
/*                                 ANCHOR Init                                */
/* -------------------------------------------------------------------------- */

    uint128 constant TOTAL_EMISSION = 21000000;

    uint32 _deployedPadawansCounter = 0;
    uint32 _deployedProposalsCounter = 0;

    address _addrStore;
    address _addrClient;
    address _addrTokenRoot;
    address _addrFaucet;

    NewProposal[] public _newProposals;
    uint8 public _getBalancePendings = 0;
    uint128 public _totalVotes = 0;

    bool public _inited = false;

    modifier onlyStore() {
        require(msg.sender == _addrStore);
        _;
    }

    modifier inited() {
        require(_inited == true, Errors.CONTRACT_IS_NOT_INITED);
        _;
    }

    constructor(address addrStore) public {
        if (msg.sender == address(0)) {
            require(msg.pubkey() == tvm.pubkey(), 101);
        }
        require(addrStore != address(0), Errors.STORE_SHOULD_BE_NOT_NULL);
        tvm.accept();
        _initialize(addrStore);
    }

    function _initialize(address addrStore) private {
        _addrStore = addrStore;
        SmvRootStore(_addrStore).queryCode
            {value: 0.2 ton, bounce: true}
            (ContractCode.Proposal);
        SmvRootStore(_addrStore).queryCode
            {value: 0.2 ton, bounce: true}
            (ContractCode.Padawan);
        SmvRootStore(_addrStore).queryAddr
            {value: 0.2 ton, bounce: true}
            (ContractAddr.Client);
        SmvRootStore(_addrStore).queryAddr
            {value: 0.2 ton, bounce: true}
            (ContractAddr.TokenRoot);
        SmvRootStore(_addrStore).queryAddr
            {value: 0.2 ton, bounce: true}
            (ContractAddr.Faucet);

        _createChecks();
    }

    function _onInit() private {
        if(_isCheckListEmpty() && !_inited) {
            _inited = true;
        }
    }

    function updateCode(
        ContractCode kind,
        TvmCell code
    ) external override onlyStore {
        if (kind == ContractCode.Proposal) {
            _codeProposal = code;
            _passCheck(CHECK_PROPOSAL);
        } else if (kind == ContractCode.Padawan) {
            _codePadawan = code;
            _passCheck(CHECK_PADAWAN);
        }
        _onInit();
    }

    function updateAddr(ContractAddr kind, address addr) external override onlyStore {
        require(addr != address(0));
        if (kind == ContractAddr.Client) {
            _addrClient = addr;
            _passCheck(CHECK_ADDR_CLIENT);
        } else if (kind == ContractAddr.TokenRoot) {
            _addrTokenRoot = addr;
            _passCheck(CHECK_ADDR_TOKEN_ROOT);
        } else if (kind == ContractAddr.Faucet) {
            _addrFaucet = addr;
            _passCheck(CHECK_ADDR_FAUCET);
        }
        _onInit();
    }

/* -------------------------------------------------------------------------- */
/*                               ANCHOR Padawan                               */
/* -------------------------------------------------------------------------- */
    
    function deployPadawan(address owner) external onlyContract inited {
        require(msg.value >= DEPLOY_FEE + 2 ton);
        require(owner != address(0));
        TvmCell state = _buildPadawanState(address(this), owner);
        new Padawan{stateInit: state, value: START_BALANCE + 2 ton}(_addrTokenRoot);
    }

/* -------------------------------------------------------------------------- */
/*                              ANCHOR Proposals                              */
/* -------------------------------------------------------------------------- */

    function deployReserveProposal(
        string title,
        ReserveProposalSpecific specific
    ) external onlyContract inited {
        require(msg.value >= DEPLOY_PROPOSAL_FEE);
        TvmBuilder b;
        b.store(specific);
        TvmCell cellSpecific = b.toCell();

        TvmCell codeProposal = _buildProposalCode(address(this)); 

        NewProposal _newProposal = NewProposal(
            0,
            _addrClient,
            title,
            ProposalType.Reserve,
            cellSpecific,
            _buildProposalState(codeProposal, _deployedProposalsCounter)
        );
        _newProposals.push(_newProposal);
        
        _beforeProposalDeploy(uint8(_newProposals.length - 1));
    }

    function _beforeProposalDeploy(
        uint8 i
    ) private {
        uint256 hashState = tvm.hash(_newProposals[i].state);
        address addrProposal = address.makeAddrStd(0, hashState);
        IClient(_addrClient).onProposalDeploy
            {value: 1 ton, bounce: true}
            (addrProposal, _newProposals[i].proposalType, _newProposals[i].specific);

        IFaucet(_addrFaucet).getTotalDistributed
            {value: 0.2 ton, flag: 1, bounce: false}();
        _getBalancePendings += 1;
    }

    function getTotalDistributedCb(
        uint128 totalDistributed
    ) public inited override {
        require(msg.sender == _addrFaucet);
        _totalVotes = totalDistributed;
        _getBalancePendings -= 1;
        _deployProposals();
    }

    function _deployProposals() private {
        if(_getBalancePendings == 0) {
            if(_totalVotes > 1) {
                for(uint8 i = 0; i < _newProposals.length; i++) {
                    new Proposal {stateInit: _newProposals[i].state, value: START_BALANCE}(
                        _totalVotes,
                        _newProposals[i].addrClient,
                        _newProposals[i].title,
                        _newProposals[i].proposalType,
                        _newProposals[i].specific,
                        _codePadawan
                    );
                    _deployedProposalsCounter++;
                }
            }
            delete _newProposals;
        }
    }

/* -------------------------------------------------------------------------- */
/*                               ANCHOR getters                               */
/* -------------------------------------------------------------------------- */

    function getStored() public view returns (
        TvmCell codePadawan,
        TvmCell codeProposal,
        address addrStore,
        address addrClient,
        address addrTokenRoot,
        address addrFaucet
    ) {
        codePadawan = _codePadawan;
        codeProposal = _codeProposal;
        addrStore = _addrStore;
        addrClient = _addrClient;
        addrTokenRoot = _addrTokenRoot;
        addrFaucet = _addrFaucet;
    }

    function getStats() public view returns (uint32 deployedPadawansCounter, uint32 deployedProposalsCounter) {
        deployedPadawansCounter = _deployedPadawansCounter;
        deployedProposalsCounter = _deployedProposalsCounter;
    }

/* -------------------------------------------------------------------------- */
/*                               ANCHOR setcode                               */
/* -------------------------------------------------------------------------- */

    function update(address addrStore, TvmCell code) public signed {
        tvm.accept();
        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(addrStore);
    }

    function onCodeUpgrade(address addrStore) private {
        tvm.resetStorage();
        _initialize(addrStore);
    }

}