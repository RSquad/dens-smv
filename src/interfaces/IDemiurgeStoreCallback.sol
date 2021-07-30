pragma ton-solidity >= 0.42.0;
import '../Glossary.sol';

interface IDemiurgeStoreCallback {
    function updateAddr(ContractAddr kind, address addr) external;
    function updateCode(ContractType kind, TvmCell code) external;
}