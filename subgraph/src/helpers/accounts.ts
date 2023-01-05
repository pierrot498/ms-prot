import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";


export function loadOrCreateAccount(address: Address): Account {
    let addressHex = address.toHex();
    let account = Account.load(addressHex);
    if(!account) {
        account = new Account(addressHex);
        account.save()
    }
    return account as Account;
}