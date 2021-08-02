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
import "./interfaces/IDemiurge.sol";
import "DemiurgeStore.sol";


import "./interfaces/ITokenWallet.sol";
import "./interfaces/ITokenRoot.sol";
import "./interfaces/IFaucet.sol";
import "./DemiurgeStore.sol";
import "./Base.sol";
import "./Padawan.sol";
import "./interfaces/IDemiurge.sol";
import "./interfaces/IPadawan.sol";

interface IDemiurgeDebot {
    function mainMenu() external;
}

contract FaucetDebot is Debot, Upgradable {

    address _addrFaucet;
    address _addrTokenRoot;
    address _addrFaucetTokenWallet;

    address _addrDemiurgeDebot;

    uint256 _userPubkey;
    address _addrUserTokenWallet;
    uint128 _faucetBalance;

    constructor(address addrFaucet, address addrTokenRoot, address addrFaucetTokenWallet) public {
        tvm.accept();
        _addrFaucet = addrFaucet;
        _addrTokenRoot = addrTokenRoot;
        _addrFaucetTokenWallet = addrFaucetTokenWallet;
    }

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
        name = "DeNS Faucet Debot";
        version = "0.0.1";
        publisher = "RSquad";
        key = "Voting system for DeNS";
        author = "RSquad";
        support = address.makeAddrStd(0, 0x0);
        hello = "Hello, I'm DeNS Faucet Debot";
        language = "en";
        dabi = m_debotAbi.get();
        icon = "";
    }

    function getRequiredInterfaces() public view override returns (uint256[] interfaces) {
        return [ Terminal.ID, Menu.ID, AddressInput.ID, ConfirmInput.ID, UserInfo.ID ];
    }

    function start() public override {
        mainMenu();
    }

    function mainMenu() public {
        ConfirmInput.get(tvm.functionId(checkDeploy), "Check deployment?");
    }

    function checkDeploy(bool value) public {
        if(value) {
            Sdk.getAccountType(tvm.functionId(checkUserTokenWalletExists2), _addrUserTokenWallet);
        } else {
            back();
        }
    }

    function checkUserTokenWalletExists2(int8 acc_type) public {
        if (acc_type == -1 || acc_type == 0 || acc_type == 2) {
            Terminal.print(0, "TON Token Wallet still doesn't exists.");
            mainMenu();
        } else {
            Terminal.print(0, "TON Token Wallet exists.");
            optional(uint256) none;
            IFaucet(_addrFaucet).getBalance{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(getFaucetBalanceCb),
                onErrorId: tvm.functionId(onError),
                time: 0,
                expire: 0,
                pubkey: none,
                sign: false
            }(_userPubkey);
        }
    }

    function debotEnterPoint(address sender) public {
        _addrDemiurgeDebot = sender;
        Terminal.input(tvm.functionId(getTokenWalletAddr), "Enter pubkey:", false);
    }

    function getTokenWalletAddr(string value) public {
        (_userPubkey, ) = stoi("0x" + value);
        // Terminal.print(0, format("DEBUG: getTokenWalletAddr pubkey {}", _userPubkey));
        getTokenWalletAddr2(_userPubkey);
    }

    function getTokenWalletAddr2(uint256 value) public {
        // Terminal.print(0, format("DEBUG: getTokenWalletAddr2 value {}", value));
        optional(uint256) none;
        ITokenRoot(_addrTokenRoot).getWalletAddress{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(getTokenWalletAddrCb),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: none,
            sign: false
        }(int8(0), value, uint256(0));
    }

    function getTokenWalletAddrCb(address value) public {
        // Terminal.print(0, format("DEBUG: getTokenWalletAddrCb address {}", value));
        _addrUserTokenWallet = value;
        Sdk.getAccountType(tvm.functionId(checkUserTokenWalletExists), value);
    }

    function checkUserTokenWalletExists(int8 acc_type) public {
        if (acc_type == -1 || acc_type == 0 || acc_type == 2) {
            Terminal.print(0, "TON Token Wallet doesn't exists.");
            this.deployWallet();
        } else {
            Terminal.print(0, "TON Token Wallet exists.");
            optional(uint256) none;
            IFaucet(_addrFaucet).getBalance{
                abiVer: 2,
                extMsg: true,
                callbackId: tvm.functionId(getFaucetBalanceCb),
                onErrorId: tvm.functionId(onError),
                time: 0,
                expire: 0,
                pubkey: none,
                sign: false
            }(_userPubkey);
        }
    }

    function getFaucetBalanceCb(uint32 value) public {
        Terminal.print(0, format("Faucet balance: {} DeNS Token", value));
        _faucetBalance = value;
        optional(uint256) none;
        ITokenWallet(_addrUserTokenWallet).getBalance{
            abiVer: 2,
            extMsg: true,
            sign: false,
            callbackId: tvm.functionId(getWalletBalanceCb),
            onErrorId: tvm.functionId(onError),
            time: uint32(now),
            expire: 0,
            pubkey: none
        }();
    }

    function getWalletBalanceCb(uint128 value) public {
        Terminal.print(0, format("TIP-3 Wallet address: {}", _addrUserTokenWallet));
        Terminal.print(0, format("TIP-3 Wallet balance: {} DeNS Token", value));
        if(_faucetBalance != 0) {
            Terminal.print(0, "Sign the transaction to claim it.");
            this.claimTokens();
        } else {
            Terminal.print(0, "You have no tokens to claim.");
            this.back();
        }
    }

    function deployWallet() public {
        IFaucet(_addrFaucet).deployWallet{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(mainMenu),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: 0,
            sign: true    
        }();
    }

    function claimTokens() public {
        IFaucet(_addrFaucet).claimTokens{
            abiVer: 2,
            extMsg: true,
            callbackId: tvm.functionId(claimTokensCb),
            onErrorId: tvm.functionId(onError),
            time: 0,
            expire: 0,
            pubkey: 0,
            sign: true
        }(_addrUserTokenWallet);
    }

    function claimTokensCb() public {
          Terminal.print(tvm.functionId(back), "Success! You will recieve tokens in few moments.");
    }

    // refactor

    function back() public {
        IDemiurgeDebot(_addrDemiurgeDebot).mainMenu();
    }

    function onCodeUpgrade() internal override {
        tvm.resetStorage();
    }

    function onError(uint32 sdkError, uint32 exitCode) public {
        Terminal.print(0, format("Sdk error {}. Exit code {}.", sdkError, exitCode));
        back();
    }
}