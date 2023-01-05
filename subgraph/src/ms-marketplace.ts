import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  AuctionClosed as AuctionClosedEvent,
  ListingAdded as ListingAddedEvent,
  ListingRemoved as ListingRemovedEvent,
  ListingUpdated as ListingUpdatedEvent,
  NewOffer as NewOfferEvent,
  NewSale as NewSaleEvent,
  NewBidOffer as NewBidOfferEvent,
  NewAcceptOffer as NewAcceptOfferEvent,
} from "../generated/MSMarketplace/MSMarketplace";
import {
  Nft,
  NftMarketContract,
  NftMarketAuction,
  NftMarketBuyNow,
  NftMarketBid,
  Account,
  NftMarketOffer,
} from "../generated/schema";
import { loadOrCreateNFT } from "./ms-drop-erc721";
import { loadOrCreateAccount } from "./helpers/accounts";
import { ZERO_BIG_DECIMAL, ZERO_BIG_INT } from "./helpers/constants";
import { getLogId } from "./helpers/ids";
import { MSMarketplace as MarketplaceAbi } from "../generated/MSMarketplace/MSMarketplace";
import { recordNftEvent, removePreviousTransferEvent } from "./helpers/events";
import {
  loadHighestOffer,
  outbidOrExpirePreviousOffer,
} from "./helpers/offers";

export function loadOrCreateNftMarketContract(
  address: Address
): NftMarketContract {
  let nftMarketContract = NftMarketContract.load(address.toHex());
  if (!nftMarketContract) {
    nftMarketContract = new NftMarketContract(address.toHex());
    nftMarketContract.numberOfBidsPlaced = ZERO_BIG_INT;
    nftMarketContract.save();
  }
  return nftMarketContract as NftMarketContract;
}

export function loadAuction(
  marketAddress: Address,
  auctionId: BigInt
): NftMarketAuction | null {
  return NftMarketAuction.load(
    marketAddress.toHex() + "-" + auctionId.toString()
  );
}

export function loadDirect(
  marketAddress: Address,
  directId: BigInt
): NftMarketBuyNow | null {
  return NftMarketBuyNow.load(
    marketAddress.toHex() + "-" + directId.toString()
  );
}

// AUCTION CLOSED : True = Auction closed, False = Auction Accepted
export function handleAuctionClosed(event: AuctionClosedEvent): void {
  // Cancel
  if (event.params.cancelled == true) {
    let auction = loadAuction(event.address, event.params.listingId);
    if (!auction) return;

    auction.status = "Canceled";
    auction.dateCanceled = event.block.timestamp;
    auction.transactionHashCanceled = event.transaction.hash;
    auction.save();

    let nft = Nft.load(auction.nft) as Nft;
    nft.mostRecentAuction = nft.latestFinalizedAuction;
    nft.activeAuction = null;
    nft.activeSalePriceInETH = null;
    nft.save();

    recordNftEvent(
      event,
      nft,
      "Unlisted",
      Account.load(auction.seller) as Account,
      auction,
      "MSMarketplace"
    );
  } // Finalize
  else if (event.params.cancelled == false) {
    let auction = loadAuction(event.address, event.params.listingId);
    if (!auction) return;

    if (auction.highestBid) {
      let currentBid = NftMarketBid.load(auction.highestBid as string);
      if (!currentBid) return;

      if (event.params.closer == event.params.auctionCreator) {
        currentBid.listerHasClaim = true;
        let nft = Nft.load(auction.nft);
        if (nft) {
          nft.ownedOrListedBy = currentBid.bidder;
          nft.save();
        }

        removePreviousTransferEvent(event);
        recordNftEvent(
          event,
          Nft.load(auction.nft) as Nft,
          "Sold",
          Account.load(currentBid.bidder) as Account,
          auction,
          "MSMarketplace",
          currentBid.amountInETH,
          null,
          auction.dateEnding
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

        auction.status = "Finalized";
        auction.dateFinalized = event.block.timestamp;

        let nft = Nft.load(auction.nft) as Nft;
        nft.latestFinalizedAuction = auction.id;
        nft.lastSalePriceInETH = currentBid.amountInETH;
        nft.activeSalePriceInETH = null;
        nft.activeAuction = null;
        nft.save();

        recordNftEvent(
          event,
          nft,
          "Settled",
          loadOrCreateAccount(event.transaction.from),
          auction,
          "MSMarketplace",
          null,
          Account.load(currentBid.bidder) as Account
        );
      }

      currentBid.save();
    }

    auction.save();
  }
}

// LISTING : DIRECT = 0 - AUCTION = 1
export function handleListingAdded(event: ListingAddedEvent): void {
  let nft = loadOrCreateNFT(
    event.params.assetContract,
    event.params.listing.tokenId,
    event
  );
  let marketContract = loadOrCreateNftMarketContract(event.address);

  //If Auction
  if (event.params.listing.listingType === 1) {
    let auction = new NftMarketAuction(
      marketContract.id + "-" + event.params.listingId.toString()
    );
    auction.nftMarketContract = marketContract.id;
    auction.auctionId = event.params.listingId;
    auction.nft = nft.id;
    auction.tokenId = nft.tokenId;
    auction.nftContract = event.params.assetContract.toHex();
    auction.status = "Open";
    let seller = loadOrCreateAccount(event.params.lister);
    auction.seller = seller.id;
    auction.dateCreated = event.block.timestamp;
    auction.dateEnding = event.params.listing.endTime;
    auction.transactionHashCreated = event.transaction.hash;
    auction.reservePriceInETH = event.params.listing.reservePricePerToken.toBigDecimal();
    auction.numberOfBids = ZERO_BIG_INT;
    auction.bidVolumeInETH = ZERO_BIG_DECIMAL;

    auction.save();

    nft.ownedOrListedBy = seller.id;
    nft.mostRecentAuction = auction.id;
    nft.activeAuction = auction.id;
    nft.activeSalePriceInETH = auction.reservePriceInETH;
    nft.save();

    removePreviousTransferEvent(event);
    recordNftEvent(
      event,
      nft,
      "Listed",
      seller,
      auction,
      "MSMarketplace",
      auction.reservePriceInETH
    );
  } //if Direct
  else if (event.params.listing.listingType === 0) {
    let direct = new NftMarketBuyNow(
      marketContract.id + "-" + event.params.listingId.toString()
    );
    direct.nftMarketContract = marketContract.id;
    direct.directId = event.params.listingId;
    direct.nft = nft.id;
    direct.tokenId = nft.tokenId;
    direct.nftContract = event.params.assetContract.toHex();
    direct.status = "Open";
    let seller = loadOrCreateAccount(event.params.lister);
    direct.seller = seller.id;
    direct.dateCreated = event.params.listing.startTime;
    direct.dateEnding = event.params.listing.endTime;
    direct.transactionHashCreated = event.transaction.hash;
    direct.amountInETH = event.params.listing.buyoutPricePerToken.toBigDecimal();
    direct.save();

    nft.ownedOrListedBy = seller.id;
    nft.mostRecentBuyNow = direct.id;
    nft.activeBuyNow = direct.id;
    nft.activeSalePriceInETH = direct.amountInETH;

    nft.save();

    recordNftEvent(
      event,
      nft,
      "Listed",
      seller,
      null,
      "MSMarketplace",
      direct.amountInETH,
      null,
      null,
      null,
      null,
      null,
      direct
    );
  }
}

// DIRECT LISTING CLOSED
export function handleListingRemoved(event: ListingRemovedEvent): void {
  let buyNow = loadDirect(event.address, event.params.listingId);
  if (!buyNow || buyNow.status != "Open") return;

  //let seller = Account.load(event.params.listingCreator)
  buyNow.status = "Canceled";
  buyNow.dateCanceled = event.block.timestamp;
  buyNow.transactionHashCanceled = event.transaction.hash;
  buyNow.save();

  let nft = Nft.load(buyNow.nft);
  if (nft) {
    nft.activeSalePriceInETH = null;
    nft.activeBuyNow = null;
    nft.save();
  }

  recordNftEvent(
    event,
    Nft.load(buyNow.nft) as Nft,
    "Unlisted",
    Account.load(buyNow.seller) as Account,
    null,
    "MSMarketplace",
    null,
    null,
    null,
    null,
    null,
    null,
    buyNow
  );
}

// LISTING UPDATED : DIRECT = 0 - AUCTION = 1
export function handleListingUpdated(event: ListingUpdatedEvent): void {
  // Auction
  if (event.params.updatedListing.listingType === 1) {
    let auction = loadAuction(event.address, event.params.listingId);
    if (!auction) {
      return;
    }
    auction.dateUpdated = event.params.updatedListing.startTime;
    auction.dateEnding = event.params.updatedListing.endTime;
    auction.reservePriceInETH = event.params.updatedListing.reservePricePerToken.toBigDecimal();
    auction.save();

    removePreviousTransferEvent(event);
    recordNftEvent(
      event,
      Nft.load(auction.nft) as Nft,
      "UpdatedListing",
      Account.load(auction.seller) as Account,
      auction,
      "MSMarketplace",
      auction.reservePriceInETH
    );
  } else if (event.params.updatedListing.listingType === 0) {
    let direct = loadDirect(event.address, event.params.listingId);
    if (!direct) {
      return;
    }
    direct.dateUpdated = event.params.updatedListing.startTime;
    direct.dateEnding = event.params.updatedListing.endTime;
    direct.amountInETH = event.params.updatedListing.buyoutPricePerToken.toBigDecimal();
    direct.save();

    recordNftEvent(
      event,
      Nft.load(direct.nft) as Nft,
      "UpdatedListing",
      Account.load(direct.seller) as Account,
      null,
      "MSMarketplace",
      direct.amountInETH,
      null,
      null,
      null,
      null,
      null,
      direct
    );
  }
}

// BID
export function handleNewBidOffer(event: NewBidOfferEvent): void {
  // Auction
  let auction = loadAuction(event.address, event.params.listingId);
  if (!auction) return;

  // Save new high bid
  let currentBid = new NftMarketBid(auction.id + "-" + getLogId(event));
  currentBid.bidWinnerHasClaim = false;
  currentBid.listerHasClaim = false;

  // Update previous high bid
  let highestBid = auction.highestBid;
  if (highestBid) {
    let previousBid = NftMarketBid.load(highestBid) as NftMarketBid;
    previousBid.status = "Outbid";
    previousBid.dateLeftActiveStatus = event.block.timestamp;
    previousBid.transactionHashLeftActiveStatus = event.transaction.hash;
    previousBid.outbidByBid = currentBid.id;
    previousBid.save();

    currentBid.bidThisOutbid = previousBid.id;
  } else {
    auction.dateStarted = event.block.timestamp;
  }

  currentBid.nftMarketAuction = auction.id;
  currentBid.nft = auction.nft;
  let bidder = loadOrCreateAccount(event.params.offeror);
  currentBid.bidder = bidder.id;
  currentBid.datePlaced = event.block.timestamp;
  currentBid.transactionHashPlaced = event.transaction.hash;
  currentBid.amountInETH = event.params.totalOfferAmount.toBigDecimal();
  currentBid.status = "Highest";
  currentBid.seller = auction.seller;

  if (!auction.highestBid) {
    auction.initialBid = currentBid.id;
  }

  let nft = Nft.load(auction.nft);
  if (nft) {
    nft.activeSalePriceInETH = event.params.totalOfferAmount.toBigDecimal();
    nft.save();
  }

  currentBid.save();
  auction.highestBid = currentBid.id;
  auction.dateEnding = event.params.auctionEndTime;

  auction.save();

  recordNftEvent(
    event,
    Nft.load(auction.nft) as Nft,
    "Bid",
    bidder,
    auction,
    "MSMarketplace",
    currentBid.amountInETH
  );
}

// BUY NOW
export function handleNewSale(event: NewSaleEvent): void {
  let buyNow = loadDirect(event.address, event.params.listingId);
  if (!buyNow || buyNow.status != "Open") return;

  //buyNow.isPrimarySale = true;
  buyNow.status = "Finalized";
  let buyer = loadOrCreateAccount(event.params.buyer);
  let seller = loadOrCreateAccount(event.params.lister);
  buyNow.buyer = buyer.id;
  buyNow.seller = seller.id;
  buyNow.dateAccepted = event.block.timestamp;
  buyNow.transactionHashAccepted = event.transaction.hash;
  buyNow.amountInETH = event.params.totalPricePaid.toBigDecimal();

  let nft = Nft.load(buyNow.nft) as Nft;
  nft.lastSalePriceInETH = event.params.totalPricePaid.toBigDecimal();
  nft.ownedOrListedBy = buyer.id;
  nft.activeBuyNow = null;
  nft.activeSalePriceInETH = null;
  nft.save();
  buyNow.save();

  recordNftEvent(
    event,
    nft,
    "Sold",
    buyer,
    null,
    "MSMarketplace",
    buyNow.amountInETH,
    null,
    null,
    null,
    null,
    null,
    buyNow
  );
}

// OFFER
export function handleNewOffer(event: NewOfferEvent): void {
  let nft = loadOrCreateNFT(
    event.params.nftContract,
    event.params.tokenId,
    event
  );
  let buyer = loadOrCreateAccount(event.params.offeror);
  let offer = new NftMarketOffer(getLogId(event));
  let amountInETH = event.params.totalOfferAmount.toBigDecimal();
  offer.nftMarketContract = loadOrCreateNftMarketContract(event.address).id;
  offer.nft = nft.id;
  offer.nftContract = nft.nftContract;
  offer.status = "Open";
  offer.buyer = buyer.id;
  offer.amountInETH = amountInETH;
  offer.dateCreated = event.block.timestamp;
  offer.transactionHashCreated = event.transaction.hash;
  offer.dateExpires = event.block.timestamp.plus(BigInt.fromI32(86400));

  let isIncrease = outbidOrExpirePreviousOffer(event, nft, buyer, offer);

  offer.save();

  recordNftEvent(
    event,
    nft,
    isIncrease ? "OfferChanged" : "OfferMade",
    buyer,
    null,
    "MSMarketplace",
    amountInETH,
    null,
    null,
    null,
    null,
    offer
  );
  nft.mostRecentOffer = offer.id;
  if (nft.nftHighestOfferAmount) {
    nft.nftHighestOfferAmount =
      nft.nftHighestOfferAmount >= offer.amountInETH
        ? nft.nftHighestOfferAmount
        : offer.amountInETH;
  } else {
    //new offer
    nft.nftHighestOfferAmount = offer.amountInETH;
  }
  if (nft.nftHighestOffer) {
    nft.nftHighestOffer =
      offer.amountInETH >= nft.nftHighestOfferAmount!
        ? offer.id
        : nft.nftHighestOffer;
  } else {
    //new offer
    nft.nftHighestOffer = offer.id;
  }

  nft.save();
}

// OFFER ACCEPTED
export function handleNewAcceptOffer(event: NewAcceptOfferEvent): void {
  let nft = loadOrCreateNFT(
    event.params.assetContract,
    event.params.tokenId,
    event
  );
  nft.nftHighestOffer = null;
  nft.nftHighestOfferAmount = null;
  nft.save();
  let offer = loadHighestOffer(nft);
  if (!offer) {
    return;
  }
  offer.status = "Accepted";
  let buyer = loadOrCreateAccount(event.params.buyer);
  let seller = loadOrCreateAccount(event.params.lister);
  offer.seller = seller.id;
  offer.dateAccepted = event.block.timestamp;
  offer.transactionHashAccepted = event.transaction.hash;
  offer.save();

  recordNftEvent(
    event,
    nft,
    "OfferAccepted",
    seller,
    null,
    "MSMarketplace",
    offer.amountInETH,
    buyer,
    null,
    null,
    null,
    offer
  );
}
