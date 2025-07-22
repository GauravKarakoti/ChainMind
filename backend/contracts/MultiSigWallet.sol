// SPDX-License-Identifier: Nodit 
pragma solidity ^0.8.0;

contract MultiSigWallet {
    address[] public owners;
    uint public required;
    
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
    }
    
    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;
    
    event Deposit(address indexed sender, uint value);
    event Submission(uint indexed txId);
    event Confirmation(address indexed sender, uint indexed txId);
    event Execution(uint indexed txId);
    
    modifier onlyOwner() {
        bool isOwner = false;
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Not owner");
        _;
    }
    
    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required number");
        
        owners = _owners;
        required = _required;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    function submitTransaction(address _to, uint _value, bytes memory _data) public onlyOwner {
        uint txId = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        }));
        emit Submission(txId);
    }
    
    function confirmTransaction(uint _txId) public onlyOwner {
        require(_txId < transactions.length, "Invalid tx ID");
        require(!transactions[_txId].executed, "Tx already executed");
        require(!confirmations[_txId][msg.sender], "Tx already confirmed");
        
        confirmations[_txId][msg.sender] = true;
        emit Confirmation(msg.sender, _txId);
        
        if (isConfirmed(_txId)) {
            executeTransaction(_txId);
        }
    }
    
    function isConfirmed(uint _txId) public view returns (bool) {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[_txId][owners[i]]) {
                count++;
            }
        }
        return count >= required;
    }
    
    function executeTransaction(uint _txId) public {
        require(_txId < transactions.length, "Invalid tx ID");
        require(!transactions[_txId].executed, "Tx already executed");
        require(isConfirmed(_txId), "Not enough confirmations");
        
        Transaction storage txn = transactions[_txId];
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Tx execution failed");
        
        emit Execution(_txId);
    }
}