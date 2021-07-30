pragma ton-solidity >=0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

import './Base.sol';
import './Glossary.sol';
import './interfaces/IDemiurgeStoreCallback.sol';

contract DemiurgeStore is Base {

    mapping(uint8 => address) public addrs;
    mapping(uint8 => TvmCell) public codes;

    function setPadawanCode(TvmCell code) public signed {
        codes[uint8(ContractType.Padawan)] = code;
    }
    function setProposalCode(TvmCell code) public signed {
        codes[uint8(ContractType.Proposal)] = code;
    }

    function setDensRootAddr(address addr) public signed {
        require(addr != address(0));
        addrs[uint8(ContractAddr.DensRoot)] = addr;
    }
    function setTokenRootAddr(address addr) public signed {
        require(addr != address(0));
        addrs[uint8(ContractAddr.TokenRoot)] = addr;
    }

    /*
     *  Query Store functions
     */

    function queryCode(ContractType kind) public view {
        TvmCell code = codes[uint8(kind)];
        IDemiurgeStoreCallback(msg.sender).updateCode{value: 0, flag: 64, bounce: false}(kind, code);
    }

    function queryAddr(ContractAddr kind) public view {
        address addr = addrs[uint8(kind)];
        IDemiurgeStoreCallback(msg.sender).updateAddr{value: 0, flag: 64, bounce: false}(kind, addr);
    }
}