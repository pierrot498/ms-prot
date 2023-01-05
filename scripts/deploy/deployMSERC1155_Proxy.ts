import { ethers, upgrades } from "hardhat";

async function main() {
  const defaultAdmin = "0x1c34c2eB08ee832aF36cc56E66A3EEEb240ee887";
  const creatorAdmin = "0x0C671D7eA0dbC81810327DE5746aCCE4D52608ed";
  const name = "TEST02";
  const symbol = "TEST";
  const contractUri = "";

  const MSERC155 = await ethers.getContractFactory("MSTokenERC1155");

  console.log("Deploying MSERC1155...");

  const msErc1155 = await upgrades.deployProxy(
    MSERC155,
    [
      defaultAdmin,
      creatorAdmin,
      name,
      symbol,
      contractUri,
      [],
      creatorAdmin,
      creatorAdmin,
      0,
      0,
      creatorAdmin,
    ],
    { initializer: "initialize" }
  );

  await msErc1155.deployed();

  console.log(`MSERC1155 deployed to ${msErc1155.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
