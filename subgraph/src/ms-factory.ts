import { log, Address } from "@graphprotocol/graph-ts";
import { ProxyDeployed as ProxyDeployedEvent } from "../generated/MSFactory/MSFactory";
import { CollectionContract, NftContract } from "../generated/schema";
import { MSDropERC721 as MSDropERC721Template } from "../generated/templates";
import { MSDropERC721 as MSDrop721Abi } from "../generated/templates/MSDrop721/MSDropERC721";
import { ZERO_BIG_INT } from "./helpers/constants";
import { loadOrCreateCreator } from "./helpers/creators";

export function loadOrCreateNftContract(address: Address): NftContract {
  let nftContract = NftContract.load(address.toHex());
  if (!nftContract) {
    nftContract = new NftContract(address.toHex());
    let contract = MSDrop721Abi.bind(address);
    let nameResult = contract.try_name();
    if (!nameResult.reverted) {
      nftContract.name = nameResult.value;
    }
    let symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      nftContract.symbol = symbolResult.value;
    }
    let typeResult = contract.try_contractType();
    if (!typeResult.reverted) {
      nftContract.type = typeResult.value.toString();
    }
    nftContract.baseURI = "ipfs://";
    nftContract.maxTokenID = ZERO_BIG_INT;
    nftContract.save();
  }
  return nftContract as NftContract;
}

export function handleProxyDeployed(event: ProxyDeployedEvent): void {
  MSDropERC721Template.create(event.params.proxy);
  let nftContract = loadOrCreateNftContract(event.params.proxy);
  let collectionEntity = CollectionContract.load(event.params.proxy.toHex());
  if (collectionEntity) {
    collectionEntity.dateSelfDestructed = null;
  } else {
    collectionEntity = new CollectionContract(event.params.proxy.toHex());
  }
  collectionEntity.nftContract = nftContract.id;
  collectionEntity.creator = loadOrCreateCreator(event.params.deployer).id;
  collectionEntity.version =
    event.address.toHex() + "-" + event.params.implementation.toHex();
  collectionEntity.dateCreated = event.block.timestamp;
  collectionEntity.save();
}
