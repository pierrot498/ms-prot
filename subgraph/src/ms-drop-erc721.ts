import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  ipfs,
  json,
  JSONValue,
  log,
  store,
} from "@graphprotocol/graph-ts";
import {
  MSDropERC721 as MSDropERC721Abi,
  TokensLazyMinted as TokensLazyMintedEvent,
  Transfer as TransferEvent,
  ClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
  TokensAdminClaimed as TokensAdminClaimedEvent,
  TokensClaimed as TokensClaimedEvent,
  ApprovalForAll as ApprovalForAllEvent,
} from "../generated/templates/MSDrop721/MSDropERC721";
import {
  Nft,
  FixedPriceSale,
  FixedPriceSaleMint,
  NftAccountApproval,
  NftTransfer,
} from "../generated/schema";
import { loadOrCreateAccount } from "./helpers/accounts";
import {
  BASE_IPFS,
  ZERO_ADDRESS_STRING,
  ZERO_BIG_INT,
  ZERO_BYTES_32_STRING,
} from "./helpers/constants";
import { loadOrCreateCreator } from "./helpers/creators";
import { toETH } from "./helpers/conversions";
import { loadOrCreateNftContract } from "./ms-factory";
import { recordNftEvent } from "./helpers/events";
import { getLogId } from "./helpers/ids";

function getNftId(address: Address, id: BigInt): string {
  return address.toHex() + "-" + id.toString();
}

export function loadOrCreateNFT(
  address: Address,
  id: BigInt,
  event: ethereum.Event
): Nft {
  let nftId = getNftId(address, id);
  let nft = Nft.load(nftId);
  if (!nft) {
    nft = new Nft(nftId);
    nft.nftContract = loadOrCreateNftContract(address).id;
    nft.tokenId = id;
    nft.dateMinted = event.block.timestamp;
    let contract = MSDropERC721Abi.bind(address);
    let uriResult = contract.try_tokenURI(id);
    if (!uriResult.reverted) {
      nft.tokenIPFSPath = uriResult.value;
    }
    nft.save();
  }
  return nft as Nft;
}

export function handleTransfer(event: TransferEvent): void {
  let nft = loadOrCreateNFT(event.address, event.params.tokenId, event);
  if (event.params.from.toHex() == ZERO_ADDRESS_STRING) {
    //Mint
    nft.dateMinted = event.block.timestamp;
    nft.owner = loadOrCreateAccount(event.params.to).id;
    nft.ownedOrListedBy = nft.owner;
    nft.isFirstSale = false;
    nft.save();

    let creator = loadOrCreateAccount(
      Address.fromString(nft.creator as string)
    );
    recordNftEvent(
      event,
      nft as Nft,
      "Minted",
      creator,
      null,
      null,
      null,
      creator
    );
  } else {
    // Transfer or Burn
    nft = loadOrCreateNFT(event.address, event.params.tokenId, event);
    nft.owner = loadOrCreateAccount(event.params.to).id;
    nft.save();

    if (event.params.to.toHex() == ZERO_ADDRESS_STRING) {
      // Burn
      recordNftEvent(
        event,
        nft,
        "Burned",
        loadOrCreateAccount(event.params.from)
      );
    } else {
      // Transfer
      recordNftEvent(
        event,
        nft,
        "Transferred",
        loadOrCreateAccount(event.params.from),
        null,
        null,
        null,
        loadOrCreateAccount(event.params.to)
      );
    }
  }

  let transfer = new NftTransfer(getLogId(event));
  transfer.nft = nft.id;
  transfer.from = loadOrCreateAccount(event.params.from).id;
  transfer.to = loadOrCreateAccount(event.params.to).id;
  transfer.dateTransferred = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
}

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {
  let nftContract = loadOrCreateNftContract(event.address);
  if (nftContract.maxTokenID == ZERO_BIG_INT) {
    nftContract.maxTokenID = event.params.endTokenId;
  } else {
    nftContract.maxTokenID = nftContract.maxTokenID!.plus(
      event.params.endTokenId
    );
  }
  nftContract.artist = loadOrCreateCreator(event.params.artist).id;
  nftContract.save();

  let baseURI = "";
  let hash = event.params.baseURI;
  if (hash.includes("ipfs")) {
    let path = hash.split("ipfs://").join("");
    baseURI = BASE_IPFS + path;
  }

  for (
    let i = event.params.startTokenId.toI32();
    i <= event.params.endTokenId.toI32();
    i++
  ) {
    log.warning("loop i {} and endTokenId {}", [
      i.toString(),
      event.params.endTokenId.toI32().toString(),
    ]);
    let nftId = getNftId(event.address, BigInt.fromI32(i));
    let nft = new Nft(nftId);
    nft.tokenId = BigInt.fromI32(i);
    nft.nftContract = nftContract.id;
    nft.creator = loadOrCreateCreator(event.params.artist).id;
    nft.amount = BigInt.fromI32(1);
    nft.isFirstSale = true;
    nft.contractType = nftContract.type;
    nft.tokenBaseUri = baseURI;
    nft.tokenIPFSPath = baseURI + i.toString();
    log.warning("URI = {}", [nft.tokenIPFSPath]);

    nft.save();
  }
}

export function handleClaimConditionsUpdated(
  event: ClaimConditionsUpdatedEvent
): void {
  let nftContract = loadOrCreateNftContract(event.address);
  let fixedPriceSale = new FixedPriceSale(event.address.toHex());
  fixedPriceSale.nftContract = loadOrCreateNftContract(event.address).id;
  fixedPriceSale.maxDropSupply =
    event.params.claimConditions[0].maxClaimableSupply;
  fixedPriceSale.dateCreated = event.params.claimConditions[0].startTimestamp;
  fixedPriceSale.mintCount = BigInt.zero();
  fixedPriceSale.amountInETH = BigDecimal.zero();
  fixedPriceSale.seller = nftContract.artist;
  fixedPriceSale.limitPerAccount =
    event.params.claimConditions[0].quantityLimitPerTransaction;
  fixedPriceSale.unitPriceInETH = event.params.claimConditions[0].pricePerToken.toBigDecimal();
  if (
    event.params.claimConditions[0].merkleRoot.toHexString() !=
    ZERO_BYTES_32_STRING
  ) {
    fixedPriceSale.whitelistSale = true;
  } else {
    fixedPriceSale.whitelistSale = false;
  }
  fixedPriceSale.transactionHashCreated = event.transaction.hash;
  fixedPriceSale.save();
}

export function handleTokensAdminClaimed(event: TokensAdminClaimedEvent): void {
  let startId =
    event.params.lastTokenIdClaimed.toI32() -
    event.params.quantityClaimed.toI32();
  for (let i = 0; i < event.params.quantityClaimed.toI32(); i++) {
    let nft = loadOrCreateNFT(event.address, BigInt.fromI32(startId), event);
    nft.amount = BigInt.fromI32(1);
    nft.owner = loadOrCreateAccount(event.params.receiver).id;
    nft.save();
    startId++;
  }
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {
  let fixedPriceSale = FixedPriceSale.load(event.address.toHex());
  if (fixedPriceSale) {
    let fixedPriceSaleMint = FixedPriceSaleMint.load(
      event.transaction.hash.toHex()
    );
    if (fixedPriceSaleMint) {
      fixedPriceSaleMint.fixedPriceSale = fixedPriceSale.id;
      fixedPriceSaleMint.buyer = loadOrCreateAccount(event.params.claimer).id;
      fixedPriceSaleMint.count = event.params.quantityClaimed;
    } else {
      fixedPriceSaleMint = new FixedPriceSaleMint(
        event.transaction.hash.toHex()
      );
      fixedPriceSaleMint.fixedPriceSale = fixedPriceSale.id;
      fixedPriceSaleMint.buyer = loadOrCreateAccount(event.params.claimer).id;
      fixedPriceSaleMint.count = event.params.quantityClaimed;
    }
    //update FixedSalePrice
    fixedPriceSale.mintCount = fixedPriceSale.mintCount.plus(
      event.params.quantityClaimed
    );
    fixedPriceSaleMint.save();
    fixedPriceSale.save();
  }
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let id =
    event.address.toHex() +
    "-" +
    event.params.owner.toHex() +
    "-" +
    event.params.operator.toHex();
  if (event.params.approved) {
    let nftAccountApproval = new NftAccountApproval(id);
    let nftContract = loadOrCreateNftContract(event.address);
    nftAccountApproval.nftContract = nftContract.id;
    nftAccountApproval.owner = loadOrCreateAccount(event.params.owner).id;
    nftAccountApproval.spender = loadOrCreateAccount(event.params.operator).id;
    nftAccountApproval.save();
  } else {
    store.remove("NftAccountApproval", id);
  }
}
