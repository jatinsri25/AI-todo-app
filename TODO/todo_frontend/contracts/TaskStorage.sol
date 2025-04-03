// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TaskStorage {
    mapping(bytes32 => bool) private taskHashes;

    event TaskStored(bytes32 indexed taskHash);

    function storeTask(string memory task) public {
        bytes32 hash = keccak256(abi.encodePacked(task, msg.sender));
        require(!taskHashes[hash], "Task already stored!");
        taskHashes[hash] = true;
        emit TaskStored(hash);
    }

    function verifyTask(string memory task, address owner) public view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(task, owner));
        return taskHashes[hash];
    }
}
