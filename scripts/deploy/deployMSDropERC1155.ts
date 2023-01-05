import { ethers, upgrades } from "hardhat";

async function main() {
  const MSDrop155 = await ethers.getContractFactory("MSDropERC1155");

  console.log("Deploying MSDropERC1155...");

  const msDrop1155 = await MSDrop155.deploy();
  await msDrop1155.deployed();

  
  console.log(`MSDropERC1155 deployed to ${msDrop1155.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
