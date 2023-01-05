import { ethers, upgrades } from "hardhat";

async function main() {
  const MSERC155 = await ethers.getContractFactory("MSTokenERC1155");

  console.log("Deploying MSERC1155...");

  const msErc1155 = await MSERC155.deploy();
  await msErc1155.deployed();

  
  console.log(`MSERC1155 deployed to ${msErc1155.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
