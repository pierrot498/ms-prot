import { ethers, upgrades } from "hardhat";

async function main() {
  const defaultAdmin = "0x4B67F00B216066Fd07f15328F3751A333fE70f91";
  const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
  const recipient = "0x1c34c2eB08ee832aF36cc56E66A3EEEb240ee887";
  const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

  const proxyAddress = "0xc8B6De648aFB11BA0D14FBcb83887F7EBc8933fE";

  const MSMkt = await ethers.getContractFactory("MSMarketplaceV2_2");

  console.log("Deploying MSMarketplaceV2_2...");

  const msMkt = await upgrades.upgradeProxy(proxyAddress, MSMkt, {unsafeAllow: ['delegatecall']});
  //const msMkt = await upgrades.prepareUpgrade(proxyAddress, MSMkt, { unsafeAllow: ['constructor', 'delegatecall'], constructorArgs: [goerliWETH] });

  console.log(msMkt.address, "Should be the same address as proxy")
  console.log(await upgrades.erc1967.getImplementationAddress(msMkt.address)," getImplementationAddress")
  console.log(await upgrades.erc1967.getAdminAddress(msMkt.address), " getAdminAddress")    

  // console.log("MSMarketplace upgraded successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
