import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";

async function main() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(
    contracts.goerli.dropERC721Contract.address
  );
  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  let claimCondition = [
    {
      startTimestamp: Math.floor(Date.now() / 1000),
      maxClaimableSupply: 30,
      supplyClaimed: 0,
      quantityLimitPerTransaction: 1,
      waitTimeInSecondsBetweenClaims: 1,
      merkleRoot:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      pricePerToken: ethers.utils.parseEther("0.1"),
      currency,
    },
  ];

  const setClaimConditions = await msDrop721.setClaimConditions(
    claimCondition,
    false
  );
  let tx = await setClaimConditions.wait();
  console.log("ClaimConditions", tx.events[0].args);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
