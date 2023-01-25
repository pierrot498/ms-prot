import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MSDropERC721 } from "../typechain";
describe("MSDrop721V2", function () {
  const defaultAdmin = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const forwarder = "0x56A0113AB3b7b67c655E4a0B679A4577e7F045c0";
  const MSFee = "0x8e7Fcbe0449b0689B1d1B5107554A2BA35f7C0D3";
  const MSCommunity = "0x8dbB949d0B6f713afc08c353CAEF4761E38C7C58";
  const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
  const wEth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let msDrop721: MSDropERC721;
  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const MSDrop721 = await ethers.getContractFactory("MSDropERC721");
    msDrop721 = await upgrades.deployProxy(
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
  });

  it("Should be able to whitelist and unwhitelist", async function test() {
    let claimCondition = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("0"),
      currency,
    ];
    expect(await msDrop721.name()).to.equal("MS MEMBERSHIP");

    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );

    let lazy = await lazyToken.wait();

    const token = await msDrop721.adminClaim(defaultAdmin, 1, 1);
    //whitelist an address
    await msDrop721.whitelist(forwarder, true);
    await msDrop721.setApprovalForAll(forwarder, true);
    await msDrop721.whitelist(forwarder, false);

    await expect(
      msDrop721.setApprovalForAll(forwarder, true)
    ).to.be.revertedWith("Address blacklisted");
  });

  it("Should be able to have auction on token", async function test() {
    let claimCondition = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("0"),
      currency,
    ];

    expect(await msDrop721.name()).to.equal("MS MEMBERSHIP");
    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );
    // 11 to 21 tokens will have ipfss://id as uri
    const lazyToken1 = await msDrop721.lazyMint(
      11,
      "ipfss://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );
    let lazy = await lazyToken.wait();

    const claim9 = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0") }
    );
    // const token = await msDrop721.adminClaim(defaultAdmin, 1, 21);
    console.log(await msDrop721.tokenURI(1));
    console.log(await msDrop721.ownerOf(1));
    //bid
    const lazyToken2 = await msDrop721.lazyMint(
      11,
      "ipfss://",
      true,
      true,
      1,
      [claimCondition],
      false,
      false
    );
    lazy = await lazyToken2.wait();
    console.log(await msDrop721.getIndice(24));
    //token 1 not auctionable
    await expect(
      msDrop721.bidOnToken(1, { value: ethers.utils.parseEther("1") })
    ).to.revertedWith("Token not auctionable");
    //revert if bid 0
    await expect(
      msDrop721.bidOnToken(25, { value: ethers.utils.parseEther("0") })
    ).to.revertedWith("Not enough ETH for bidding higher");

    //should bid and get his money back
    await msDrop721.connect(addr1).bidOnToken(25, { value: 1000})
    let walletAddr1= await ethers.provider.getBalance(addr1.address);

    await msDrop721.bidOnToken(25, { value: 1050 });

    //addr1 get 1000 wei back
    await expect(ethers.BigNumber.from(await ethers.provider.getBalance(addr1.address))).to.be.equal(ethers.BigNumber.from(walletAddr1).add(1000));

    //have 1500 wei on contract
    await expect(
      await ethers.provider.getBalance(msDrop721.address)
    ).to.be.equal(1050);
    //revert if claim directly
    await expect(msDrop721.claimBid(25)).to.revertedWith("Auction not finished");

    //wait 24 hours
    await time.increase(86400);

    //addr1 is not auction winner
    await expect(msDrop721.connect(addr1).claimBid(25)).to.revertedWith("Not auction winner");
    //claim bid
    await msDrop721.claimBid(25);
    //
    await expect(
      await ethers.provider.getBalance(msDrop721.address)
    ).to.be.equal(0);
    await expect(await msDrop721.ownerOf(25)).to.be.equal(defaultAdmin);

    /* const bid = await msDrop721.bidOnToken(25,
      { value: ethers.utils.parseEther("0") }
    );*/
  });

  it("Should be able to mint with valid price", async function test() {
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

    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );

    //claim on first edition
    const claim = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0.1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.1") }
    );
  });

  it("Should revert if wrong price ", async function test() {
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

    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );

    //claim on first edition
    //MINT with invalid price
    await expect(
      msDrop721.claim(
        defaultAdmin,
        [1, 1, ethers.utils.parseEther("0")],
        currency,
        ["0x0000000000000000000000000000000000000000000000000000000000000000"],
        0,
        { value: ethers.utils.parseEther("0") }
      )
    ).to.be.revertedWith("invalid currency or price.");
  });
  it("Shouldn't be able to mint few tokens in 1 tx from 2 different edition", async function test() {
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
    let claimCondition1 = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("1"),
      currency,
    ];
    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );
    // 11 to 21 tokens will have ipfss://id as uri
    const lazyToken1 = await msDrop721.lazyMint(
      11,
      "ipfss://",
      false,
      false,
      0,
      [claimCondition1],
      false,
      false
    );
    let lazy = await lazyToken.wait();

    //claim on first edition
    const claim = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0.1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.1") }
    );

    //revert if mint multiple and different editions
    await expect(
      msDrop721.claim(
        defaultAdmin,
        [10, 5, ethers.utils.parseEther("0.1")],
        currency,
        ["0x0000000000000000000000000000000000000000000000000000000000000000"],
        0,
        { value: ethers.utils.parseEther("0.1") }
      )
    ).to.be.revertedWith("Cannot mint different editions");
  });

  it("Should be able to mint different token on different fix price", async function test() {
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
    let claimCondition1 = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("1"),
      currency,
    ];
    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );
    // 11 to 21 tokens will have ipfss://id as uri
    const lazyToken1 = await msDrop721.lazyMint(
      11,
      "ipfss://",
      false,
      false,
      0,
      [claimCondition1],
      false,
      false
    );
    let lazy = await lazyToken.wait();

    //claim on first edition
    const claim = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0.1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.1") }
    );

    //Mint Second edition
    await msDrop721.claim(
      defaultAdmin,
      [11, 1, ethers.utils.parseEther("1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("1") }
    );
  });

  it("Should be able to update edition drop", async function test() {
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
    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      false
    );

    let lazy = await lazyToken.wait();

    //claim on first edition
    const claim = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0.1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.1") }
    );

    claimCondition = [
      1670418429,
      10,
      1,
      1,
      1,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      ethers.utils.parseEther("0.2"),
      currency,
    ];

    await msDrop721.lazyMint(
      11,
      "ipfs://",
      false,
      false,
      0,
      [claimCondition],
      false,
      true
    );

    await expect(
      msDrop721.claim(
        defaultAdmin,
        [2, 1, ethers.utils.parseEther("0.1")],
        currency,
        ["0x0000000000000000000000000000000000000000000000000000000000000000"],
        0,
        { value: ethers.utils.parseEther("0.1") }
      )
    ).to.be.revertedWith("invalid currency or price.");

    await msDrop721.claim(
      defaultAdmin,
      [2, 1, ethers.utils.parseEther("0.2")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.2") }
    );

    //should be able to transfert
    await msDrop721.transferFrom(defaultAdmin, forwarder, 1);
  });

  it("Shouldn't be able to transfer when physical", async function test() {
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
    //First 10 tokens will have ipfs://id as uri
    const lazyToken = await msDrop721.lazyMint(
      10,
      "ipfs://",
      false,
      true,
      0,
      [claimCondition],
      false,
      false
    );

    let lazy = await lazyToken.wait();

    //claim on first edition
    const claim = await msDrop721.claim(
      defaultAdmin,
      [1, 1, ethers.utils.parseEther("0.1")],
      currency,
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      0,
      { value: ethers.utils.parseEther("0.1") }
    );

    //Physical asset shouldn't be able to be be transfered if not scanned
    await expect(
      msDrop721.transferFrom(defaultAdmin, forwarder, 1)
    ).to.be.rejectedWith("Not scanned");
    await expect(await msDrop721.ownerOf(1)).to.be.equal(defaultAdmin);

    //Scan physical asset
    await msDrop721.setScanned(1);

    //should be ableto transfer
    await msDrop721.transferFrom(defaultAdmin, forwarder, 1);
    await expect(await msDrop721.ownerOf(1)).to.be.equal(forwarder);
  });
});
