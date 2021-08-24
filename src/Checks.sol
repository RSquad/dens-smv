pragma ton-solidity >= 0.45.0;

import './Errors.sol';

contract Checks {
    uint8 _checkList;

    function _passCheck(uint8 check) internal inline {
        _checkList &= ~check;
    }
    function _isCheckListEmpty() internal view inline returns (bool) {
        return (_checkList == 0);
    }
    modifier checksEmpty() {
        require(_isCheckListEmpty(), Errors.NOT_ALL_CHECKS_PASSED);
        tvm.accept();
        _;
    }
}