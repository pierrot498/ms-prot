import { ethers, upgrades } from "hardhat";

async function main() {
  const TWERC155 = await ethers.getContractFactory("TokenERC1155");

  console.log("Deploying MSERC1155...");

  const twErc1155 = await TWERC155.deploy();
  await twErc1155.deployed();

  
  console.log(`MSERC1155 deployed to ${twErc1155.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
