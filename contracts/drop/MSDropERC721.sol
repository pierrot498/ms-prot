// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

//  ==========  External imports    ==========

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/BitMapsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

//  ==========  Internal imports    ==========

import { IMSDropERC721 } from "../interfaces/drop/IMSDropERC721.sol";
import "../interfaces/IMSContract.sol";

//  ==========  Features    ==========

import "../extension/PlatformFee.sol";
import "../extension/PrimarySale.sol";
import "../extension/Royalty.sol";
import "../extension/Ownable.sol";

import "../openzeppelin-presets/metatx/ERC2771ContextUpgradeable.sol";

import "../lib/CurrencyTransferLib.sol";
import "../lib/MerkleProof.sol";

contract MSDropERC721 is
    Initializable,
    IMSContract,
    Ownable,
    Royalty,
    PrimarySale,
    PlatformFee,
    ReentrancyGuardUpgradeable,
    ERC2771ContextUpgradeable,
    MulticallUpgradeable,
    AccessControlEnumerableUpgradeable,
    ERC721EnumerableUpgradeable,
    IMSDropERC721
{
    using BitMapsUpgradeable for BitMapsUpgradeable.BitMap;
    using StringsUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    bytes32 private constant MODULE_TYPE = bytes32("ERC721");
    uint256 private constant VERSION = 1;

    /// @dev Only transfers to or from TRANSFER_ROLE holders are valid, when transfers are restricted.
    bytes32 private constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    /// @dev Only MINTER_ROLE holders can lazy mint NFTs.
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Max bps in the thirdweb system.
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The next token ID of the NFT to "lazy mint".
    uint256 public nextTokenIdToMint;

    /// @dev The max number of NFTs a wallet can claim.
    uint256 public maxWalletClaimCount;

    /// @dev Global max total supply of NFTs.
    uint256 public maxTotalSupply;

    /// @dev The address that receives Monde Singulier Community fees from all sales.
    address private primaryMSCommunityFeeRecipient;

    /// @dev The % of primary sales fees collected to Monde Singulier Community.
    uint16 private primaryMSCommunityFeeBps;

    /// @dev Contract level metadata.
    string public contractURI;

    /// @dev Largest tokenId of each batch of tokens with the same baseURI
    uint256[] public baseURIIndices;

    /// @dev The set of all claim conditions, at any given moment.
    ClaimConditionList public claimCondition;

    /*///////////////////////////////////////////////////////////////
                                Mappings
    //////////////////////////////////////////////////////////////*/

    /**
     *  @dev Mapping from 'Largest tokenId of a batch of tokens with the same baseURI'
     *       to base URI for the respective batch of tokens.
     **/
    mapping(uint256 => string) private baseURI;

    /**
     *  @dev Mapping from 'Largest tokenId of a batch of 'delayed-reveal' tokens with
     *       the same baseURI' to encrypted base URI for the respective batch of tokens.
     **/
    mapping(uint256 => bytes) public encryptedData;

    /// @dev Mapping from address => total number of NFTs a wallet has claimed.
    mapping(address => uint256) public walletClaimCount;

    /// @dev Token ID => royalty recipient and bps for token
    mapping(uint256 => RoyaltyInfo) private royaltyInfoForToken;

    mapping(uint256 => bool) public hasBeenMinted;

    /*///////////////////////////////////////////////////////////////
                    Constructor + initializer logic
    //////////////////////////////////////////////////////////////*/

    constructor() initializer {}

    /// @dev Initiliazes the contract, like a constructor.
    function initialize(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address[] memory _trustedForwarders,
        address _saleRecipient,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        uint128 _platformFeeBps,
        address _platformFeeRecipient,
        address _primaryMSCommunityFeeRecipient,
        uint128 _primaryMSCommunityFeeBps
    ) external initializer {
        // Initialize inherited contracts, most base-like -> most derived.
        __ReentrancyGuard_init();
        __ERC2771Context_init(_trustedForwarders);
        __ERC721_init(_name, _symbol);

        _setupOwner(_defaultAdmin);
        contractURI = _contractURI;
        
        _setupPlatformFeeInfo(_platformFeeRecipient, _platformFeeBps);
        _setupDefaultRoyaltyInfo(_royaltyRecipient, _royaltyBps);
        _setupPrimarySaleRecipient(_saleRecipient);
        
        primaryMSCommunityFeeRecipient = _primaryMSCommunityFeeRecipient;
        primaryMSCommunityFeeBps = uint16(_primaryMSCommunityFeeBps);

        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(MINTER_ROLE, _defaultAdmin);
        _setupRole(TRANSFER_ROLE, _defaultAdmin);
        _setupRole(TRANSFER_ROLE, address(0));

        nextTokenIdToMint = 1;
    }

    /*///////////////////////////////////////////////////////////////
                        Generic contract logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the type of the contract.
    function contractType() external pure returns (bytes32) {
        return MODULE_TYPE;
    }

    /// @dev Returns the version of the contract.
    function contractVersion() external pure returns (uint8) {
        return uint8(VERSION);
    }

    /*///////////////////////////////////////////////////////////////
                        ERC 165 / 721 / 2981 logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the URI for a given tokenId.
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        for (uint256 i = 0; i < baseURIIndices.length; i += 1) {
            if (_tokenId < baseURIIndices[i]) {
                if (encryptedData[baseURIIndices[i]].length != 0) {
                    return string(abi.encodePacked(baseURI[baseURIIndices[i]], "0"));
                } else {
                    return string(abi.encodePacked(baseURI[baseURIIndices[i]], _tokenId.toString()));
                }
            }
        }

        return "";
    }

    /// @dev See ERC 165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721EnumerableUpgradeable, AccessControlEnumerableUpgradeable, IERC165Upgradeable, IERC165)
        returns (bool)
    {
        return super.supportsInterface(interfaceId) || type(IERC2981Upgradeable).interfaceId == interfaceId;
    }

    /*///////////////////////////////////////////////////////////////
                    Minting + delayed-reveal logic
    //////////////////////////////////////////////////////////////*/

    /**
     *  @dev Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
     *       The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.
     */
    function lazyMint(
        uint256 _amount,
        string calldata _baseURIForTokens
    ) external onlyRole(MINTER_ROLE) {
        uint256 startId = nextTokenIdToMint;
        uint256 baseURIIndex = startId + _amount;

        nextTokenIdToMint = baseURIIndex;
        baseURI[baseURIIndex] = _baseURIForTokens;
        baseURIIndices.push(baseURIIndex);

        emit TokensLazyMinted(startId, startId + _amount - 1, _baseURIForTokens, royaltyRecipient);
    }

    /*///////////////////////////////////////////////////////////////
                            Admin Claim
    //////////////////////////////////////////////////////////////*/

    function adminClaim(
        address _receiver,
        uint256 _quantity,
        uint256 _tokenId
        ) external onlyRole(MINTER_ROLE) {
        uint256 tokenIdToClaim = _tokenId;
        
        verifyAdminClaim(_quantity, _tokenId);

        for (uint256 i = 0; i < _quantity; i += 1) {
            _safeMint(_receiver, tokenIdToClaim);
            hasBeenMinted[tokenIdToClaim] = true;
            tokenIdToClaim += 1;
        }

        emit TokensAdminClaimed(_msgSender(), _receiver, tokenIdToClaim ,_quantity);
    }

    function verifyAdminClaim(uint256 _quantity, uint256 _tokenId) public view virtual {

        require(_tokenId + _quantity <= nextTokenIdToMint, "not enough minted tokens.");
        require(maxTotalSupply == 0 || _tokenId + _quantity <= maxTotalSupply, "exceed max total supply.");
        require(hasBeenMinted[_tokenId] == false, "already minted");
        require(_tokenId > 0, "ID0-DE");
    }

    /*///////////////////////////////////////////////////////////////
                            Claim logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets an account claim NFTs.
    function claim(
        address _receiver,
        ClaimTokenInfos memory _claimTokenInfos,
        address _currency,
        bytes32[] calldata _proofs,
        uint256 _proofMaxQuantityPerTransaction
    ) external payable nonReentrant {
        require(isTrustedForwarder(msg.sender) || _msgSender() == tx.origin, "BOT");

        uint256 tokenIdToClaim = _claimTokenInfos.tokenId;

        // Get the claim conditions.
        uint256 activeConditionId = getActiveClaimConditionId();

        /**
         *  We make allowlist checks (i.e. verifyClaimMerkleProof) before verifying the claim's general
         *  validity (i.e. verifyClaim) because we give precedence to the check of allow list quantity
         *  restriction over the check of the general claim condition's quantityLimitPerTransaction
         *  restriction.
         */

        // Verify inclusion in allowlist.
        (bool validMerkleProof, uint256 merkleProofIndex) = verifyClaimMerkleProof(
            activeConditionId,
            _msgSender(),
            _claimTokenInfos.quantity,
            _proofs,
            _proofMaxQuantityPerTransaction
        );

        // Verify claim validity. If not valid, revert.
        // when there's allowlist present --> verifyClaimMerkleProof will verify the _proofMaxQuantityPerTransaction value with hashed leaf in the allowlist
        // when there's no allowlist, this check is true --> verifyClaim will check for _quantity being less/equal than the limit
        bool toVerifyMaxQuantityPerTransaction = _proofMaxQuantityPerTransaction == 0 ||
            claimCondition.phases[activeConditionId].merkleRoot == bytes32(0);
        verifyClaim(
            activeConditionId,
            _msgSender(),
            _currency,
            toVerifyMaxQuantityPerTransaction,
            _claimTokenInfos
        );

        if (validMerkleProof && _proofMaxQuantityPerTransaction > 0) {
            /**
             *  Mark the claimer's use of their position in the allowlist. A spot in an allowlist
             *  can be used only once.
             */
            claimCondition.limitMerkleProofClaim[activeConditionId].set(merkleProofIndex);
        }

        // If there's a price, collect price.
        collectClaimPrice(address(0), _claimTokenInfos.quantity, _currency, _claimTokenInfos.pricePerToken);

        // Mint the relevant NFTs to claimer.
        transferClaimedTokens(_receiver, activeConditionId, _claimTokenInfos.quantity, _claimTokenInfos.tokenId);

        emit TokensClaimed(activeConditionId, _msgSender(), _receiver, tokenIdToClaim, _claimTokenInfos.quantity);
    }

    /// @dev Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions.
    function setClaimConditions(ClaimCondition[] calldata _phases, bool _resetClaimEligibility)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        uint256 existingStartIndex = claimCondition.currentStartId;
        uint256 existingPhaseCount = claimCondition.count;

        /**
         *  `limitLastClaimTimestamp` and `limitMerkleProofClaim` are mappings that use a
         *  claim condition's UID as a key.
         *
         *  If `_resetClaimEligibility == true`, we assign completely new UIDs to the claim
         *  conditions in `_phases`, effectively resetting the restrictions on claims expressed
         *  by `limitLastClaimTimestamp` and `limitMerkleProofClaim`.
         */
        uint256 newStartIndex = existingStartIndex;
        if (_resetClaimEligibility) {
            newStartIndex = existingStartIndex + existingPhaseCount;
        }

        claimCondition.count = _phases.length;
        claimCondition.currentStartId = newStartIndex;

        uint256 lastConditionStartTimestamp;
        for (uint256 i = 0; i < _phases.length; i++) {
            require(i == 0 || lastConditionStartTimestamp < _phases[i].startTimestamp, "ST");

            uint256 supplyClaimedAlready = claimCondition.phases[newStartIndex + i].supplyClaimed;
            require(supplyClaimedAlready <= _phases[i].maxClaimableSupply, "max supply claimed already");

            claimCondition.phases[newStartIndex + i] = _phases[i];
            claimCondition.phases[newStartIndex + i].supplyClaimed = supplyClaimedAlready;

            lastConditionStartTimestamp = _phases[i].startTimestamp;
        }

        /**
         *  Gas refunds (as much as possible)
         *
         *  If `_resetClaimEligibility == true`, we assign completely new UIDs to the claim
         *  conditions in `_phases`. So, we delete claim conditions with UID < `newStartIndex`.
         *
         *  If `_resetClaimEligibility == false`, and there are more existing claim conditions
         *  than in `_phases`, we delete the existing claim conditions that don't get replaced
         *  by the conditions in `_phases`.
         */
        if (_resetClaimEligibility) {
            for (uint256 i = existingStartIndex; i < newStartIndex; i++) {
                delete claimCondition.phases[i];
                delete claimCondition.limitMerkleProofClaim[i];
            }
        } else {
            if (existingPhaseCount > _phases.length) {
                for (uint256 i = _phases.length; i < existingPhaseCount; i++) {
                    delete claimCondition.phases[newStartIndex + i];
                    delete claimCondition.limitMerkleProofClaim[newStartIndex + i];
                }
            }
        }

        emit ClaimConditionsUpdated(_phases);
    }

    /// @dev Collects and distributes the primary sale value of NFTs being claimed.
    function collectClaimPrice(
        address _primarySaleRecipient,
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken
    ) internal {
        if (_pricePerToken == 0) {
            return;
        }

        (address platformFeeRecipient, uint16 platformFeeBps) = getPlatformFeeInfo();
        address primarySaleRecipient = _primarySaleRecipient == address(0) ? primarySaleRecipient() : _primarySaleRecipient;

        uint256 totalPrice = _quantityToClaim * _pricePerToken;
        uint256 platformFees = (totalPrice * platformFeeBps) / MAX_BPS;
        uint256 MSCommunityFees = (totalPrice * primaryMSCommunityFeeBps) / MAX_BPS;

        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            require(msg.value == totalPrice, "must send total price.");
        }

        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), platformFeeRecipient, platformFees);
        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), primaryMSCommunityFeeRecipient, MSCommunityFees);
        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), primarySaleRecipient, totalPrice - (platformFees + MSCommunityFees));
    }

    /// @dev Transfers the NFTs being claimed.
    function transferClaimedTokens(
        address _to,
        uint256 _conditionId,
        uint256 _quantityBeingClaimed,
        uint256 _tokenId
    ) internal {
        // Update the supply minted under mint condition.
        claimCondition.phases[_conditionId].supplyClaimed += _quantityBeingClaimed;

        // if transfer claimed tokens is called when `to != msg.sender`, it'd use msg.sender's limits.
        // behavior would be similar to `msg.sender` mint for itself, then transfer to `_to`.
        claimCondition.limitLastClaimTimestamp[_conditionId][_msgSender()] = block.timestamp;
        walletClaimCount[_msgSender()] += _quantityBeingClaimed;

        uint256 tokenIdToClaim = _tokenId;

        for (uint256 i = 0; i < _quantityBeingClaimed; i += 1) {
            _safeMint(_to, tokenIdToClaim);
            hasBeenMinted[tokenIdToClaim] = true;
            tokenIdToClaim += 1;
        }
    }

    /// @dev Checks a request to claim NFTs against the active claim condition's criteria.
    function verifyClaim(
        uint256 _conditionId,
        address _claimer,
        address _currency,
        bool verifyMaxQuantityPerTransaction,
        ClaimTokenInfos memory _claimTokenInfos
    ) public view {
        ClaimCondition memory currentClaimPhase = claimCondition.phases[_conditionId];

        require(
            _currency == currentClaimPhase.currency && _claimTokenInfos.pricePerToken == currentClaimPhase.pricePerToken,
            "invalid currency or price."
        );

        // If we're checking for an allowlist quantity restriction, ignore the general quantity restriction.
        require(
            _claimTokenInfos.quantity > 0 &&
                (!verifyMaxQuantityPerTransaction || _claimTokenInfos.quantity <= currentClaimPhase.quantityLimitPerTransaction),
            "invalid quantity."
        );
        require(
            currentClaimPhase.supplyClaimed + _claimTokenInfos.quantity <= currentClaimPhase.maxClaimableSupply,
            "exceed max claimable supply."
        );
        require(_claimTokenInfos.tokenId + _claimTokenInfos.quantity <= nextTokenIdToMint, "not enough minted tokens.");
        require(maxTotalSupply == 0 || _claimTokenInfos.tokenId + _claimTokenInfos.quantity <= maxTotalSupply, "exceed max total supply.");
        require(
            maxWalletClaimCount == 0 || walletClaimCount[_claimer] + _claimTokenInfos.quantity <= maxWalletClaimCount,
            "exceed claim limit"
        );
        require(_claimTokenInfos.tokenId > 0, "ID0-DE");
        (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp) = getClaimTimestamp(_conditionId, _claimer);
        require(lastClaimTimestamp == 0 || block.timestamp >= nextValidClaimTimestamp, "cannot claim.");
        require(hasBeenMinted[_claimTokenInfos.tokenId] == false, "already minted");
    }

    /// @dev Checks whether a claimer meets the claim condition's allowlist criteria.
    function verifyClaimMerkleProof(
        uint256 _conditionId,
        address _claimer,
        uint256 _quantity,
        bytes32[] calldata _proofs,
        uint256 _proofMaxQuantityPerTransaction
    ) public view returns (bool validMerkleProof, uint256 merkleProofIndex) {
        ClaimCondition memory currentClaimPhase = claimCondition.phases[_conditionId];

        if (currentClaimPhase.merkleRoot != bytes32(0)) {
            (validMerkleProof, merkleProofIndex) = MerkleProof.verify(
                _proofs,
                currentClaimPhase.merkleRoot,
                keccak256(abi.encodePacked(_claimer, _proofMaxQuantityPerTransaction))
            );
            require(validMerkleProof, "not in whitelist.");
            require(!claimCondition.limitMerkleProofClaim[_conditionId].get(merkleProofIndex), "proof claimed.");
            require(
                _proofMaxQuantityPerTransaction == 0 || _quantity <= _proofMaxQuantityPerTransaction,
                "invalid quantity proof."
            );
        }
    }

    /*///////////////////////////////////////////////////////////////
                        Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev At any given moment, returns the uid for the active claim condition.
    function getActiveClaimConditionId() public view returns (uint256) {
        for (uint256 i = claimCondition.currentStartId + claimCondition.count; i > claimCondition.currentStartId; i--) {
            if (block.timestamp >= claimCondition.phases[i - 1].startTimestamp) {
                return i - 1;
            }
        }

        revert("!CONDITION.");
    }

    /// @dev Returns the Monde Singulier Community fee recipient and bps.
    function getMSCommunityFeeInfo() external view returns (address, uint16) {
        return (primaryMSCommunityFeeRecipient, uint16(primaryMSCommunityFeeBps));
    }

    /// @dev Returns the timestamp for when a claimer is eligible for claiming NFTs again.
    function getClaimTimestamp(uint256 _conditionId, address _claimer)
        public
        view
        returns (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp)
    {
        lastClaimTimestamp = claimCondition.limitLastClaimTimestamp[_conditionId][_claimer];

        unchecked {
            nextValidClaimTimestamp =
                lastClaimTimestamp +
                claimCondition.phases[_conditionId].waitTimeInSecondsBetweenClaims;

            if (nextValidClaimTimestamp < lastClaimTimestamp) {
                nextValidClaimTimestamp = type(uint256).max;
            }
        }
    }

    /// @dev Returns the claim condition at the given uid.
    function getClaimConditionById(uint256 _conditionId) external view returns (ClaimCondition memory condition) {
        condition = claimCondition.phases[_conditionId];
    }

    /// @dev Returns the amount of stored baseURIs
    function getBaseURICount() external view returns (uint256) {
        return baseURIIndices.length;
    }

    /*///////////////////////////////////////////////////////////////
                        Setter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets a contract admin set a claim count for a wallet.
    function setWalletClaimCount(address _claimer, uint256 _count) external onlyRole(DEFAULT_ADMIN_ROLE) {
        walletClaimCount[_claimer] = _count;
        emit WalletClaimCountUpdated(_claimer, _count);
    }

    /// @dev Lets a contract admin set a maximum number of NFTs that can be claimed by any wallet.
    function setMaxWalletClaimCount(uint256 _count) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxWalletClaimCount = _count;
        emit MaxWalletClaimCountUpdated(_count);
    }

    /// @dev Lets a contract admin set the global maximum supply for collection's NFTs.
    function setMaxTotalSupply(uint256 _maxTotalSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTotalSupply = _maxTotalSupply;
        emit MaxTotalSupplyUpdated(_maxTotalSupply);
    }

    /// @dev Lets a contract admin update the Monde Singulier Community fee recipient and bps
    function setMSCommunityFeeInfo(address _MSCommunityFeeRecipient, uint256 _MSCommunityFeeBps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_MSCommunityFeeBps <= MAX_BPS, "> MAX_BPS.");

        primaryMSCommunityFeeBps = uint16(_MSCommunityFeeBps);
        primaryMSCommunityFeeRecipient = _MSCommunityFeeRecipient;

        emit primaryMSCommunityFeeInfoUpdated(_MSCommunityFeeRecipient, _MSCommunityFeeBps);
    }

    function setTokenURI(uint256 _uriIndice ,string calldata _newBaseUriForToken) external onlyRole(DEFAULT_ADMIN_ROLE){
        baseURI[_uriIndice] = _newBaseUriForToken;
    }

    /// @dev Checks whether primary sale recipient can be set in the given execution context.
    function _canSetPrimarySaleRecipient() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

        /// @dev Checks whether owner can be set in the given execution context.
    function _canSetOwner() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

        /// @dev Checks whether platform fee info can be set in the given execution context.
    function _canSetPlatformFeeInfo() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

        /// @dev Checks whether royalty info can be set in the given execution context.
    function _canSetRoyaltyInfo() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /*///////////////////////////////////////////////////////////////
                        Miscellaneous
    //////////////////////////////////////////////////////////////*/

    /// @dev Burns `tokenId`. See {ERC721-_burn}.
    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "caller not owner nor approved");
        _burn(tokenId);
    }

    /// @dev See {ERC721-_beforeTokenTransfer}.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // if transfer is restricted on the contract, we still want to allow burning and minting
        if (!hasRole(TRANSFER_ROLE, address(0)) && from != address(0) && to != address(0)) {
            require(hasRole(TRANSFER_ROLE, from) || hasRole(TRANSFER_ROLE, to), "!TRANSFER_ROLE");
        }
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address sender)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        return ERC2771ContextUpgradeable._msgData();
    }
}
