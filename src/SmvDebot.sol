pragma ton-solidity >=0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;
import "./interfaces/Debot.sol";
import "./interfaces/Terminal.sol";
import "./interfaces/Menu.sol";
import "./interfaces/Msg.sol";
import "./interfaces/ConfirmInput.sol";
import "./interfaces/AddressInput.sol";
import "./interfaces/NumberInput.sol";
import "./interfaces/UserInfo.sol";
import "./interfaces/AmountInput.sol";
import "./interfaces/Sdk.sol";
import "./interfaces/Upgradable.sol";
import "./interfaces/SigningBoxInput.sol";
import "./interfaces/ISmvRoot.sol";
import "./interfaces/IFaucet.sol";
import "SmvRootStore.sol";


import "./interfaces/ITokenWallet.sol";
import "./SmvRootStore.sol";
import "./Base.sol";
import "./Padawan.sol";
import "./interfaces/ISmvRoot.sol";
import "./interfaces/IPadawan.sol";
import "./interfaces/IProposalResolver.sol";

interface IFaucetDebot {
    function debotEnterPoint(address sender) external;
}

interface IMultisig {
    function sendTransaction(
        address dest,
        uint128 value,
        bool bounce,
        uint8 flags,
        TvmCell payload)
    external;
}

contract DensSmvDebot is Debot, Upgradable {

    optional(uint256) none;

    struct PadawanVotes {
        uint32 reqVotes;
        uint32 totalVotes;
        uint32 lockedVotes;
    }

    uint32 _keyHandle;

    bool _inited;
    
    address _faucet;
    address _smvRoot;
    address _multisig;
    uint256 _pubkey;


    uint128 _tokensToClaim;

    address _tokenRoot;
    address _padawan;
    bool _padawanExists;
    address _padawanTokenWallet;
    PadawanVotes _padawanVotes;

    address _userTokenWallet;
    bool _userTokenWalletExists;

    ProposalInfo[] _proposals;
    address[] _proposalAddresses;

    struct ReserveProposal {
        string title;
        ProposalType proposalType;
        ReserveProposalSpecific specific;
    }
    ReserveProposal _newReserveProposal;

    /* -------------------------------------------------------------------------- */
    /*                            ANCHOR Initialization                           */
    /* -------------------------------------------------------------------------- */

    function getDebotInfo() public functionID(0xDEB) override view returns(
        string name,
        string version,
        string publisher,
        string key,
        string author,
        address support,
        string hello,
        string language,
        string dabi,
        bytes icon
    ) {
        name = "DeNS SMV Debot";
        version = "1.0.3";
        publisher = "RSquad";
        key = "Voting system for DeNS";
        author = "RSquad";
        support = address.makeAddrStd(0, 0x0);
        hello = "Hello, I'm DeNS SMV Debot";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }
    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, ConfirmInput.ID, UserInfo.ID, SigningBoxInput.ID ];
    }

    function init(address smvRoot, address faucet, address tokenRoot) public {
        require(_inited == false);
        tvm.accept();
        _smvRoot = smvRoot;
        _faucet = faucet;
        _tokenRoot = tokenRoot;
        _inited == true;
    }










    function start() public override {
        UserInfo.getAccount(tvm.functionId(attachMultisig));
        UserInfo.getPublicKey(tvm.functionId(attachPubkey));
        if(_keyHandle == 0) {
            uint[] none_;
            SigningBoxInput.get(tvm.functionId(setKeyHandle), "Enter keys to sign all operations.", none_);
        }
        this.getTokensToClaim();
        this.getUserWalletAddress();
        this.resolvePadawan();
        this.mainMenu(0);
    }
    function setKeyHandle(uint32 handle) public {
        _keyHandle = handle;
    }
    function getTokensToClaim() public {
        IFaucet(_faucet).getBalance{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getTokensToClaimCb),
            onErrorId: tvm.functionId(onErrorGetTokensToClaim),
            time: 0,
            expire: 0,
            pubkey: none,
            sign: false
        }(_pubkey);
    }
    function getTokensToClaimCb(uint32 value) public {
        _tokensToClaim = value;
    }
    function getUserWalletAddress() public {
        ITokenRoot(_tokenRoot).getWalletAddress{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setUserTokenWallet),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: none,
            sign: false
        }(_pubkey, address(0));
    }
    function setUserTokenWallet(address value) public {
        _userTokenWallet = value;
    }
    function checkUserTokenWalletExists(uint32 index) public { index;
        Sdk.getAccountType(tvm.functionId(checkUserTokenWalletExistsCb), _userTokenWallet);
    }
    function checkUserTokenWalletExistsCb(int8 acc_type) public {
        if (acc_type != -1 && acc_type != 0 && acc_type != 2) {
            _userTokenWalletExists = true;
        }
    }
    function resolvePadawan() public view {
        ISmvRoot(_smvRoot).resolvePadawan{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(savePadawanAddress),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }(_smvRoot, _multisig);
    }
    function savePadawanAddress(address addrPadawan) public {
        _padawan = addrPadawan;
        Sdk.getAccountType(tvm.functionId(checkPadawan), addrPadawan);
    }
    function checkPadawan(int8 acc_type) public {
        if (acc_type != -1 && acc_type != 0 && acc_type != 2) {
            _padawanExists = true;
        }
    }










    function mainMenu(uint32 index) public { index;
        MenuItem[] items;
        items.push(MenuItem("Vote for Proposals", "", tvm.functionId(getProposals)));
        items.push(MenuItem("Create Proposal", "", tvm.functionId(createProposal)));
        if(_tokensToClaim > 0) {
            Terminal.print(0, format("You have {} votes to claim", _tokensToClaim));
            items.push(MenuItem("Get tokens", "", tvm.functionId(claimTokens_step1)));
        }
        if(_tokensToClaim == 0 && !_userTokenWalletExists) {
            Terminal.print(0, format("Unfortunately, you have not been allocated any votes. Contact your subgovernance to get them."));
        }
        if(_tokensToClaim == 0 && _padawanExists) {
            items.push(MenuItem("Manage Votes", "", tvm.functionId(menuPadawan)));
        }
        Menu.select("What do you want to do?", "", items);
    }










    function claimTokens_step1(uint32 index) public { index;
        Terminal.print(0, "In order to start voting, you need to perform 5 simple steps.\n1. Create a TIP-3 wallet.\n2. Get the DeNS tokens allocated for you.\n3. Create a special wallet for voting calls Padawan.\n4. Transfer DeNS tokens to it.\n5. Make a deposit.");
        Terminal.print(0, "It looks more complicated than it really is! Let me guide you through these steps easily.");

        Terminal.print(0, "Step 1 of 5. Creating a TIP-3 wallet.");
        if(_userTokenWalletExists) {
            Terminal.print(tvm.functionId(claimTokens_step4), "You already have a TIP-3 wallet.");
        } else {
            Terminal.print(tvm.functionId(claimTokens_step2), "Please sign the message to create TIP-3 wallet.");
        }
    }
    function claimTokens_step2() public {
        IFaucet(_faucet).deployWallet{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(claimTokens_step3),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: 0,
            sign: true,
            signBoxHandle: _keyHandle
        }();
    }

    function claimTokens_step3() public {
        _userTokenWalletExists = true;
        Terminal.print(0, "TIP-3 wallet has been deployed!");
        Terminal.print(0, "Step 2 of 5. Receiving tokens.");
        Terminal.print(tvm.functionId(claimTokens_step4), format("You have {} DeNS tokens allocated to you. Please sign the message to recieve them.", _tokensToClaim));
    }
    function claimTokens_step4() public {
        IFaucet(_faucet).claimTokens{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(claimTokens_step5),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: 0,
            sign: true,
            signBoxHandle: _keyHandle
        }(_userTokenWallet);
    }
    function claimTokens_step5() public {
        Terminal.print(0, format("Well done! You have recieved {} DeNS tokens!", _tokensToClaim));
        _tokensToClaim = 0;
        Terminal.print(0, "Step 3 of 5. Creating a padawan.");
        if(_padawanExists) {
            Terminal.print(tvm.functionId(claimTokens_step8), "You already have padawan.");
        } else {
            Terminal.print(tvm.functionId(claimTokens_step6), "Please sign next message to create padawan.");
        }
    }
    function claimTokens_step6() public {
        TvmCell payload = tvm.encodeBody(ISmvRoot.deployPadawan, _multisig);
        IMultisig(_multisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(claimTokens_step7),
            onErrorId: tvm.functionId(onError),
            signBoxHandle: _keyHandle
        }(_smvRoot, 6 ton, false, 3, payload);
    }
    function claimTokens_step7() public {
        _padawanExists = true;
        Terminal.print(tvm.functionId(claimTokens_step8), "Allright! Padawan has been created!");
    }
    function claimTokens_step8() public {
        IPadawan(_padawan).getAll{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(claimTokens_step9),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }
    function claimTokens_step9(TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) public {
        _padawanTokenWallet = tipAccount.addr;
        _padawanVotes.reqVotes = reqVotes;
        _padawanVotes.totalVotes = totalVotes;
        _padawanVotes.lockedVotes = lockedVotes;
        this.claimTokens_step10();
    }
    function claimTokens_step10() public {
        Terminal.print(0, "Step 4 of 5. Transferring tokens.");
        Terminal.print(tvm.functionId(claimTokens_step11), "You're almost done. Now we need to transfer tokens from you TIP-3 wallet to you newly created padawan. Please sign next message.");
    }
    function claimTokens_step11() public {
        ITokenWallet(_userTokenWallet).getBalance{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(claimTokens_step12),
            onErrorId: tvm.functionId(onError),
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
    }
    function claimTokens_step12(uint128 balance) public {
        ITokenWallet(_userTokenWallet).transfer{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: tvm.functionId(claimTokens_step13),
            onErrorId: tvm.functionId(onError),
            time: uint32(now),
            expire: 0,
            pubkey: 0,
            signBoxHandle: _keyHandle
        }(_padawanTokenWallet, _padawanTokenWallet, balance, 0.15 ton, false);
    }
    function claimTokens_step13() public {
        Terminal.print(0, "Great job! Tokens have been transferred from your TIP-3 wallet to padawan.");
        Terminal.print(0, "Step 5 of 5. Depositing.");
        Terminal.print(tvm.functionId(claimTokens_step14), "The last thing that we have to do is deposit tokens. Please sign next message.");
    }
    function claimTokens_step14() public {
        TvmCell payload = tvm.encodeBody(IPadawan.depositTokens);
        callMultisig(payload, _padawan, 1.5 ton, tvm.functionId(claimTokens_step15), 0);
    }
    function claimTokens_step15() public {
        Terminal.print(0, "Deposit succeeded! And it's done! Now you can vote for propsals.");
        start();
    }









    // /* -------------------------------------------------------------------------- */
    // /*                              ANCHOR Proposal                               */
    // /* -------------------------------------------------------------------------- */

    // /* ------------------------- ANCHOR Proposal getters ------------------------ */

    function getProposals(uint32 index) public { index;
        delete _proposals;
        delete _proposalAddresses;
        IProposalResolver(_smvRoot).resolveCodeHashProposal{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getProposals2),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }(_smvRoot);
    }

    function getProposals2(uint256 codeHashProposal) public {
        Sdk.getAccountsDataByHash(tvm.functionId(getProposalsByHashCb), codeHashProposal, address(0x0));
    }

    function getProposalsByHashCb(ISdk.AccData[] accounts) public {
        for (uint i = 0; i < accounts.length; i++) {
            getProposal(accounts[i].id);
            _proposalAddresses.push(accounts[i].id);
        }
        this.printProposalsMenu();
    }

    function getProposal(address addrProposal) public pure {
        IProposal(addrProposal).getAll{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setProposal),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function setProposal(ProposalInfo proposal) public {
        // Terminal.print(0, format("DEBUG: setProposal title {}", proposal.title));
        _proposals.push(proposal);
    }

    function printProposalsMenu() public {
        // for (uint i = 0; i < _proposals.length; i++) {
        //     if(_proposals[i].state > ProposalState.OnVoting) {
        //         delete _proposals[i];
        //         delete _proposalAddresses[i];
        //     }
        // }
        MenuItem[] items;
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenu)));
        for (uint i = 0; i < _proposals.length; i++) {
            string str;
            str.append(format('{} {} Proposal - {}.',
                _proposals[i].title,
                proposalTypeToString(_proposals[i].proposalType),
                proposalStateToString(_proposals[i].state)));
            int256 n = int256(_proposals[i].end) - int256(now);
            if(_proposals[i].state <= ProposalState.OnVoting && n > 0) {
                str.append(format(' Ends in {} seconds.', _proposals[i].end - uint32(now)));
            }
            if(_proposals[i].state <= ProposalState.OnVoting && n <= 0) {
                str.append(' Ended. Wait for calculation execution');
            }
            items.push(MenuItem(str, "", tvm.functionId(voteForProposal)));
        }
        if(items.length > 0) {
            Menu.select("Vote for:", "", items);
        } else {
            Terminal.print(0, 'There`re no proposals. Try to create new one.');
            mainMenu(0);
        }
    }

    function voteForProposal(uint32 index) public { index;
        if(_padawan == address(0)) {
            attachPadawan();
        } else {
            _proposalAddress = address(0);
            voteForProposal2(index);
        }
        // else {
        //     _proposalAddress = address(0);
        //     getPadawanProposalCb(_padawan);
        // }
    }


    function attachPadawan() public {
    }

    address _proposalAddress;
    bool _proposalChoice;

    function voteForProposal2(uint32 i) public {
        printProposal(_proposals[i - 1]);
        _proposalAddress = _proposalAddresses[i - 1];
        Terminal.print(0, format("Your votes:\ntotal: {}, locked: {}",
            _padawanVotes.totalVotes,
            _padawanVotes.lockedVotes
        ));
        MenuItem[] items;
        if(_padawanVotes.totalVotes > 0 && _proposals[i - 1].state < ProposalState.Ended) {
            items.push(MenuItem("Vote", "", tvm.functionId(voteForProposal3)));
        } else {
            Terminal.print(0, "You have no votes to vote.");
        }
        items.push(MenuItem("Manage Votes", "", tvm.functionId(menuPadawan)));
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenu)));
        Menu.select("What do you want to do?", "", items);
    }
    function voteForProposal3(uint32 index) public { index;
        MenuItem[] items;
        items.push(MenuItem("For", "", tvm.functionId(voteForProposal4)));
        items.push(MenuItem("Against", "", tvm.functionId(voteForProposal4)));
        Menu.select("Do you want vote for or against?", "", items);
    }
    function voteForProposal4(uint32 index) public {
        if(index == 0) {
            _proposalChoice = true;
        } else {
            _proposalChoice = false;
        }
        AmountInput.get(tvm.functionId(voteForProposal5), "How many votes?", 0, 1, _padawanVotes.totalVotes);
    }
    function voteForProposal5(uint128 value) public view {
        TvmCell payload = tvm.encodeBody(IPadawan.vote, _proposalAddress, _proposalChoice, uint32(value));
     
        IMultisig(_multisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(voteForProposal6),
            onErrorId: tvm.functionId(onError)
        }(_padawan, 1 ton, false, 3, payload);
    }
    function voteForProposal6() public {
        mainMenu(0);
    }

    function printProposal(ProposalInfo proposal) public {
        ReserveProposalSpecific specific = proposal.specific.toSlice().decode(ReserveProposalSpecific);
        string str;
        str.append(format('{} {} Proposal - {}\n',
            proposal.title,
            proposalTypeToString(proposal.proposalType),
            proposalStateToString(proposal.state)));
        if(proposal.state <= ProposalState.OnVoting && int256(int256(proposal.end - uint32(now))) > 0) {
            str.append(format(' Ends in {} seconds.', proposal.end - uint32(now)));
        }
        str.append(format('Votes for: {}, against: {}, total: {}\n',
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.totalVotes));
        str.append(format('NIC name to reserve - {}, reservation until {}\n',
            specific.name,
            specific.ts));
        Terminal.print(0, str);
    }

    function printProposals() public {
        for (uint i = 0; i < _proposals.length; i++) {
            printProposal(_proposals[i]);
        }
        mainMenu(0);
    }

    function proposalTypeToString(ProposalType proposalType) private pure returns (string) {
        if(proposalType == ProposalType.Reserve) {
          return 'Reserve';
        }
        return 'Undefined';
    }

    function proposalStateToString(ProposalState state) private pure returns (string) {
        if (state <= ProposalState.New) {
            return "New";
        }
        if (state == ProposalState.OnVoting) {
            return "Voting";
        }
        if (state == ProposalState.Ended) {
            return "Ended";
        }
        if (state == ProposalState.Passed) {
            return "Ended, Passed";
        }
        if (state == ProposalState.NotPassed) {
            return "Ended, Not Passed";
        }
        if (state == ProposalState.Finalized) {
            return "Finalized";
        }
        if (state == ProposalState.Distributed) {
            return "Distributed";
        }
        return "unknown";
    }

    function createProposal(uint32 index) public { index;
        MenuItem[] items;
        items.push(MenuItem("Reserve NIC", "", tvm.functionId(createReserveProposal)));
        Menu.select("Select Proposal type", "", items);
    }

    function createReserveProposal(uint32 index) public { index;
        _newReserveProposal.proposalType = ProposalType.Reserve;
        Terminal.input(tvm.functionId(createReserveProposalSetTitle), "Enter Proposal title:", false);
        Terminal.input(tvm.functionId(createReserveProposalSetName), "Enter NIC name which you want to reserve:", false);
        AmountInput.get(tvm.functionId(createReserveProposalSetEnd), "For how many days do you want to reserve NIC?", 0, 1, 10000);
        this.createReserveProposalCheck();
    }
    function createReserveProposalSetTitle(string value) public {
        _newReserveProposal.title = value;
    }
    function createReserveProposalSetName(string value) public {
        _newReserveProposal.specific.name = value;
    }
    function createReserveProposalSetEnd(int128 value) public {
        _newReserveProposal.specific.ts = now + (uint32(value) * 24 * 60 * 60);
    }
    function createReserveProposalCheck() public {
        // Terminal.print(0, 'Let`s check data.');
        // Terminal.print(0, format('Type: Reserve'));
        Terminal.print(0, format('Title: {}', _newReserveProposal.title));
        Terminal.print(0, format('NIC name: {}', _newReserveProposal.specific.name));
        Terminal.print(0, format('Reserve timestamp: {}', _newReserveProposal.specific.ts));
        ConfirmInput.get(tvm.functionId(createReserveProposalSign), "Sign and create Proposal?");
    }
    function createReserveProposalSign(bool value) public {
        if(value) {
            TvmCell payload = tvm.encodeBody(ISmvRoot.deployReserveProposal, _newReserveProposal.title, _newReserveProposal.specific);
         
            IMultisig(_multisig).sendTransaction{
                abiVer: 2,
                extMsg: true,
                sign: true,
                pubkey: none,
                time: uint64(now),
                expire: 0,
                callbackId: tvm.functionId(createReserveProposalOnSuccess),
                onErrorId: tvm.functionId(onError)
            }(_smvRoot, 8 ton, false, 3, payload);
        } else {
            mainMenu(0);
        }
    }
    function createReserveProposalOnSuccess() public {
        Terminal.print(0, "Proposal created!");
        mainMenu(0);
    }

    function menuPadawan(uint32 index) public { index;
        Terminal.print(0, 'Padawan is your special wallet for voting.');
        if(_padawan == address(0)) {
            attachPadawan();
        } else {
            getPadawan(_padawan);
            this.menuPadawan2();
        }
    }
    function menuPadawan2() public {
        Terminal.print(0, format("Your votes:\ntotal: {}, locked: {}",
            _padawanVotes.totalVotes,
            _padawanVotes.lockedVotes
        ));

        MenuItem[] items;
        // items.push(MenuItem("Update votes info", "", tvm.functionId(menuPadawan)));
        // items.push(MenuItem("Acquire votes", "", tvm.functionId(depositTokens)));
        if (_padawanVotes.totalVotes != 0) {
            items.push(MenuItem("Reclaim votes", "", tvm.functionId(reclaim)));
        }
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenu)));
        Menu.select("What do you want to do?", "", items);
    }



    function checkUserTokenWalletExistsPadawan() public {
        Sdk.getAccountType(tvm.functionId(checkUserTokenWalletExistsPadawanCb), _userTokenWallet);
    }

    function checkUserTokenWalletExistsPadawanCb(int8 acc_type) public {
        if (acc_type == -1 || acc_type == 0 || acc_type == 2) {
            Terminal.print(tvm.functionId(mainMenu), "Sorry, Token Wallet doesn't exist. If you have tokens to claim, please follow 'Claim tokens' item. If not, contact your subgovernance.");
        } else {
            // callTonTokenWalletGetBalance(tvm.functionId(setFromBalance), tvm.functionId(setTip3WalletError));
        }
    }
    function setTip3WalletError(uint128 value0) public { value0;
        Terminal.print(tvm.functionId(mainMenu), "Sorry, Token Wallet doesn't exist. If you have tokens to claim, please follow 'Claim tokens' item. If not, contact your subgovernance.");
    }

    /* -------------------------------------------------------------------------- */
    /*                               ANCHOR Reclaim                               */
    /* -------------------------------------------------------------------------- */

    address _reclaimAddress;
    uint32 _reclaimAmount;

    function reclaim() public {
        if(_padawanVotes.totalVotes - _padawanVotes.lockedVotes < 1) {
            Terminal.print(0, "You don't have enought votes for reclaim.");
            this.menuPadawan(0);
            return;
        }
        _reclaimAddress = address(0);
        _reclaimAmount = 0;
        AddressInput.get(tvm.functionId(setReclaimAddress), "Enter tip3 wallet address where to return tokens:");
        AmountInput.get(tvm.functionId(setReclaimAmount), "How many votes do you want to return?", 0, 1, _padawanVotes.totalVotes - _padawanVotes.lockedVotes);
        this.callReclaim();
    }

    function setReclaimAddress(address value) public {
        _reclaimAddress = value;
    }

    function setReclaimAmount(uint128 value) public {
        _reclaimAmount = uint32(value);
    }

    function callReclaim() public {
        TvmCell payload = tvm.encodeBody(IPadawan.reclaimDeposit, _reclaimAmount, _reclaimAddress);
        callMultisig(payload, _padawan, 3 ton, tvm.functionId(onCallReclaimSuccess), 0);
    }

    function onCallReclaimSuccess() public {
        Terminal.print(tvm.functionId(mainMenu), 'Reclaim success!');
    }

    /* -------------------------------------------------------------------------- */
    /*                               ANCHOR Multisig                              */
    /* -------------------------------------------------------------------------- */

    function attachMultisig(address value) public {
        if(value == address(0)) {
            Terminal.print(0, 'Default Multisig is not found.');
            AddressInput.get(tvm.functionId(saveMultisig), "In order to use this DeBot you need to attach Multisig. Enter your Multisig address:");
        } else {
            saveMultisig(value);
        }
    }

    function saveMultisig(address value) public {
        _multisig = value;
    }

    function callMultisig(
        TvmCell payload,
        address addr,
        uint128 value,
        uint32 successCallbackId,
        uint32 errorCallbackId
    ) public view {
        uint32 _errorCallbackId = errorCallbackId == 0 ? tvm.functionId(onError) : errorCallbackId;
        IMultisig(_multisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: successCallbackId,
            onErrorId: _errorCallbackId
        }(addr, value, true, 1, payload);
    }

    function attachPubkey(uint256 value) public {
        if(value == 0) {
            Terminal.print(0, 'Default Pubkey is not found.');
        } else {
            savePubkey(value);
        }
    }

    function savePubkey(uint256 value) public {
        _pubkey = value;
    }

    /* -------------------------------------------------------------------------- */
    /*                            ANCHOR TonTokenWallet                           */
    /* -------------------------------------------------------------------------- */

    function callTonTokenWalletGetBalance(
        uint32 successCallbackId,
        uint32 errorCallbackId
    ) public view {
        ITokenWallet(_userTokenWallet).getBalance{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: successCallbackId,
            onErrorId: errorCallbackId,
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
    }

    function callTonTokenWalletTransfer(
        uint128 value,
        uint128 tokens,
        uint32 successCallbackId,
        uint32 errorCallbackId
    ) public {
        uint32 _errorCallbackId = errorCallbackId == 0 ? tvm.functionId(onError) : errorCallbackId;
        ITokenWallet(_userTokenWallet).transfer{
            abiVer: 2,
            extMsg: true,
            sign: true,
            callbackId: successCallbackId,
            onErrorId: _errorCallbackId,
            time: uint32(now),
            expire: 0,
            pubkey: none
        }(_padawanTokenWallet, _padawanTokenWallet, tokens, value, false);
    }

    

    function getPadawan(address addrPadawan) public pure {
        // Terminal.print(0, format("DEBUG: getPadawan {}", addrPadawan));
        IPadawan(addrPadawan).getAll{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setPadawan),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }

    function getPadawanProposalCb(address addrPadawan) public pure {
        // Terminal.print(0, format("DEBUG: getPadawanProposalCb {}", addrPadawan));
        IPadawan(addrPadawan).getAll{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setPadawanProposalCb),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }();
    }
    
    function setPadawan(TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) public {
        // Terminal.print(0, format("DEBUG: setPadawan tipAccount.addr {}", tipAccount.addr));
        _padawanTokenWallet = tipAccount.addr;
        _padawanVotes.reqVotes = reqVotes;
        _padawanVotes.totalVotes = totalVotes;
        _padawanVotes.lockedVotes = lockedVotes;
    }
    
    function setPadawanProposalCb(TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) public {
        // Terminal.print(0, format("DEBUG: setPadawanProposalCb tipAccount.addr {}", tipAccount.addr));
        _padawanTokenWallet = tipAccount.addr;
        _padawanVotes.reqVotes = reqVotes;
        _padawanVotes.totalVotes = totalVotes;
        _padawanVotes.lockedVotes = lockedVotes;
        // getProposals(0);
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        if(sdkError == 414 && exitCode == 116) {
            Terminal.print(0, "Error! There are not enough TON Crystals on the wallet to send tokens, you need to replenish the balance.");
        } else {
            Terminal.print(0, format("Error! Sdk error {}. Exit code {}.", sdkError, exitCode));
        }
        mainMenu(0);
    }

    /* -------------------------------------------------------------------------- */
    /*                        ANCHOR Debot deploy functions                       */
    /* -------------------------------------------------------------------------- */

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }

    function onErrorGetTokensToClaim(uint32 sdkError, uint32 exitCode) public {
        if(exitCode == 101) {
            Terminal.print(0, "No DeNS Tokens have been allocated to this wallet yet. Contact your Subgovernance for details.");
        }
        mainMenu(0);
    }
}