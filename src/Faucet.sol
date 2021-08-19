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
    
    uint128 public _totalDistributed;

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

        _totalDistributed = _balances[msg.pubkey()];
        ITokenWallet(_addrTokenWallet).transfer
            {value: 0.5 ton, flag: 1, bounce: false}
            (address(this), addrTokenWallet, _balances[msg.pubkey()], 0.2 ton, false);

        delete _balances[msg.pubkey()];
    }

    function getTotalDistributed() public onlyContract override {
        IFaucetCb(msg.sender).getTotalDistributedCb
            {value: 0, flag: 64, bounce: false}
            (_totalDistributed);
    }

    function changeBalance(uint256 pubkey, uint32 value) public override signed returns (uint32) {
        _balances[pubkey] += value;
        return _balances[pubkey];
    }

    function deployWallet() external override {
        require(_balances[msg.pubkey()] != 0, Errors.INVALID_CALLER);
        tvm.accept();

        ITokenRoot(_addrTokenRoot).deployEmptyWallet
            {value: 1 ton, flag: 1, bounce: true}
            (0, msg.pubkey(), address(0), 0.5 ton);
    }

    function getBalance(uint256 userPubkey) external override returns (uint32 balance) {
        balance = _balances[userPubkey];
    }

}