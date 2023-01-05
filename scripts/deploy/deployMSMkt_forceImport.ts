import { ethers, upgrades } from "hardhat";

async function main() {
  const defaultAdmin = "0x4B67F00B216066Fd07f15328F3751A333fE70f91";
  const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
  const recipient = "0x1c34c2eB08ee832aF36cc56E66A3EEEb240ee887";
  const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

  const proxyAddress = "0xEED657B9e6543C28E5082eAD193D201D49faaB43";
  const impl = "0xf18Aa8E427BA4C8f56F81C82011756bC384f10Af";

  const MSMkt = await ethers.getContractFactory("MSMarketplace");

  console.log("Deploying MSMarketplace...");

  const msMkt = await upgrades.forceImport(impl, MSMkt);
  //const msMkt = await upgrades.prepareUpgrade(proxyAddress, MSMkt, { unsafeAllow: ['constructor', 'delegatecall'], constructorArgs: [goerliWETH] });

  //console.log(msMkt, " BoxV4 implementation contract address")
  // console.log(await upgrades.erc1967.getImplementationAddress(msMkt.address)," getImplementationAddress")
  // console.log(await upgrades.erc1967.getAdminAddress(msMkt.address), " getAdminAddress")    

  console.log("MSMarketplace upgraded successfully");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
