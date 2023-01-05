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

  const bid1 = await mkt
    .connect(addr3)
    .bid(0, 1, currency, ethers.utils.parseEther("3"), 86400, {
      value: ethers.utils.parseEther("3"),
    });
  const bid1Tx = await bid1.wait();
  console.log(bid1Tx.events);

  const listing0 = await mkt.listings(0);
  console.log(listing0);

  await hre.network.provider.send("evm_increaseTime", [25 * 60 * 60]);

  const claimBidder = await mkt.connect(addr3).closeAuction(0, addr3.address);
  const claimBidderTx = await claimBidder.wait();
  console.log(claimBidderTx.events);

  const claimSeller = await mkt.connect(addr1).closeAuction(0, addr1.address);
  const claimSellerTx = await claimSeller.wait();
  console.log(claimSellerTx.events);
  console.log("addr1 :",await addr1.getBalance());
  console.log("addr3 :",await addr3.getBalance());
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
