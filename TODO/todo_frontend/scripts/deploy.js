const hre = require("hardhat");

async function main() {
  const TaskStorage = await hre.ethers.getContractFactory("TaskStorage");
  const taskStorage = await TaskStorage.deploy();
  await taskStorage.deployed();

  console.log(`✅ TaskStorage deployed at: ${taskStorage.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
