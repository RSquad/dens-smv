pragma ton-solidity >= 0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import "./Base.sol";
import "./Errors.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IPadawan.sol";
import "./interfaces/ITokenRoot.sol";
import "./interfaces/ITokenWallet.sol";

struct PadawanData {
    address ownerAddress;
    address addr;
}

contract Padawan is Base {
    address static _deployer;
    address static _owner;

    address _addrTokenRoot;

    TipAccount public _tipAccount;
    address _returnTo;

    mapping(address => uint32) _activeProposals;

    uint32 _requestedVotes;
    uint32 _totalVotes;
    uint32 _lockedVotes;

    // Helpers

    modifier onlyOwner() {
        require(msg.sender == _owner, Errors.NOT_AUTHORIZED_CONTRACT);
        _;
    }

    modifier onlyTokenRoot() {
        require(msg.sender == _addrTokenRoot, Errors.INVALID_CALLER);
        _;
    }

    // Init

    constructor(address addrTokenRoot) public onlyContract {
        require(_deployer == msg.sender, Errors.ONLY_DEPLOYER);
        _addrTokenRoot = addrTokenRoot;
        _createTokenAccount();
    }

    // Public voting API

    /// @notice Allows user to vote for proposal.
    function vote(address proposal, bool choice, uint32 votes) external onlyOwner {
        require(msg.value >= VOTE_FEE, Errors.MSG_VALUE_TOO_LOW);
        optional(uint32) optActiveProposal = _activeProposals.fetch(proposal);

        uint32 activeProposalVotes = optActiveProposal.hasValue() ? optActiveProposal.get() : 0;
        uint32 availableVotes = _totalVotes - activeProposalVotes;
        require(votes <= availableVotes, Errors.NOT_ENOUGH_VOTES);

        // TODO: better to remove
        if (activeProposalVotes == 0) {
            _activeProposals[proposal] = 0;
        }
        
        IProposal(proposal).vote
            {value: 0, flag: 64, bounce: true}
            (_owner, choice, votes);
    }

    /// @notice Called by Proposal smc in case if votes are accepted.
    function confirmVote(uint32 votesCount) external onlyContract {
        // TODO: better to check is it proposal or not
        optional(uint32) optActiveProposal = _activeProposals.fetch(msg.sender);
        require(optActiveProposal.hasValue());

        _activeProposals[msg.sender] += votesCount;
        
        _updateLockedVotes();

        _owner.transfer(0, false, 64);
    }

    /// @notice Called by Proposal smc in case if votes are rejected.
    function rejectVote(uint32 votesCount, uint16 errorCode) external onlyContract {
        votesCount; errorCode;

        // TODO: better to check is it proposal or not
        optional(uint32) optActiveProposal = _activeProposals.fetch(msg.sender);
        require(optActiveProposal.hasValue());
        uint32 activeProposalVotes = optActiveProposal.get();
        if (activeProposalVotes == 0) {
            delete _activeProposals[msg.sender];
        }

        _owner.transfer(0, false, 64);
    }

    /// @notice Allows to withdraw unlocked user votes back in crystal or tons.
    /// @param votes - number of votes to reclaim.
    function reclaimDeposit(uint32 votes, address returnTo) external onlyOwner {
        require(msg.value >= 3 ton, Errors.MSG_VALUE_TOO_LOW);
        require(votes <= _totalVotes, Errors.NOT_ENOUGH_VOTES);
        require(returnTo != address(0));
        _returnTo = returnTo;
        _requestedVotes = votes;

        if (_requestedVotes <= _totalVotes - _lockedVotes) {
            _unlockDeposit();
        } else {
            _requestedVotes = 0;
        }

        optional(address, uint32) optActiveProposal = _activeProposals.min();
        while (optActiveProposal.hasValue()) {
            (address addrActiveProposal,) = optActiveProposal.get();
            IProposal(addrActiveProposal).queryStatus
                {value: QUERY_STATUS_FEE, bounce: true, flag: 1}
                ();
            optActiveProposal = _activeProposals.next(addrActiveProposal);
        }
    }

    /// @notice Receives proposal status. Called by Proposal smc as an answer on queryStatus().
    function updateStatus(ProposalState state) external onlyContract {
        optional(uint32) optActiveProposal = _activeProposals.fetch(msg.sender);
        require(optActiveProposal.hasValue());
        tvm.accept();

        if (state >= ProposalState.Ended) {
            delete _activeProposals[msg.sender];
            _updateLockedVotes();
        }

        if (_requestedVotes != 0 && _requestedVotes <= _totalVotes - _lockedVotes) {
            _unlockDeposit();
        }
    }

    /*
    *   Private functions
    */

    function _unlockDeposit() private {
        ITokenWallet(_tipAccount.addr).transfer
            {value: 0.1 ton + 0.1 ton}
            (address(this), _returnTo, _requestedVotes, 0.1 ton, false);
        _totalVotes -= _requestedVotes;
        _requestedVotes = 0;
        _returnTo = address(0);
    }

    function _updateLockedVotes() private inline {
        optional(address, uint32) optActiveProposal = _activeProposals.min();
        uint32 lockedVotes;
        while (optActiveProposal.hasValue()) {
            (address addr, uint32 votes) = optActiveProposal.get();
            if (votes > lockedVotes) {
                lockedVotes = votes;
            }
            optActiveProposal = _activeProposals.next(addr);
        }
        _lockedVotes = lockedVotes;
    }

    /*
     *  Deposits API
     */

    function depositTokens() external onlyOwner view {
        require(msg.value >= DEPOSIT_TOKENS_FEE, Errors.MSG_VALUE_TOO_LOW);
        require(_tipAccount.addr != address(0), Errors.ACCOUNT_DOES_NOT_EXIST);

        ITokenWallet(_tipAccount.addr).requestBalance
            {value: 0, flag: 64, bounce: true}
            (tvm.functionId(onGetBalance));
    }

    function onGetBalance(uint128 balance) public onlyContract {
        require(_tipAccount.addr == msg.sender, Errors.NOT_AUTHORIZED_CONTRACT);
        _tipAccount.balance = balance;
        _totalVotes = uint32(balance);
        _owner.transfer(0, false, 64);
    }

    /*
    *  Token Account Collection
    */

    function onTokenWalletDeploy(address ownerAddress) public onlyTokenRoot {
        _tipAccount = TipAccount(ownerAddress, 0);
        _owner.transfer(0, false, 64);
    }

    function _createTokenAccount() private view {
        ITokenRoot(_addrTokenRoot).deployEmptyWallet
            {value: 2 ton, flag: 1, bounce: true}
            (tvm.functionId(onTokenWalletDeploy), 0, address(this), 1 ton);
    }

    /*
    *  Get Methods
    */

    function getAll() external view returns (TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) {
        tipAccount = _tipAccount;
        reqVotes = _requestedVotes;
        totalVotes =  _totalVotes;
        lockedVotes = _lockedVotes;
    }

    function getTipAccount() external view returns (TipAccount tipAccount) {
        tipAccount = _tipAccount;
    }

    function getVoteInfo() external view returns (uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) {
        reqVotes = _requestedVotes;
        totalVotes =  _totalVotes;
        lockedVotes = _lockedVotes;
    }

    function getAddresses() public view returns (address ownerAddress) {
        ownerAddress = _owner;
    }

    function getActiveProposals() public view returns (mapping(address => uint32) activeProposals) {
        activeProposals = _activeProposals;
    }
}
