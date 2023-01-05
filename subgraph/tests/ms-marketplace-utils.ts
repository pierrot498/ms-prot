import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  AuctionBuffersUpdated,
  AuctionClosed,
  Initialized,
  ListingAdded,
  ListingRemoved,
  ListingUpdated,
  MSCommunityFeeInfoUpdated,
  NewAcceptOffer,
  NewBidOffer,
  NewOffer,
  NewSale,
  PlatformFeeInfoUpdated,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  primaryMSCommunityFeeInfoUpdated
} from "../generated/MSMarketplace/MSMarketplace"

export function createAuctionBuffersUpdatedEvent(
  timeBuffer: BigInt,
  bidBufferBps: BigInt
): AuctionBuffersUpdated {
  let auctionBuffersUpdatedEvent = changetype<AuctionBuffersUpdated>(
    newMockEvent()
  )

  auctionBuffersUpdatedEvent.parameters = new Array()

  auctionBuffersUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timeBuffer",
      ethereum.Value.fromUnsignedBigInt(timeBuffer)
    )
  )
  auctionBuffersUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "bidBufferBps",
      ethereum.Value.fromUnsignedBigInt(bidBufferBps)
    )
  )

  return auctionBuffersUpdatedEvent
}

export function createAuctionClosedEvent(
  listingId: BigInt,
  closer: Address,
  cancelled: boolean,
  auctionCreator: Address,
  winningBidder: Address
): AuctionClosed {
  let auctionClosedEvent = changetype<AuctionClosed>(newMockEvent())

  auctionClosedEvent.parameters = new Array()

  auctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  auctionClosedEvent.parameters.push(
    new ethereum.EventParam("closer", ethereum.Value.fromAddress(closer))
  )
  auctionClosedEvent.parameters.push(
    new ethereum.EventParam("cancelled", ethereum.Value.fromBoolean(cancelled))
  )
  auctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "auctionCreator",
      ethereum.Value.fromAddress(auctionCreator)
    )
  )
  auctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "winningBidder",
      ethereum.Value.fromAddress(winningBidder)
    )
  )

  return auctionClosedEvent
}

export function createInitializedEvent(version: i32): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return initializedEvent
}

export function createListingAddedEvent(
  listingId: BigInt,
  assetContract: Address,
  lister: Address,
  listing: ethereum.Tuple
): ListingAdded {
  let listingAddedEvent = changetype<ListingAdded>(newMockEvent())

  listingAddedEvent.parameters = new Array()

  listingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  listingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "assetContract",
      ethereum.Value.fromAddress(assetContract)
    )
  )
  listingAddedEvent.parameters.push(
    new ethereum.EventParam("lister", ethereum.Value.fromAddress(lister))
  )
  listingAddedEvent.parameters.push(
    new ethereum.EventParam("listing", ethereum.Value.fromTuple(listing))
  )

  return listingAddedEvent
}

export function createListingRemovedEvent(
  listingId: BigInt,
  listingCreator: Address
): ListingRemoved {
  let listingRemovedEvent = changetype<ListingRemoved>(newMockEvent())

  listingRemovedEvent.parameters = new Array()

  listingRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  listingRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "listingCreator",
      ethereum.Value.fromAddress(listingCreator)
    )
  )

  return listingRemovedEvent
}

export function createListingUpdatedEvent(
  listingId: BigInt,
  listingCreator: Address
): ListingUpdated {
  let listingUpdatedEvent = changetype<ListingUpdated>(newMockEvent())

  listingUpdatedEvent.parameters = new Array()

  listingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  listingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "listingCreator",
      ethereum.Value.fromAddress(listingCreator)
    )
  )

  return listingUpdatedEvent
}

export function createMSCommunityFeeInfoUpdatedEvent(
  MSCommunityFeeRecipient: Address,
  primaryMSCommunityFeeBps: BigInt
): MSCommunityFeeInfoUpdated {
  let msCommunityFeeInfoUpdatedEvent = changetype<MSCommunityFeeInfoUpdated>(
    newMockEvent()
  )

  msCommunityFeeInfoUpdatedEvent.parameters = new Array()

  msCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "MSCommunityFeeRecipient",
      ethereum.Value.fromAddress(MSCommunityFeeRecipient)
    )
  )
  msCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "primaryMSCommunityFeeBps",
      ethereum.Value.fromUnsignedBigInt(primaryMSCommunityFeeBps)
    )
  )

  return msCommunityFeeInfoUpdatedEvent
}

export function createNewAcceptOfferEvent(
  tokenId: BigInt,
  assetContract: Address,
  lister: Address,
  buyer: Address,
  quantityBought: BigInt,
  totalPricePaid: BigInt
): NewAcceptOffer {
  let newAcceptOfferEvent = changetype<NewAcceptOffer>(newMockEvent())

  newAcceptOfferEvent.parameters = new Array()

  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam(
      "assetContract",
      ethereum.Value.fromAddress(assetContract)
    )
  )
  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam("lister", ethereum.Value.fromAddress(lister))
  )
  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam(
      "quantityBought",
      ethereum.Value.fromUnsignedBigInt(quantityBought)
    )
  )
  newAcceptOfferEvent.parameters.push(
    new ethereum.EventParam(
      "totalPricePaid",
      ethereum.Value.fromUnsignedBigInt(totalPricePaid)
    )
  )

  return newAcceptOfferEvent
}

export function createNewBidOfferEvent(
  listingId: BigInt,
  offeror: Address,
  listingType: i32,
  quantityWanted: BigInt,
  totalOfferAmount: BigInt,
  currency: Address
): NewBidOffer {
  let newBidOfferEvent = changetype<NewBidOffer>(newMockEvent())

  newBidOfferEvent.parameters = new Array()

  newBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  newBidOfferEvent.parameters.push(
    new ethereum.EventParam("offeror", ethereum.Value.fromAddress(offeror))
  )
  newBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "listingType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(listingType))
    )
  )
  newBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "quantityWanted",
      ethereum.Value.fromUnsignedBigInt(quantityWanted)
    )
  )
  newBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "totalOfferAmount",
      ethereum.Value.fromUnsignedBigInt(totalOfferAmount)
    )
  )
  newBidOfferEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return newBidOfferEvent
}

export function createNewOfferEvent(
  nftContract: Address,
  tokenId: BigInt,
  offeror: Address,
  quantityWanted: BigInt,
  totalOfferAmount: BigInt,
  currency: Address
): NewOffer {
  let newOfferEvent = changetype<NewOffer>(newMockEvent())

  newOfferEvent.parameters = new Array()

  newOfferEvent.parameters.push(
    new ethereum.EventParam(
      "nftContract",
      ethereum.Value.fromAddress(nftContract)
    )
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam("offeror", ethereum.Value.fromAddress(offeror))
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam(
      "quantityWanted",
      ethereum.Value.fromUnsignedBigInt(quantityWanted)
    )
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam(
      "totalOfferAmount",
      ethereum.Value.fromUnsignedBigInt(totalOfferAmount)
    )
  )
  newOfferEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return newOfferEvent
}

export function createNewSaleEvent(
  listingId: BigInt,
  assetContract: Address,
  lister: Address,
  buyer: Address,
  quantityBought: BigInt,
  totalPricePaid: BigInt
): NewSale {
  let newSaleEvent = changetype<NewSale>(newMockEvent())

  newSaleEvent.parameters = new Array()

  newSaleEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  newSaleEvent.parameters.push(
    new ethereum.EventParam(
      "assetContract",
      ethereum.Value.fromAddress(assetContract)
    )
  )
  newSaleEvent.parameters.push(
    new ethereum.EventParam("lister", ethereum.Value.fromAddress(lister))
  )
  newSaleEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  newSaleEvent.parameters.push(
    new ethereum.EventParam(
      "quantityBought",
      ethereum.Value.fromUnsignedBigInt(quantityBought)
    )
  )
  newSaleEvent.parameters.push(
    new ethereum.EventParam(
      "totalPricePaid",
      ethereum.Value.fromUnsignedBigInt(totalPricePaid)
    )
  )

  return newSaleEvent
}

export function createPlatformFeeInfoUpdatedEvent(
  platformFeeRecipient: Address,
  platformFeeBps: BigInt
): PlatformFeeInfoUpdated {
  let platformFeeInfoUpdatedEvent = changetype<PlatformFeeInfoUpdated>(
    newMockEvent()
  )

  platformFeeInfoUpdatedEvent.parameters = new Array()

  platformFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeRecipient",
      ethereum.Value.fromAddress(platformFeeRecipient)
    )
  )
  platformFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeBps",
      ethereum.Value.fromUnsignedBigInt(platformFeeBps)
    )
  )

  return platformFeeInfoUpdatedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createprimaryMSCommunityFeeInfoUpdatedEvent(
  MSCommunityFeeRecipient: Address,
  primaryMSCommunityFeeBps: BigInt
): primaryMSCommunityFeeInfoUpdated {
  let primaryMsCommunityFeeInfoUpdatedEvent = changetype<
    primaryMSCommunityFeeInfoUpdated
  >(newMockEvent())

  primaryMsCommunityFeeInfoUpdatedEvent.parameters = new Array()

  primaryMsCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "MSCommunityFeeRecipient",
      ethereum.Value.fromAddress(MSCommunityFeeRecipient)
    )
  )
  primaryMsCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "primaryMSCommunityFeeBps",
      ethereum.Value.fromUnsignedBigInt(primaryMSCommunityFeeBps)
    )
  )

  return primaryMsCommunityFeeInfoUpdatedEvent
}
