import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import hre from "hardhat";
import WETHAbi from "./WETH.json";

describe("MSMkt", function() {
  it("Should return version 2", async function test() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const wethHolder = "0xf835c48f9cb5939BDcc1d723aF576352D922F3bD";

    const defaultAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
    const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
    const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
    const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    const wEth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    const wethSigner = await ethers.getImpersonatedSigner(wethHolder);
    const wethContract = new ethers.Contract(wEth, WETHAbi, wethSigner);

    const MSMktV3 = await ethers.getContractFactory("MSMarketplace");
    const msMkt3_1 = await upgrades.deployProxy(
      MSMktV3,
      [
        defaultAdmin,
        "ipfs://",
        [forwarder],
        MSFee,
        300,
        wEth,
        MSCommunity,
        200,
      ],
      { initializer: "initialize", unsafeAllow: ["delegatecall"] }
    );

    expect(await msMkt3_1.contractVersion()).to.equal(1);

    const setFee = await msMkt3_1.setPlatformFeeInfo(forwarder, 100);

    await setFee.wait();

    const address = msMkt3_1.address;

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

    const lazyToken = await msDrop721.lazyMint(3, "ipfs://");

    await lazyToken.wait();

    const token = await msDrop721.adminClaim(defaultAdmin, 3, 1);

    await token.wait();

    const approve = await msDrop721.setApprovalForAll(address, true);

    await approve.wait();

    const listingInfo = [
      msDrop721.address,
      1,
      0,
      0,
      1,
      currency,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("100"),
      1,
    ];

    const auction = await msMkt3_1.createListing(listingInfo);

    await auction.wait();

    const listing = await msMkt3_1.listings(0);
    console.log(listing);

    const updateListing = await msMkt3_1.updateListing(0, 1, ethers.utils.parseEther("1.5"), ethers.utils.parseEther("150"), currency, 0, 0)
    const updatedListingTx = await updateListing.wait()
    console.log("update log", updatedListingTx.events[0].args[1]);

    const listingUpdated = await msMkt3_1.listings(0);
    console.log(listingUpdated);
    
    const bid = await msMkt3_1
      .connect(addr1)
      .bid(0, 1, currency, ethers.utils.parseEther("1.6"), 86400, {
        value: ethers.utils.parseEther("1.6"),
      });
    const bidTx = await bid.wait();
    console.log(bidTx.events);

    const listing0 = await msMkt3_1.listings(0);
    console.log(listing0);

    const bid2 = await msMkt3_1
      .connect(addr2)
      .bid(0, 1, currency, ethers.utils.parseEther("2"), 86400, {
        value: ethers.utils.parseEther("2"),
      });
    const bid2Tx = await bid2.wait();
    console.log(bid2Tx.events);

    const listing01 = await msMkt3_1.listings(0);
    console.log(listing01);

    // const offer = await msMkt3_1.connect(addr1).offer(msDrop721.address, 2, 1, currency, ethers.BigNumber.from("10000000000000000"), Math.floor((Date.now() + 86400) / 1000))
    // const offerTx = await offer.wait()
    // console.log(offerTx.events);

    // const off = await msMkt3_1.offers(msDrop721.address, 2, addr1.address)
    // console.log(off);

    // const approveWeth = await wethContract.connect(wethSigner).approve(msMkt3_1.address, ethers.BigNumber.from("20000000000000000"))
    // const approveWethTx = await approveWeth.wait()
    // console.log(approveWethTx.events);

    // const offer2 = await msMkt3_1.connect(wethSigner).offer(msDrop721.address, 2, 1, currency, ethers.BigNumber.from("20000000000000000"), Math.floor((Date.now() + 86400) / 1000))
    // const offer2Tx = await offer2.wait()
    // console.log(offer2Tx.events);

    // const off2 = await msMkt3_1.offers(msDrop721.address, 2, wethSigner.address)
    // console.log(off2);

    // const acceptOffer = await msMkt3_1.acceptOffer(msDrop721.address, 2, wethSigner.address, wEth, ethers.BigNumber.from("20000000000000000"))
    // const acceptOfferTx = await acceptOffer.wait()
    // console.log(acceptOfferTx.events);

    const directListingInfo = [
      msDrop721.address,
      3,
      Math.floor(Date.now() / 1000),
      86400,
      1,
      currency,
      0,
      ethers.utils.parseEther("1"),
      0,
    ];

    const direct = await msMkt3_1.createListing(directListingInfo);
    const directTx = await direct.wait();
    console.log(directTx.events);

    const directList = await msMkt3_1.listings(1);
    console.log(directList);

    const updDirect = await msMkt3_1.updateListing(1, 1, 0, ethers.utils.parseEther("3"), currency, 0, 0)
    const updDirectTx = await updDirect.wait();
    console.log("update direct", updDirectTx.events[0].args[1]);
    
    const directListUpd = await msMkt3_1.listings(1);
    console.log(directListUpd);

    const buy = await msMkt3_1
      .connect(addr1)
      .buy(1, addr1.address, 1, currency, ethers.utils.parseEther("3"), {
        value: ethers.utils.parseEther("3"),
      });
    const buyTx = await buy.wait();
    console.log(buyTx.events);
  });
});
