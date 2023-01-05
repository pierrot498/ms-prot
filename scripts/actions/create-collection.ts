import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";
import fs from "fs";

async function main() {
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = MSDrop721.attach(
    contracts.goerli.implDropERC721.address
  );

  const Factory = await ethers.getContractFactory("MSFactory");
  const factory = Factory.attach(networks.goerli.MSFactory.address);

  const contractType = await msDrop721.contractType();
  console.log(contractType);

  const firstDrop = await factory.deployProxy(
    contractType,
    "0x75cf41700000000000000000000000004b67f00b216066fd07f15328f3751a333fe70f91000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee8870000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee88700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003e80000000000000000000000008e7fcbe0449b0689b1d1b5107554a2ba35f7c0d30000000000000000000000008dbb949d0b6f713afc08c353caef4761e38c7c5800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000000000000000000000000000000000000000000d4d53204d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4d534d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007697066733a2f2f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000e041608922d06a4f26c0d4c27d8bcd01daf1f792"
  );
  let tx = await firstDrop.wait();
  const events = tx.events?.filter((x) => x.event === "ProxyDeployed");
  const { proxy } = events[0]?.args;
  console.log(proxy);
  const data = JSON.stringify(
    Object.assign(contracts, {
      goerli: {
        ...contracts.goerli,
        dropERC721Contract: { address: proxy },
      },
    })
  );
  fs.writeFile("./utils/contracts.json", data, "utf8", function(err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
