import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json"

async function main() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(contracts.localhost.dropERC721Contract.address);

  const adminToken = await msDrop721.adminClaim(owner.address, 1, 10);
  let adminClaim = await adminToken.wait();
  console.log("AdminClaim", adminClaim.events);

  const token1 = await msDrop721.hasBeenMinted(1);
  console.log(token1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
