import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";

async function main() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const forwarder = "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693";
  const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
  const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
  const wEth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
  const defaultAdmin = "0x4B67F00B216066Fd07f15328F3751A333fE70f91";
  const gForwarder = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";

  const MSDropMkt = await ethers.getContractFactory("MSDropMarketplace");
  const msDropMkt = await upgrades.deployProxy(
    MSDropMkt,
    [defaultAdmin, [gForwarder], MSFee, goerliWETH, MSCommunity, 200],
    { initializer: "initialize", unsafeAllow: ["delegatecall"] }
  );
  console.log(msDropMkt.address);

  return { contractName: "MSDropMarketplace", address: msDropMkt.address };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result) => hre.run("graph", result))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
