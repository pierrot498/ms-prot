import { ethers } from "hardhat";

async function main() {
  const Forwarder = await ethers.getContractFactory("Forwarder");
  console.log("Deploying Forwarder...");
  const forwarder = await Forwarder.deploy();
  await forwarder.deployed();
  console.log(`Forwarder ${forwarder.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
