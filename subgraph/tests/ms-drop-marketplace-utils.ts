import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  DropAuctionBuffersUpdated,
  DropAuctionClosed,
  DropListingAdded,
  DropListingUpdated,
  MSDropMarketplaceInitialized,
  MSDropMarketplaceMSCommunityFeeInfoUpdated,
  NewDropBidOffer,
  MSDropMarketplacePlatformFeeInfoUpdated,
  MSDropMarketplaceRoleAdminChanged,
  MSDropMarketplaceRoleGranted,
  MSDropMarketplaceRoleRevoked
} from "../generated/MSDropMarketplace/MSDropMarketplace"

export function createDropAuctionBuffersUpdatedEvent(
  timeBuffer: BigInt,
  bidBufferBps: BigInt
): DropAuctionBuffersUpdated {
  let dropAuctionBuffersUpdatedEvent = changetype<DropAuctionBuffersUpdated>(
    newMockEvent()
  )

  dropAuctionBuffersUpdatedEvent.parameters = new Array()

  dropAuctionBuffersUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "timeBuffer",
      ethereum.Value.fromUnsignedBigInt(timeBuffer)
    )
  )
  dropAuctionBuffersUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "bidBufferBps",
      ethereum.Value.fromUnsignedBigInt(bidBufferBps)
    )
  )

  return dropAuctionBuffersUpdatedEvent
}

export function createDropAuctionClosedEvent(
  listingId: BigInt,
  closer: Address,
  cancelled: boolean,
  auctionCreator: Address,
  winningBidder: Address
): DropAuctionClosed {
  let dropAuctionClosedEvent = changetype<DropAuctionClosed>(newMockEvent())

  dropAuctionClosedEvent.parameters = new Array()

  dropAuctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  dropAuctionClosedEvent.parameters.push(
    new ethereum.EventParam("closer", ethereum.Value.fromAddress(closer))
  )
  dropAuctionClosedEvent.parameters.push(
    new ethereum.EventParam("cancelled", ethereum.Value.fromBoolean(cancelled))
  )
  dropAuctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "auctionCreator",
      ethereum.Value.fromAddress(auctionCreator)
    )
  )
  dropAuctionClosedEvent.parameters.push(
    new ethereum.EventParam(
      "winningBidder",
      ethereum.Value.fromAddress(winningBidder)
    )
  )

  return dropAuctionClosedEvent
}

export function createDropListingAddedEvent(
  listingId: BigInt,
  assetContract: Address,
  lister: Address,
  listing: ethereum.Tuple
): DropListingAdded {
  let dropListingAddedEvent = changetype<DropListingAdded>(newMockEvent())

  dropListingAddedEvent.parameters = new Array()

  dropListingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  dropListingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "assetContract",
      ethereum.Value.fromAddress(assetContract)
    )
  )
  dropListingAddedEvent.parameters.push(
    new ethereum.EventParam("lister", ethereum.Value.fromAddress(lister))
  )
  dropListingAddedEvent.parameters.push(
    new ethereum.EventParam("listing", ethereum.Value.fromTuple(listing))
  )

  return dropListingAddedEvent
}

export function createDropListingUpdatedEvent(
  listingId: BigInt,
  listingCreator: Address
): DropListingUpdated {
  let dropListingUpdatedEvent = changetype<DropListingUpdated>(newMockEvent())

  dropListingUpdatedEvent.parameters = new Array()

  dropListingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  dropListingUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "listingCreator",
      ethereum.Value.fromAddress(listingCreator)
    )
  )

  return dropListingUpdatedEvent
}

export function createMSDropMarketplaceInitializedEvent(
  version: i32
): MSDropMarketplaceInitialized {
  let msDropMarketplaceInitializedEvent = changetype<
    MSDropMarketplaceInitialized
  >(newMockEvent())

  msDropMarketplaceInitializedEvent.parameters = new Array()

  msDropMarketplaceInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(version))
    )
  )

  return msDropMarketplaceInitializedEvent
}

export function createMSDropMarketplaceMSCommunityFeeInfoUpdatedEvent(
  MSCommunityFeeRecipient: Address,
  primaryMSCommunityFeeBps: BigInt
): MSDropMarketplaceMSCommunityFeeInfoUpdated {
  let msDropMarketplaceMsCommunityFeeInfoUpdatedEvent = changetype<
    MSDropMarketplaceMSCommunityFeeInfoUpdated
  >(newMockEvent())

  msDropMarketplaceMsCommunityFeeInfoUpdatedEvent.parameters = new Array()

  msDropMarketplaceMsCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "MSCommunityFeeRecipient",
      ethereum.Value.fromAddress(MSCommunityFeeRecipient)
    )
  )
  msDropMarketplaceMsCommunityFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "primaryMSCommunityFeeBps",
      ethereum.Value.fromUnsignedBigInt(primaryMSCommunityFeeBps)
    )
  )

  return msDropMarketplaceMsCommunityFeeInfoUpdatedEvent
}

export function createNewDropBidOfferEvent(
  listingId: BigInt,
  offeror: Address,
  listingType: i32,
  quantityWanted: BigInt,
  totalOfferAmount: BigInt,
  currency: Address
): NewDropBidOffer {
  let newDropBidOfferEvent = changetype<NewDropBidOffer>(newMockEvent())

  newDropBidOfferEvent.parameters = new Array()

  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "listingId",
      ethereum.Value.fromUnsignedBigInt(listingId)
    )
  )
  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam("offeror", ethereum.Value.fromAddress(offeror))
  )
  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "listingType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(listingType))
    )
  )
  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "quantityWanted",
      ethereum.Value.fromUnsignedBigInt(quantityWanted)
    )
  )
  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam(
      "totalOfferAmount",
      ethereum.Value.fromUnsignedBigInt(totalOfferAmount)
    )
  )
  newDropBidOfferEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )

  return newDropBidOfferEvent
}

export function createMSDropMarketplacePlatformFeeInfoUpdatedEvent(
  platformFeeRecipient: Address
): MSDropMarketplacePlatformFeeInfoUpdated {
  let msDropMarketplacePlatformFeeInfoUpdatedEvent = changetype<
    MSDropMarketplacePlatformFeeInfoUpdated
  >(newMockEvent())

  msDropMarketplacePlatformFeeInfoUpdatedEvent.parameters = new Array()

  msDropMarketplacePlatformFeeInfoUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "platformFeeRecipient",
      ethereum.Value.fromAddress(platformFeeRecipient)
    )
  )

  return msDropMarketplacePlatformFeeInfoUpdatedEvent
}

export function createMSDropMarketplaceRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): MSDropMarketplaceRoleAdminChanged {
  let msDropMarketplaceRoleAdminChangedEvent = changetype<
    MSDropMarketplaceRoleAdminChanged
  >(newMockEvent())

  msDropMarketplaceRoleAdminChangedEvent.parameters = new Array()

  msDropMarketplaceRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  msDropMarketplaceRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  msDropMarketplaceRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return msDropMarketplaceRoleAdminChangedEvent
}

export function createMSDropMarketplaceRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): MSDropMarketplaceRoleGranted {
  let msDropMarketplaceRoleGrantedEvent = changetype<
    MSDropMarketplaceRoleGranted
  >(newMockEvent())

  msDropMarketplaceRoleGrantedEvent.parameters = new Array()

  msDropMarketplaceRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  msDropMarketplaceRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  msDropMarketplaceRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return msDropMarketplaceRoleGrantedEvent
}

export function createMSDropMarketplaceRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): MSDropMarketplaceRoleRevoked {
  let msDropMarketplaceRoleRevokedEvent = changetype<
    MSDropMarketplaceRoleRevoked
  >(newMockEvent())

  msDropMarketplaceRoleRevokedEvent.parameters = new Array()

  msDropMarketplaceRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  msDropMarketplaceRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  msDropMarketplaceRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return msDropMarketplaceRoleRevokedEvent
}
