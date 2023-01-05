import { ethers, upgrades } from "hardhat";

async function main() {
  const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
  const registry = "0x04684aa68ACAfE57FD1e2D33dd4e2c61D1eA949B";
  const MSFactory = await ethers.getContractFactory("MSFactory");

  console.log("Deploying MSFactory...");

  const msFactory = await MSFactory.deploy(forwarder, registry);
  await msFactory.deployed();

  console.log(`MSFactory deployed to ${msFactory.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
