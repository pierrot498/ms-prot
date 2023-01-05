import { Address } from "@graphprotocol/graph-ts";
import { Creator } from "../../generated/schema";
import { loadOrCreateAccount } from "./accounts";

export function loadOrCreateCreator(address: Address): Creator {
  let account = loadOrCreateAccount(address);
  let creator = Creator.load(account.id);
  if (!creator) {
    creator = new Creator(account.id);
    creator.account = account.id;
    creator.save();
  }
  return creator as Creator;
}
