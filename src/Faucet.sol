pragma ton-solidity >= 0.43.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "./Base.sol";
import "./Errors.sol";
import "./interfaces/ITokenRoot.sol";
import "./interfaces/ITokenWallet.sol";
import "./interfaces/IFaucet.sol";

contract Faucet is Base, IFaucet {
    mapping(uint256 => uint32) public _balances;

    mapping(address => uint32) _pandingOwner;

    address public _addrTokenRoot;
    address public _addrTokenWallet;

    constructor(address addrTokenRoot, address addrTokenWallet) public {
        tvm.accept();
        _addrTokenRoot = addrTokenRoot;
        _addrTokenWallet = addrTokenWallet;
    }

    function claimTokens(address addrTokenWallet) external override {
        require(_balances[msg.pubkey()] != 0, Errors.INVALID_CALLER);
        tvm.accept();

        ITokenWallet(_addrTokenWallet).transfer(addrTokenWallet, _balances[msg.pubkey()], 0.1 ton);

        delete _balances[msg.pubkey()];
    }

    function getBalance(uint256 userPubkey) external override returns (uint32 balance) {
        balance = _balances[userPubkey];
    }

    function changeBalance(uint256 pubkey, uint32 value) public override signed returns (uint32) {
        _balances[pubkey] += value;
        return _balances[pubkey];
    }

    function deployWallet() external override {
        require(_balances[msg.pubkey()] != 0, Errors.INVALID_CALLER);
        tvm.accept();

        ITokenRoot(_addrTokenRoot).deployEmptyWallet
            {value: 0.5 ton, flag: 1, bounce: true}
            (0, 0, msg.pubkey(), 0, 0.25 ton);
    }

}