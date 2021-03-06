pragma ton-solidity >= 0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import "./Base.sol";
import "./Errors.sol";
import "./resolvers/PadawanResolver.sol";
import "./interfaces/IClient.sol";
import "./interfaces/IProposal.sol";
import "./interfaces/IPadawan.sol";

contract Proposal is Base, PadawanResolver, IProposal {
    address _addrRoot;
    uint32 static _id;
    
    address public _addrClient;

    ProposalInfo public _proposalInfo;

    ProposalResults _results;
    VoteCountModel _voteCountModel;

    event ProposalFinalized(ProposalResults results);

    constructor(
        uint128 totalVotes,
        address addrClient,
        string title,
        ProposalType proposalType,
        TvmCell specific,
        TvmCell codePadawan
    ) public {
        optional(TvmCell) optSalt = tvm.codeSalt(tvm.code());
        require(optSalt.hasValue());
        (address addrRoot) = optSalt
            .get()
            .toSlice()
            .decode(address);
        require(msg.sender == addrRoot);
        _addrRoot = addrRoot;

        _addrClient = addrClient;

        _proposalInfo.title = title;
        _proposalInfo.start = uint32(now);
        _proposalInfo.end = uint32(now + 60 * 60 * 24 * 7);
        _proposalInfo.proposalType = proposalType;
        _proposalInfo.specific = specific;
        _proposalInfo.state = ProposalState.OnVoting;
        _proposalInfo.totalVotes = totalVotes;

        _codePadawan = codePadawan;

        _voteCountModel = VoteCountModel.SoftMajority;
    }

    function wrapUp() external override {
        _wrapUp();
        msg.sender.transfer(0, false, 64);
    }

    /* Implements SMV algorithm and has vote function to receive ‘yes’ or ‘no’ votes from Voting Wallet. */
    function vote(address addrPadawanOwner, bool choice, uint32 votesCount) external override {
        address addrPadawan = resolvePadawan(_addrRoot, addrPadawanOwner);
        uint16 errorCode = 0;

        if (addrPadawan != msg.sender) {
            errorCode = Errors.NOT_AUTHORIZED_CONTRACT;
        } else if (now < _proposalInfo.start) {
            errorCode = Errors.VOTING_NOT_STARTED;
        } else if (now > _proposalInfo.end) {
            errorCode = Errors.VOTING_HAS_ENDED;
        }

        if (errorCode > 0) {
            IPadawan(msg.sender).rejectVote{value: 0, flag: 64, bounce: true}(votesCount, errorCode);
        } else {
            IPadawan(msg.sender).confirmVote{value: 0, flag: 64, bounce: true}(votesCount);
            if (choice) {
                _proposalInfo.votesFor += votesCount;
            } else {
                _proposalInfo.votesAgainst += votesCount;
            }
        }

        _wrapUp();
    }

    function _finalize(bool passed) private {
        _results = ProposalResults(
            uint32(0),
            passed,
            _proposalInfo.votesFor,
            _proposalInfo.votesAgainst,
            _proposalInfo.totalVotes,
            _voteCountModel,
            uint32(now)
        );

        ProposalState state = passed ? ProposalState.Passed : ProposalState.NotPassed;

        _changeState(state);

        IClient(address(_addrClient)).onProposalPassed{value: 1 ton} (_proposalInfo);

        emit ProposalFinalized(_results);
    }

    function _tryEarlyComplete(
        uint32 yes,
        uint32 no
    ) private view inline returns (bool, bool) {
        (bool completed, bool passed) = (false, false);
        if (yes * 2 > _proposalInfo.totalVotes) {
            completed = true;
            passed = true;
        } else if(no * 2 >= _proposalInfo.totalVotes) {
            completed = true;
            passed = false;
        }
        return (completed, passed);
    }

    function _wrapUp() private {
        (bool completed, bool passed) = (false, false);

        if (now > _proposalInfo.end) {
            completed = true;
            passed = _calculateVotes(_proposalInfo.votesFor, _proposalInfo.votesAgainst);
        } else {
            (completed, passed) = _tryEarlyComplete(_proposalInfo.votesFor, _proposalInfo.votesAgainst);
        }

        if (completed) {
            _changeState(ProposalState.Ended);
            _finalize(passed);
        }
    }

    function _calculateVotes(
        uint32 yes,
        uint32 no
    ) private view returns (bool) {
        bool passed = false;
        passed = _softMajority(yes, no);
        return passed;
    }

    function _softMajority(
        uint32 yes,
        uint32 no
    ) private view returns (bool) {
        bool passed = false;
        passed = yes >= 1 + (_proposalInfo.totalVotes / 10) + (no * ((_proposalInfo.totalVotes / 2) - (_proposalInfo.totalVotes / 10))) / (_proposalInfo.totalVotes / 2);
        return passed;
    }

    function _changeState(ProposalState state) private inline {
        _proposalInfo.state = state;
    }

    function queryStatus() external override {
        IPadawan(msg.sender).updateStatus(_proposalInfo.state);
    }

    // Getters

    function getAll() public view override returns (ProposalInfo info) {
        info = _proposalInfo;
    }

    function getVotingResults() public view returns (ProposalResults vr) {
        require(_proposalInfo.state > ProposalState.Ended, Errors.VOTING_HAS_NOT_ENDED);
        vr = _results;
    }

    function getInfo() public view returns (ProposalInfo info) {
        info = _proposalInfo;
    }

    function getCurrentVotes() external override view returns (uint32 votesFor, uint32 votesAgainst) {
        return (_proposalInfo.votesFor, _proposalInfo.votesAgainst);
    }

}
