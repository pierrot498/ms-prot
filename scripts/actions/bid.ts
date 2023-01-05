import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";
import fs from "fs";

async function main() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();

  const Mkt = await ethers.getContractFactory("MSMarketplace");
  const mkt = Mkt.attach(networks.localhost.MSMarketplace.address);

  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  const bid1 = await mkt.connect(addr2).bid(1, 1, currency, ethers.utils.parseEther("2"), 86400, {value: ethers.utils.parseEther("2")});
  const bid1Tx = await bid1.wait()
  console.log(bid1Tx.events);

  const listing0 = await mkt.listings(1)
  console.log(listing0);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
