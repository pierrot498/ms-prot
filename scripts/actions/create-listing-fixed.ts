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
    .connect(addr2)
    .setApprovalForAll(networks.localhost.MSMarketplace.address, true);
  const approveTx = await approve.wait();
  console.log(approveTx.events);

  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const listingInfo = {
    assetContract: contracts.localhost.dropERC721Contract.address,
    tokenId: 2,
    startTime: Math.floor(Date.now() / 1000),
    secondsUntilEndTime: 86400,
    quantityToList: 1,
    currencyToAccept: currency,
    reservePricePerToken: 0,
    buyoutPricePerToken: ethers.utils.parseEther("1"),
    listingType: 0,
  };

  const auctionListing = await mkt.connect(addr2).createListing(listingInfo);
  const auctionListingTx = await auctionListing.wait()
  console.log(auctionListingTx.events);

  const listing1 = await mkt.listings(1)
  console.log(listing1);
  
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
