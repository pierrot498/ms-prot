import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

async function main() {
  const forwarder = "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693";
  const gForwarder = "0xE041608922d06a4F26C0d4c27d8bCD01daf1f792";

  const MSRegistry = await ethers.getContractFactory("MSRegistry");
  console.log("Deploying MSRegistry...");
  const msRegistry = await MSRegistry.deploy(gForwarder);
  await msRegistry.deployed();
  console.log(`MSRegistry ${msRegistry.address}`);

  const Factory = await ethers.getContractFactory("MSFactory");
  console.log("Deploying MSFactory...");
  const factory = await Factory.deploy(gForwarder, msRegistry.address);
  await factory.deployed();
  console.log(`MSFactory ${factory.address}`);

  const operatorRole =
    "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929";

  const addOperatorRole = await msRegistry.grantRole(
    operatorRole,
    factory.address
  );
  await addOperatorRole.wait();

  const checkFactoryRole = await msRegistry.getRoleMember(operatorRole, 0)
  console.log(checkFactoryRole);
  
  return { contractName: "MSFactory", address: factory.address };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result) => hre.run("graph", result))
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
