pragma ton-solidity >=0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import './Base.sol';
import './Glossary.sol';
import './interfaces/ISmvRootStore.sol';

contract SmvRootStore is Base, ISmvRootStore {
    mapping(uint8 => address) public _addrs;
    mapping(uint8 => TvmCell) public _codes;

    function setPadawanCode(TvmCell code) public signed override {
        _codes[uint8(ContractCode.Padawan)] = code;
    }
    function setProposalCode(TvmCell code) public signed override {
        _codes[uint8(ContractCode.Proposal)] = code;
    }

    function setClientAddr(address addr) public signed override {
        require(addr != address(0));
        _addrs[uint8(ContractAddr.Client)] = addr;
    }
    function setTokenRootAddr(address addr) public signed override {
        require(addr != address(0));
        _addrs[uint8(ContractAddr.TokenRoot)] = addr;
    }
    function setFaucetAddr(address addr) public signed override {
        require(addr != address(0));
        _addrs[uint8(ContractAddr.Faucet)] = addr;
    }

    function queryCode(ContractCode kind) public override {
        TvmCell code = _codes[uint8(kind)];
        ISmvRootStoreCb(msg.sender).updateCode{value: 0, flag: 64, bounce: false}(kind, code);
    }
    function queryAddr(ContractAddr kind) public override {
        address addr = _addrs[uint8(kind)];
        ISmvRootStoreCb(msg.sender).updateAddr{value: 0, flag: 64, bounce: false}(kind, addr);
    }
}