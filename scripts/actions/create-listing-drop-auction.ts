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

  const DropMkt = await ethers.getContractFactory("MSDropMarketplace");
  const dropMkt = DropMkt.attach(networks.localhost.MSDropMarketplace.address);

  const feeInfo = await dropMkt.getPlatformFeeInfo();
  console.log(feeInfo);

  const approve = await msDrop721.setApprovalForAll(
    networks.localhost.MSDropMarketplace.address,
    true
  );
  const approveTx = await approve.wait();
  console.log(approveTx.events);

  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const dropListingInfo = {
    assetContract: contracts.localhost.dropERC721Contract.address,
    tokenId: 10,
    startTime: Math.floor(Date.now() / 1000),
    secondsUntilEndTime: 0,
    quantityToList: 1,
    currencyToAccept: currency,
    reservePricePerToken: ethers.utils.parseEther("1"),
    buyoutPricePerToken: ethers.utils.parseEther("100"),
    listingType: 1,
    dropAuction: {
      auctionDrop: true,
      platformAuctionDropFeeBps: 1500,
      dropCreatorAddress: owner.address,
    },
  };

  const dropAuctionListing = await dropMkt.createListing(dropListingInfo);
  const dropAuctionListingTx = await dropAuctionListing.wait();
  console.log(dropAuctionListingTx.events);

  const dropListing0 = await dropMkt.listings(0);
  console.log(dropListing0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
