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
import "./interfaces/ISmvRoot.sol";
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

contract DensSmvDebot is Debot, Upgradable, ISmvRootStoreCb {

    struct PadawanVotes {
        uint32 reqVotes;
        uint32 totalVotes;
        uint32 lockedVotes;
    }
    
    address _store;
    address _smvRoot;
    address _multisig;
    address _faucetDebot;

    address _addrPadawan;
    address _addrPadawanTokenWallet;
    PadawanVotes _padawanVotes;

    uint128 _balanceTIP3;
    address _userTokenWallet;
    
    uint32 _votes;
    bool _yesNo;


    TvmCell _codeProposal;
    ProposalInfo[] _proposals;
    address[] _proposalAddresses;

    TvmCell _codePadawan;

    struct ReserveProposal {
        string title;
        ProposalType proposalType;
        ReserveProposalSpecific specific;
    }
    ReserveProposal _newReserveProposal;

    modifier onlyStore() {
        require(msg.sender == _store);
        _;
    }

    constructor(address SmvRoot, address store, address faucetDebot) public {
        tvm.accept();
        _smvRoot = SmvRoot;
        _store = store;
        _faucetDebot = faucetDebot;
        SmvRootStore(store).queryCode{value: 0.2 ton, bounce: true}(ContractCode.Proposal);
        SmvRootStore(store).queryCode{value: 0.2 ton, bounce: true}(ContractCode.Padawan);
        SmvRootStore(store).queryAddr{value: 0.2 ton, bounce: true}(ContractAddr.TokenRoot);
    }

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
        version = "2.0.0";
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
        return [ Terminal.ID, Menu.ID, AddressInput.ID, ConfirmInput.ID, UserInfo.ID ];
    }

    function start() public override {
        UserInfo.getAccount(tvm.functionId(attachMultisig));
        this.mainMenu();
    }

    function mainMenuIndex(uint32 index) public { index;
        mainMenu();
    }

    function mainMenu() public {
        MenuItem[] items;
        items.push(MenuItem("Vote for Proposals", "", tvm.functionId(getProposals)));
        items.push(MenuItem("Create Proposal", "", tvm.functionId(createProposal)));
        items.push(MenuItem("Manage Votes", "", tvm.functionId(menuPadawan)));
        items.push(MenuItem("Get Votes", "", tvm.functionId(giveMyVotes)));
        Menu.select("What do you want to do?", "", items);
    }

    function giveMyVotes(uint32 index) public { index;
        IFaucetDebot(_faucetDebot).debotEnterPoint(address(this));
    }

    /* -------------------------------------------------------------------------- */
    /*                              ANCHOR Proposal                               */
    /* -------------------------------------------------------------------------- */

    /* ------------------------- ANCHOR Proposal getters ------------------------ */

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
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenuIndex)));
        for (uint i = 0; i < _proposals.length; i++) {
            string str;
            str.append(format('{} {} Proposal - {}.',
                _proposals[i].title,
                proposalTypeToString(_proposals[i].proposalType),
                proposalStateToString(_proposals[i].state)));
            if(_proposals[i].state <= ProposalState.OnVoting && int256(int256(_proposals[i].end - uint32(now))) > 0) {
                str.append(format(' Ends in {} seconds.', _proposals[i].end - uint32(now)));
            }
            items.push(MenuItem(str, "", tvm.functionId(voteForProposal)));
        }
        if(items.length > 0) {
            Menu.select("Vote for:", "", items);
        } else {
            Terminal.print(0, 'There`re no proposals. Try to create new one.');
            mainMenu();
        }
    }

    function voteForProposal(uint32 index) public { index;
        if(_addrPadawan == address(0)) {
            attachPadawan();
        } else {
            _proposalAddress = address(0);
            voteForProposal2(index);
        }
        // else {
        //     _proposalAddress = address(0);
        //     getPadawanProposalCb(_addrPadawan);
        // }
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
        if(_padawanVotes.totalVotes > 0) {
            items.push(MenuItem("Vote", "", tvm.functionId(voteForProposal3)));
        } else {
            Terminal.print(0, "You have no votes to vote.");
        }
        items.push(MenuItem("Manage Votes", "", tvm.functionId(menuPadawan)));
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenuIndex)));
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
        optional(uint256) none;
        IMultisig(_multisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(voteForProposal6),
            onErrorId: tvm.functionId(onError)
        }(_addrPadawan, 1 ton, false, 3, payload);
    }
    function voteForProposal6() public {
        mainMenu();
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
        mainMenu();
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
            optional(uint256) none;
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
            mainMenu();
        }
    }
    function createReserveProposalOnSuccess() public {
        Terminal.print(0, "Proposal created!");
        mainMenu();
    }

    function menuPadawan(uint32 index) public { index;
        Terminal.print(0, 'Padawan is your special wallet for voting.');
        if(_addrPadawan == address(0)) {
            attachPadawan();
        } else {
            getPadawan(_addrPadawan);
            this.menuPadawan2();
        }
    }
    function menuPadawan2() public {
        Terminal.print(0, format("Your votes:\ntotal: {}, locked: {}",
            _padawanVotes.totalVotes,
            _padawanVotes.lockedVotes
        ));

        MenuItem[] items;
        items.push(MenuItem("Update votes info", "", tvm.functionId(menuPadawan)));
        items.push(MenuItem("Acquire votes", "", tvm.functionId(depositTokens)));
        if (_padawanVotes.totalVotes != 0) {
            items.push(MenuItem("Reclaim votes", "", tvm.functionId(reclaim)));
        }
        items.push(MenuItem("Back to Main Menu", "", tvm.functionId(mainMenuIndex)));
        Menu.select("What do you want to do?", "", items);
    }
    function attachPadawan() public {
        if(_addrPadawan == address(0)) {
            resolvePadawan();
        } else {
            this.menuPadawan(0);
        }
    }
    function resolvePadawan() public view {
        ISmvRoot(_smvRoot).resolvePadawan{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(setPadawanAddress),
            onErrorId: 0,
            time: 0,
            expire: 0,
            sign: false
        }(_multisig);
    }
    function setPadawanAddress(address addrPadawan) public {
        _addrPadawan = addrPadawan;
        Sdk.getAccountType(tvm.functionId(checkPadawan), addrPadawan);
    }
    function checkPadawan(int8 acc_type) public {
        if(acc_type == 1) {
            this.menuPadawan(0);
        } else {
            Terminal.print(0, 'Padawan doesn`t exist. Creating Padawan...');
            _addrPadawan = address(0);
            this.createPadawan(0);
        }
    }

    function createPadawan(uint32 index) public view { index;
        TvmCell payload = tvm.encodeBody(ISmvRoot.deployPadawan, _multisig);
        optional(uint256) none;
        IMultisig(_multisig).sendTransaction{
            abiVer: 2,
            extMsg: true,
            sign: true,
            pubkey: none,
            time: uint64(now),
            expire: 0,
            callbackId: tvm.functionId(resolvePadawan),
            onErrorId: tvm.functionId(onError)
        }(_smvRoot, 6 ton, false, 3, payload);
    }

    function depositTokens(uint32 index) public { index;
        Terminal.print(0, "To acquire votes you need to deposit tip3 tokens first. Then tokens will be locked and converted to votes.");
        Terminal.print(0, "You can create a TIP3 wallet in the Main Menu, Get tokens item. If you have forgotten the wallet address, you can restore it using the public key using the same menu item.");
        AddressInput.get(tvm.functionId(setTip3Wallet), "Enter tip3 wallet address from which you want to deposit tokens:");
    }

    function setTip3Wallet(address value) public {
        _userTokenWallet = value;
        callTonTokenWalletGetBalance(tvm.functionId(setFromBalance), tvm.functionId(setTip3WalletError));
    }
    function setFromBalance(
        uint128 balance
    ) public {
        _balanceTIP3 = balance;
        AmountInput.get(tvm.functionId(transferTokens), "How many tokens to deposit?", 0, 0, _balanceTIP3);
    }
    function setTip3WalletError(uint128 value0) public { value0;
        Terminal.print(0, "Error! TIP3 wallet does not exist.");
        this.menuPadawan(0);
    }
    function transferTokens(uint128 value) public {
        // Terminal.print(0, format("DEBUG: transferTokens _addrPadawanTokenWallet {}", _addrPadawanTokenWallet));
        // Terminal.print(0, format("DEBUG: transferTokens _userTokenWallet {}", _userTokenWallet));
        this.callTonTokenWalletTransfer(0.15 ton, value, tvm.functionId(depositVotesInfo), 0);
    }
    function depositVotesInfo() public {
        Terminal.print(0, "Transfer succeeded. Now I will convert them to votes.");
        Terminal.print(tvm.functionId(callDepositVotes), "Sign next message with multisig keys.");
    }
    function callDepositVotes() public {
        TvmCell payload = tvm.encodeBody(IPadawan.depositTokens);
        callMultisig(payload, _addrPadawan, 1.5 ton, tvm.functionId(onCallDepositVotesSuccess), 0);
    }

    function onCallDepositVotesSuccess() public {
        Terminal.print(0, "Deposit succeeded. You will get your votes soon.");
        menuPadawan(0);
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
        callMultisig(payload, _addrPadawan, 3 ton, tvm.functionId(onCallReclaimSuccess), 0);
    }

    function onCallReclaimSuccess() public {
        Terminal.print(tvm.functionId(mainMenu), 'Reclaim success!');
        mainMenu();
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
        optional(uint256) none = 0;
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

    /* -------------------------------------------------------------------------- */
    /*                            ANCHOR TonTokenWallet                           */
    /* -------------------------------------------------------------------------- */

    function callTonTokenWalletGetBalance(
        uint32 successCallbackId,
        uint32 errorCallbackId
    ) public view {
        optional(uint256) none;
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
        optional(uint256) none = 0;
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
        }(_addrPadawanTokenWallet, _addrPadawanTokenWallet, tokens, value, false);
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
        _addrPadawanTokenWallet = tipAccount.addr;
        _padawanVotes.reqVotes = reqVotes;
        _padawanVotes.totalVotes = totalVotes;
        _padawanVotes.lockedVotes = lockedVotes;
    }
    
    function setPadawanProposalCb(TipAccount tipAccount, uint32 reqVotes, uint32 totalVotes, uint32 lockedVotes) public {
        // Terminal.print(0, format("DEBUG: setPadawanProposalCb tipAccount.addr {}", tipAccount.addr));
        _addrPadawanTokenWallet = tipAccount.addr;
        _padawanVotes.reqVotes = reqVotes;
        _padawanVotes.totalVotes = totalVotes;
        _padawanVotes.lockedVotes = lockedVotes;
        getProposals(0);
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Error! Sdk error {}. Exit code {}.", sdkError, exitCode));
        mainMenu();
    }

    /* -------------------------------------------------------------------------- */
    /*                        ANCHOR Debot deploy functions                       */
    /* -------------------------------------------------------------------------- */

    function updateAddr(ContractAddr kind, address addr) external override onlyStore {
        require(addr != address(0));
        tvm.accept();
    }

    function updateCode(ContractCode kind, TvmCell code) external override onlyStore {
        tvm.accept();
        if (kind == ContractCode.Proposal) {
            _codeProposal = code;
        } else if (kind == ContractCode.Padawan) {
            _codePadawan = code;
        }
    }

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
        // _pub = ;
        // _sec = ;
    }
}