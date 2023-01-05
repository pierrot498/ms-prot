import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts-localhost.json"


async function main() {
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(contracts.localhost.dropERC721Contract.address);

  const lazyTokens = await msDrop721.lazyMint(30, "ipfs://QmReyqy4jZvRbsSAP6BkSFonHK16UPVZRivjDV7pV61nqi/");
  let lazy = await lazyTokens.wait();
  console.log("lazyMint", lazy.events);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
