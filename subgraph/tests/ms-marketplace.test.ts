import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { AuctionBuffersUpdated } from "../generated/schema"
import { AuctionBuffersUpdated as AuctionBuffersUpdatedEvent } from "../generated/MSMarketplace/MSMarketplace"
import { handleAuctionBuffersUpdated } from "../src/ms-marketplace"
import { createAuctionBuffersUpdatedEvent } from "./ms-marketplace-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let timeBuffer = BigInt.fromI32(234)
    let bidBufferBps = BigInt.fromI32(234)
    let newAuctionBuffersUpdatedEvent = createAuctionBuffersUpdatedEvent(
      timeBuffer,
      bidBufferBps
    )
    handleAuctionBuffersUpdated(newAuctionBuffersUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AuctionBuffersUpdated created and stored", () => {
    assert.entityCount("AuctionBuffersUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AuctionBuffersUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timeBuffer",
      "234"
    )
    assert.fieldEquals(
      "AuctionBuffersUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "bidBufferBps",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
