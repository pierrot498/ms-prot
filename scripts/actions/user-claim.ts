import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";

async function main() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(
    contracts.goerli.dropERC721Contract.address
  );
  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  const claim2 = await msDrop721.connect(addr2).claim(
    addr2.address,
    { tokenId: 1, quantity: 1, pricePerToken: ethers.utils.parseEther("0.1") },
    currency,
    ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    0,
    { value: ethers.utils.parseEther("0.1") }
  );
  let tx = await claim2.wait();
  console.log("ClaimConditions", tx.events);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
