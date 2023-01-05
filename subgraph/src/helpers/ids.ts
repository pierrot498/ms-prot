import { Address, bigInt, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NftMarketAuction, NftMarketBuyNow } from "../../generated/schema";
import { loadAuction, loadDirect, loadOrCreateNftMarketContract } from "../ms-marketplace";

export function getLogId(event: ethereum.Event): string {
  return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
}

export function getEventId(event: ethereum.Event, eventType: string): string {
  return getLogId(event) + "-" + eventType;
}

export function getPreviousEventId(
  event: ethereum.Event,
  eventType: string,
  logIndex: BigInt
): string {
  return (
    event.transaction.hash.toHex() + "-" + logIndex.toString() + "-" + eventType
  );
}

//export function getTokenId(address: Address, listingId: BigInt): BigInt {
  //let nftMarketContract = loadOrCreateNftMarkerContract(event.address)
  // let arg = event.address.toHex() + "-" + listingId.toString();
  // let auction = NftMarketAuction.load(arg);
  // let direct = NftMarketBuyNow.load(arg);
  
  // let direct = loadDirect(address, listingId)
  // let tokenId = direct?.tokenId;

  
  // return tokenId as BigInt;
//}
