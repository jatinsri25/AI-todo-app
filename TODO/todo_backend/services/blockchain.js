const Web3 = require('web3');
const web3 = new Web3(process.env.INFURA_URL);
const contract = require('../contracts/TodoTracker.json');

const todoContract = new web3.eth.Contract(
  contract.abi,
  process.env.CONTRACT_ADDRESS
);

exports.storeOnBlockchain = async (task, userAddress) => {
  const taskHash = web3.utils.sha3(task);
  return todoContract.methods.storeHash(taskHash)
    .send({ from: userAddress });
};

exports.verifyOnBlockchain = async (task, userAddress) => {
  const taskHash = web3.utils.sha3(task);
  return todoContract.methods.verifyHash(userAddress, taskHash)
    .call();
};