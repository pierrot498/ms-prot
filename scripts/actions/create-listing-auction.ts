import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";
import fs from "fs";

async function main() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(
    contracts.localhost.dropERC721Contract.address
  );

  const Mkt = await ethers.getContractFactory("MSMarketplace");
  const mkt = Mkt.attach(networks.localhost.MSMarketplace.address);

  const feeInfo = await mkt.getPlatformFeeInfo();
  console.log(feeInfo);

  const approve = await msDrop721
    .connect(addr1)
    .setApprovalForAll(networks.localhost.MSMarketplace.address, true);
  const approveTx = await approve.wait();
  console.log(approveTx.events);

  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const listingInfo = {
    assetContract: contracts.localhost.dropERC721Contract.address,
    tokenId: 1,
    startTime: 0,
    secondsUntilEndTime: 0,
    quantityToList: 1,
    currencyToAccept: currency,
    reservePricePerToken: ethers.utils.parseEther("1"),
    buyoutPricePerToken: ethers.utils.parseEther("100"),
    listingType: 1,
  };

  const auctionListing = await mkt.connect(addr1).createListing(listingInfo);
  const auctionListingTx = await auctionListing.wait()
  console.log(auctionListingTx.events);

  const listing0 = await mkt.listings(0)
  console.log(listing0);
  
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
