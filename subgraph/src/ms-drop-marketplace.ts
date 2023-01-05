import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  DropAuctionClosed as DropAuctionClosedEvent,
  DropListingAdded as DropListingAddedEvent,
  DropListingUpdated as DropListingUpdatedEvent,
  NewDropBidOffer as NewDropBidOfferEvent,
} from "../generated/MSDropMarketplace/MSDropMarketplace";
import {
  Creator,
  Nft,
  NftMarketBid,
  AuctionPrimarySale,
  Account,
} from "../generated/schema";
import { loadOrCreateNFT } from "./ms-drop-erc721";
import { loadOrCreateAccount } from "./helpers/accounts";
import { ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "./helpers/constants";
import { getLogId } from "./helpers/ids";
import { MSDropMarketplace as MSDropMarketplaceAbi } from "../generated/MSDropMarketplace/MSDropMarketplace";
import { loadOrCreateNftMarketContract } from "./ms-marketplace";
import { recordNftEvent, removePreviousTransferEvent } from "./helpers/events";

export function loadDropAuction(
  marketAddress: Address,
  auctionId: BigInt
): AuctionPrimarySale | null {
  return AuctionPrimarySale.load(
    marketAddress.toHex() + "-" + auctionId.toString()
  );
}

export function handleDropAuctionClosed(event: DropAuctionClosedEvent): void {
  // Cancel
  if (event.params.cancelled == true) {
    let dropAuction = loadDropAuction(event.address, event.params.listingId);
    if (!dropAuction) return;

    dropAuction.status = "Canceled";
    dropAuction.dateCanceled = event.block.timestamp;
    dropAuction.transactionHashCanceled = event.transaction.hash;
    dropAuction.save();

    let nft = Nft.load(dropAuction.nft) as Nft;
    nft.activeSalePriceInETH = null;
    nft.activePrimarySaleAuction = null;
    nft.save();

    recordNftEvent(
      event,
      nft,
      "Unlisted",
      Account.load(dropAuction.seller) as Account,
      null,
      "MSDropMarketplace",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      dropAuction
    );
  } // Finalize
  else if (event.params.cancelled == false) {
    let dropAuction = loadDropAuction(event.address, event.params.listingId);
    if (!dropAuction) return;

    if (dropAuction.highestBid) {
      let currentBid = NftMarketBid.load(dropAuction.highestBid as string);
      if (!currentBid) return;

      if (event.params.closer == event.params.auctionCreator) {
        currentBid.listerHasClaim = true;
        let nft = Nft.load(dropAuction.nft);
        if (nft) {
          nft.ownedOrListedBy = currentBid.bidder;
          nft.save();
        }

        removePreviousTransferEvent(event);
        recordNftEvent(
          event,
          Nft.load(dropAuction.nft) as Nft,
          "Sold",
          Account.load(currentBid.bidder) as Account,
          null,
          "MSDropMarketplace",
          currentBid.amountInETH,
          null,
          dropAuction.dateEnding,
          null,
          null,
          null,
          null,
          dropAuction
        );
      }
      if (event.params.closer == event.params.winningBidder) {
        currentBid.bidWinnerHasClaim = true;
      }

      if (
        currentBid.bidWinnerHasClaim == true &&
        currentBid.listerHasClaim == true
      ) {
        currentBid.status = "FinalizedWinner";
        currentBid.dateLeftActiveStatus = event.block.timestamp;
        currentBid.transactionHashLeftActiveStatus = event.transaction.hash;

        dropAuction.status = "Finalized";
        dropAuction.dateFinalized = event.block.timestamp;
        dropAuction.isPrimarySale = false;

        let nft = Nft.load(dropAuction.nft) as Nft;
        nft.nftPrimarySaleAuction = dropAuction.id;
        nft.lastSalePriceInETH = currentBid.amountInETH;
        nft.activeSalePriceInETH = null;
        nft.activePrimarySaleAuction = null;
        nft.save();

        recordNftEvent(
          event,
          nft,
          "Settled",
          loadOrCreateAccount(event.transaction.from),
          null,
          "MSDropMarketplace",
          null,
          Account.load(currentBid.bidder) as Account,
          null,
          null,
          null,
          null,
          null,
          dropAuction
        );
      }

      currentBid.save();
    }

    dropAuction.save();
  }
}

// LISTING : DIRECT = 0 - AUCTION = 1
export function handleDropListingAdded(event: DropListingAddedEvent): void {
  let nft = loadOrCreateNFT(
    event.params.assetContract,
    event.params.listing.tokenId,
    event
  );
  let marketContract = loadOrCreateNftMarketContract(event.address);

  //If Auction
  if (event.params.listing.listingType === 1) {
    let dropAuction = new AuctionPrimarySale(
      marketContract.id + "-" + event.params.listingId.toString()
    );
    dropAuction.nftMarketContract = marketContract.id;
    dropAuction.auctionId = event.params.listingId;
    dropAuction.nft = nft.id;
    dropAuction.tokenId = nft.tokenId;
    dropAuction.nftContract = event.params.assetContract.toHex();
    dropAuction.status = "Open";
    let seller = loadOrCreateAccount(event.params.lister);
    dropAuction.seller = seller.id;
    dropAuction.dateCreated = event.params.listing.startTime;
    dropAuction.dateEnding = event.params.listing.endTime;
    dropAuction.transactionHashCreated = event.transaction.hash;
    dropAuction.reservePriceInETH = event.params.listing.reservePricePerToken.toBigDecimal();
    dropAuction.numberOfBids = ZERO_BIG_INT;
    dropAuction.bidVolumeInETH = ZERO_BIG_DECIMAL;
    dropAuction.dropAuction = event.params.listing.dropAuction.auctionDrop;
    dropAuction.dropCreatorAddress = loadOrCreateAccount(
      event.params.listing.dropAuction.dropCreatorAddress
    ).id;
    dropAuction.platformAuctionDropFeeBps =
      event.params.listing.dropAuction.platformAuctionDropFeeBps;
    dropAuction.isPrimarySale = true;

    dropAuction.save();

    nft.ownedOrListedBy = seller.id;
    nft.nftPrimarySaleAuction = dropAuction.id;
    nft.activePrimarySaleAuction = dropAuction.id;
    nft.activeSalePriceInETH = dropAuction.reservePriceInETH;
    nft.save();

    removePreviousTransferEvent(event);
    recordNftEvent(
      event,
      nft,
      "Listed",
      seller,
      null,
      "MSDropMarketplace",
      dropAuction.reservePriceInETH,
      null,
      null,
      null,
      null,
      null,
      null,
      dropAuction
    );
  }
}

export function handleDropListingUpdated(event: DropListingUpdatedEvent): void {
  if (event.params.updatedDropListing.listingType === 1) {
    let dropAuction = loadDropAuction(event.address, event.params.listingId);
    if (!dropAuction) {
      return;
    }
    dropAuction.dateUpdated = event.params.updatedDropListing.startTime;
    dropAuction.dateEnding = event.params.updatedDropListing.endTime;
    dropAuction.reservePriceInETH = event.params.updatedDropListing.reservePricePerToken.toBigDecimal();
    dropAuction.save();

    removePreviousTransferEvent(event);
    recordNftEvent(
      event,
      Nft.load(dropAuction.nft) as Nft,
      "UpdatedListing",
      Account.load(dropAuction.seller) as Account,
      null,
      "MSDropMarketplace",
      dropAuction.reservePriceInETH,
      null,
      null,
      null,
      null,
      null,
      null,
      dropAuction
    );
  }
}

// BID
export function handleNewDropBidOffer(event: NewDropBidOfferEvent): void {
  // Auction

  let dropAuction = loadDropAuction(event.address, event.params.listingId);
  if (!dropAuction) return;

  // Save new high bid
  let currentBid = new NftMarketBid(dropAuction.id + "-" + getLogId(event));
  currentBid.bidWinnerHasClaim = false;
  currentBid.listerHasClaim = false;

  // Update previous high bid
  let highestBid = dropAuction.highestBid;
  if (highestBid) {
    let previousBid = NftMarketBid.load(highestBid) as NftMarketBid;
    previousBid.status = "Outbid";
    previousBid.dateLeftActiveStatus = event.block.timestamp;
    previousBid.transactionHashLeftActiveStatus = event.transaction.hash;
    previousBid.outbidByBid = currentBid.id;
    previousBid.save();

    currentBid.bidThisOutbid = previousBid.id;
  } else {
    dropAuction.dateStarted = event.block.timestamp;
  }

  currentBid.auctionPrimarySale = dropAuction.id;
  currentBid.nft = dropAuction.nft;
  let bidder = loadOrCreateAccount(event.params.offeror);
  currentBid.bidder = bidder.id;
  currentBid.datePlaced = event.block.timestamp;
  currentBid.transactionHashPlaced = event.transaction.hash;
  currentBid.amountInETH = event.params.totalOfferAmount.toBigDecimal();
  currentBid.status = "Highest";
  currentBid.seller = dropAuction.seller;

  if (!dropAuction.highestBid) {
    dropAuction.initialBid = currentBid.id;
  }

  let nft = Nft.load(dropAuction.nft) as Nft;
  nft.activeSalePriceInETH = event.params.totalOfferAmount.toBigDecimal();

  currentBid.save();
  dropAuction.highestBid = currentBid.id;
  dropAuction.dateEnding = event.params.auctionEndTime;

  dropAuction.save();

  recordNftEvent(
    event,
    Nft.load(dropAuction.nft) as Nft,
    "Bid",
    bidder,
    null,
    "MSDropMarketplace",
    currentBid.amountInETH,
    null,
    null,
    null,
    null,
    null,
    null,
    dropAuction
  );
}
