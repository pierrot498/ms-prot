import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";
import fs from "fs";

async function main() {
  const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  const Mkt = await ethers.getContractFactory("MSMarketplace");
  const mkt = Mkt.attach(networks.localhost.MSMarketplace.address);

  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  const offer1 = await mkt.connect(addr4).offer(contracts.localhost.dropERC721Contract.address, 1, 1, currency, ethers.utils.parseEther("5"), 1670684718);
  const offer1Tx = await offer1.wait()
  console.log(offer1Tx.events);

  const offers1 = await mkt.offers(contracts.localhost.dropERC721Contract.address, 1, addr4.address)
  console.log(offers1);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
