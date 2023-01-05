import { ethers, upgrades } from "hardhat";
import { expect } from "chai";


describe("MSDrop721V2", function () {
  it("Should return version 1", async function test() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const defaultAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
    const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
    const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
    const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    const wEth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
    const msDrop721 = await upgrades.deployProxy(
      MSDrop721,
      [
        defaultAdmin,
        "MS MEMBERSHIP",
        "MSMEMBERSHIP",
        "ipfs://",
        [forwarder],
        defaultAdmin,
        defaultAdmin,
        1000,
        1000,
        MSFee,
        MSCommunity,
        500,
      ],
      {
        initializer: "initialize",
        unsafeAllow: ["delegatecall", "constructor"],
      }
    );

    expect(await msDrop721.name()).to.equal("MS MEMBERSHIP");

    const lazyToken = await msDrop721.lazyMint(10, "ipfs://");

    let lazy = await lazyToken.wait();
    console.log("lazyMint", lazy.events);
    

    const token = await msDrop721.adminClaim(defaultAdmin, 1, 1);

    await token.wait();

    const token1 = await msDrop721.hasBeenMinted(1);
    console.log(token1);

    const adminToken = await msDrop721.adminClaim(defaultAdmin, 3, 3);

    let txAdminClaim = await adminToken.wait();
    console.log("adminClaim", txAdminClaim.events);
    

    const token2 = await msDrop721.hasBeenMinted(2);
    console.log(token2);
    const token3 = await msDrop721.hasBeenMinted(3);
    console.log(token3);

    let claimCondition = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("0.1"),
      currency,
    ];
    const setClaimCondition = await msDrop721.setClaimConditions(
      [claimCondition],
      false
    );

    let tx = await setClaimCondition.wait();
    console.log("conditions", tx.events[0].args);

    const claim = await msDrop721.claim(defaultAdmin, [6, 1, ethers.utils.parseEther("0.1")], currency, ["0x0000000000000000000000000000000000000000000000000000000000000000"], 0, {value: ethers.utils.parseEther("0.1")})
    let txClaim = await claim.wait()
    let events = await txClaim.events
    console.log(events);
    const token21 = await msDrop721.hasBeenMinted(2)
    console.log(token21);

    const claim8 = await msDrop721.claim(defaultAdmin, [8, 1, ethers.utils.parseEther("0.1")], currency, ["0x0000000000000000000000000000000000000000000000000000000000000000"], 0, {value: ethers.utils.parseEther("0.1")})
    
    let txClaim8 = await claim8.wait()
    let events8 = await txClaim8.events

    console.log(events8);

    const token8 = await msDrop721.hasBeenMinted(8)
    console.log(token8);

    const claim9 = await msDrop721.claim(defaultAdmin, [9, 1, ethers.utils.parseEther("0.1")], currency, ["0x0000000000000000000000000000000000000000000000000000000000000000"], 0, {value: ethers.utils.parseEther("0.1")})
    
    let txClaim9 = await claim9.wait()
    let events9 = await txClaim9.events

    console.log(events9);

    const claim2 = await msDrop721.claim(defaultAdmin, [2, 1, ethers.utils.parseEther("0.1")], currency, ["0x0000000000000000000000000000000000000000000000000000000000000000"], 0, {value: ethers.utils.parseEther("0.1")})
    
    let txClaim2 = await claim2.wait()
    let events2 = await txClaim2.events

    console.log(events2);
    
    const adminToken11 = await msDrop721.adminClaim(defaultAdmin, 1, 10);
    
    // const claim3 = await msDrop721.claim(defaultAdmin, [0, 1, ethers.utils.parseEther("0.1")], currency, ["0x0000000000000000000000000000000000000000000000000000000000000000"], 0, {value: ethers.utils.parseEther("0.1")})

    const baseUriIndice = await msDrop721.baseURIIndices(0)
    console.log(baseUriIndice);

    const tokenUri8 = await msDrop721.tokenURI(8)
    console.log(tokenUri8);
    
    const newUri = await msDrop721.setTokenURI(baseUriIndice, "ipfs://newURI/")
    await newUri.wait()
    
    const tokenURI7 = await msDrop721.tokenURI(7)
    console.log(tokenURI7);
    
  });
});
