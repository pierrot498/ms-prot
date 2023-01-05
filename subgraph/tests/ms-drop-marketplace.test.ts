import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { DropAuctionBuffersUpdated } from "../generated/schema"
import { DropAuctionBuffersUpdated as DropAuctionBuffersUpdatedEvent } from "../generated/MSDropMarketplace/MSDropMarketplace"
import { handleDropAuctionBuffersUpdated } from "../src/ms-drop-marketplace"
import { createDropAuctionBuffersUpdatedEvent } from "./ms-drop-marketplace-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let timeBuffer = BigInt.fromI32(234)
    let bidBufferBps = BigInt.fromI32(234)
    let newDropAuctionBuffersUpdatedEvent = createDropAuctionBuffersUpdatedEvent(
      timeBuffer,
      bidBufferBps
    )
    handleDropAuctionBuffersUpdated(newDropAuctionBuffersUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("DropAuctionBuffersUpdated created and stored", () => {
    assert.entityCount("DropAuctionBuffersUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "DropAuctionBuffersUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "timeBuffer",
      "234"
    )
    assert.fieldEquals(
      "DropAuctionBuffersUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "bidBufferBps",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
