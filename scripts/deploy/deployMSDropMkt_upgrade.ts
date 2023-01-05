import { ethers, upgrades } from "hardhat";

async function main() {
  const proxyAddress = "0xb082D5f305cC52634159640cA991a7a6Cf9CB275";

  const MSDropMkt = await ethers.getContractFactory("MSDropMarketplaceV2");

  console.log("Deploying MSMarketplaceV2...");

  const msDropMkt = await upgrades.upgradeProxy(proxyAddress, MSDropMkt, {unsafeAllow: ['delegatecall']});
  //const msMkt = await upgrades.prepareUpgrade(proxyAddress, MSMkt, { unsafeAllow: ['constructor', 'delegatecall'], constructorArgs: [goerliWETH] });

  console.log(msDropMkt.address, "Should be the same address as proxy")
  console.log(await upgrades.erc1967.getImplementationAddress(msDropMkt.address)," getImplementationAddress")
  console.log(await upgrades.erc1967.getAdminAddress(msDropMkt.address), " getAdminAddress")    

  // console.log("MSMarketplace upgraded successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
