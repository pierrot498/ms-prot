import { ethers, upgrades } from "hardhat";

async function main() {
  const defaultAdmin = "0x4B67F00B216066Fd07f15328F3751A333fE70f91";
  const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
  const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
  const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58"
  const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

  const MSMktV3 = await ethers.getContractFactory("MSMarketplaceV3");

  console.log("Deploying MSMarketplaceV3...");

  const msMktV3 = await upgrades.deployProxy(
    MSMktV3,
    [defaultAdmin, "ipfs://", [forwarder], MSFee, 300, goerliWETH, MSCommunity, 200],
    { initializer: "initialize", unsafeAllow: ['delegatecall'] }
  );

  await msMktV3.deployed();

  console.log(`MSMarketplace deployed to ${msMktV3.address}`);
  console.log(msMktV3.address," msMarketplace(proxy) address")
  console.log(await upgrades.erc1967.getImplementationAddress(msMktV3.address)," getImplementationAddress")
  console.log(await upgrades.erc1967.getAdminAddress(msMktV3.address)," getAdminAddress")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
