import { ethers, upgrades } from "hardhat";

async function main() {
  const address = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0"
  const gForwarder = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";
  const MSRegistry = await ethers.getContractFactory("MSRegistry");

  console.log("Deploying MSRegistry...");

  const msRegistry = await MSRegistry.deploy(gForwarder);
  await msRegistry.deployed()


  console.log(`MSRegistry deployed to ${msRegistry.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
