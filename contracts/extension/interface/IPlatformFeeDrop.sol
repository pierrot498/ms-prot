// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 *  Thirdweb's `PlatformFee` is a contract extension to be used with any base contract. It exposes functions for setting and reading
 *  the recipient of platform fee and the platform fee basis points, and lets the inheriting contract perform conditional logic
 *  that uses information about platform fees, if desired.
 */

interface IPlatformFeeDrop {
    /// @dev Returns the platform fee bps and recipient.
    function getPlatformFeeInfo() external view returns (address);

    /// @dev Lets a module admin update the fees on primary sales.
    function setPlatformFeeInfo(address _platformFeeRecipient) external;

    /// @dev Emitted when fee on primary sales is updated.
    event PlatformFeeInfoUpdated(address indexed platformFeeRecipient);

    /// @dev Emitted when fee on primary sales is updated.
    event MSCommunityFeeInfoUpdated(address indexed MSCommunityFeeRecipient, uint256 primaryMSCommunityFeeBps);
}
