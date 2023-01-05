import { ethers, upgrades } from "hardhat";
import hre from "hardhat";
import networks from "../../subgraph/networks.json";
import contracts from "../../utils/contracts.json";
import fs from "fs";

async function main() {
  const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
  const msDrop721 = await MSDrop721.deploy();
  await msDrop721.deployed();
  console.log(msDrop721.address);
  const data = JSON.stringify({
    localhost: {
      implDropERC721: { address: msDrop721.address },
    },
  });
  fs.writeFile("./utils/contracts-localhost.json", data, "utf8", function(err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
  });

  const Factory = await ethers.getContractFactory("MSFactory");
  const factory = Factory.attach(networks.localhost.MSFactory.address);

  const addDrop721Implemantation = await factory.addImplementation(
    msDrop721.address
  );
  await addDrop721Implemantation.wait();

  const contractType = await msDrop721.contractType();
  console.log(contractType);

  const checkImpl = await factory.getImplementation(contractType, 1);
  console.log(checkImpl);

  //return { contractName: "MSDropERC721", address: msDrop721.address };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  //.then((result) => hre.run("graph", result))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
