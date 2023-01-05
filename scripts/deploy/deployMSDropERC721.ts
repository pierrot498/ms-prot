import { ethers, upgrades } from "hardhat";

async function main() {
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");

  console.log("Deploying MSDropERC721...");

  const msDrop721 = await MSDrop721.deploy();
  await msDrop721.deployed();

  
  console.log(`MSDropERC721 deployed to ${msDrop721.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
