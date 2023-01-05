import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

describe("Deploy", function () {
    it("Should return version 2", async function test() {
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      const Forwarder = await ethers.getContractFactory("Forwarder");
      const forwarder = await Forwarder.deploy();
      console.log(forwarder.address);
  
      const MSRegistry = await ethers.getContractFactory("MSRegistry");
      const registry = await MSRegistry.deploy(forwarder.address);
      console.log(registry.address);
  
      const Factory = await ethers.getContractFactory("MSFactory");
      const factory = await Factory.deploy(forwarder.address, registry.address);
      console.log(factory.address);
  
      const operatorRole =
        "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929";
  
      const addOperatorRole = await registry.grantRole(
        operatorRole,
        factory.address
      );
      await addOperatorRole.wait();
  
      expect(await registry.getRoleMember(operatorRole, 0)).to.equal(
        factory.address
      );
  
      const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
      const msDrop721 = await MSDrop721.deploy();
      console.log(msDrop721.address);
  
      const addDrop721Implemantation = await factory.addImplementation(
        msDrop721.address
      );
      await addDrop721Implemantation.wait();
  
      const defaultAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
      const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
      const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
      const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
      const MSMktV3 = await ethers.getContractFactory("MSMarketplace");
      const msMktV3 = await upgrades.deployProxy(
        MSMktV3,
        [
          defaultAdmin,
          "ipfs://",
          [forwarder.address],
          MSFee,
          300,
          goerliWETH,
          MSCommunity,
          200,
        ],
        { initializer: "initialize", unsafeAllow: ["delegatecall"] }
      );
  
      const MSDropMkt = await ethers.getContractFactory("MSDropMarketplace");
      const msDropMkt = await upgrades.deployProxy(
        MSDropMkt,
        [
          defaultAdmin,
          "ipfs://",
          [forwarder.address],
          MSFee,
          goerliWETH,
          MSCommunity,
          500,
        ],
        { initializer: "initialize", unsafeAllow: ["delegatecall"] }
      );
  
      const msDrop721Type = await msDrop721.contractType();
  
      const firstDrop = await factory.deployProxy(
        msDrop721Type,
        "0x75cf41700000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee887000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee8870000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee88700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003e80000000000000000000000008e7fcbe0449b0689b1d1b5107554a2ba35f7c0d30000000000000000000000008dbb949d0b6f713afc08c353caef4761e38c7c5800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000000000000000000000000000000000000000000d4d53204d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4d534d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007697066733a2f2f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000056a0113ab3b7b67c655e4a0b679a4577e7f045c0"
      );
      let tx = await firstDrop.wait();
      const events = tx.events?.filter((x) => x.event === "ProxyDeployed");
      const { proxy } = events[0]?.args;
      console.log(proxy);
    });
  });
  
// describe("Deploy", function () {
//     it("Should return version 2", async function test() {
//       const [owner, addr1, addr2] = await ethers.getSigners();
  
//       const Forwarder = await ethers.getContractFactory("Forwarder");
//       const forwarder = await Forwarder.deploy();
//       console.log(forwarder.address);
  
//       const MSRegistry = await ethers.getContractFactory("MSRegistry");
//       const registry = await MSRegistry.deploy(forwarder.address);
//       console.log(registry.address);
  
//       const Factory = await ethers.getContractFactory("MSFactory");
//       const factory = await Factory.deploy(forwarder.address, registry.address);
//       console.log(factory.address);
  
//       const operatorRole =
//         "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929";
  
//       const addOperatorRole = await registry.grantRole(
//         operatorRole,
//         factory.address
//       );
//       await addOperatorRole.wait();
  
//       expect(await registry.getRoleMember(operatorRole, 0)).to.equal(
//         factory.address
//       );
  
//       const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
//       const msDrop721 = await MSDrop721.deploy();
//       console.log(msDrop721.address);
  
//       const addDrop721Implemantation = await factory.addImplementation(
//         msDrop721.address
//       );
//       await addDrop721Implemantation.wait();
  
//       const defaultAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
//       const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
//       const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
//       const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
//       const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  
//       const MSMktV3 = await ethers.getContractFactory("MSMarketplace");
//       const msMktV3 = await upgrades.deployProxy(
//         MSMktV3,
//         [
//           defaultAdmin,
//           "ipfs://",
//           [forwarder.address],
//           MSFee,
//           300,
//           goerliWETH,
//           MSCommunity,
//           200,
//         ],
//         { initializer: "initialize", unsafeAllow: ["delegatecall"] }
//       );
  
//       const MSDropMkt = await ethers.getContractFactory("MSDropMarketplace");
//       const msDropMkt = await upgrades.deployProxy(
//         MSDropMkt,
//         [
//           defaultAdmin,
//           "ipfs://",
//           [forwarder.address],
//           MSFee,
//           goerliWETH,
//           MSCommunity,
//           500,
//         ],
//         { initializer: "initialize", unsafeAllow: ["delegatecall"] }
//       );
  
//       const msDrop721Type = await msDrop721.contractType();
  
//       const firstDrop = await factory.deployProxy(
//         msDrop721Type,
//         "0x75cf41700000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee887000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002400000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee8870000000000000000000000001c34c2eb08ee832af36cc56e66a3eeeb240ee88700000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000003e80000000000000000000000008e7fcbe0449b0689b1d1b5107554a2ba35f7c0d30000000000000000000000008dbb949d0b6f713afc08c353caef4761e38c7c5800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000000000000000000000000000000000000000000d4d53204d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c4d534d454d4245525348495000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007697066733a2f2f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000056a0113ab3b7b67c655e4a0b679a4577e7f045c0"
//       );
//       let tx = await firstDrop.wait();
//       const events = tx.events?.filter((x) => x.event === "ProxyDeployed");
//       const { proxy } = events[0]?.args;
//       console.log(proxy);
//     });
//   });