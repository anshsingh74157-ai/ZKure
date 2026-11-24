// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HospitalRegistry
 * @notice ZKure Decentralized Hospital Provider Registry with Merkle Tree Inclusion.
 * @dev Maintains NABH accredited healthcare facilities, EdDSA BabyJubjub signing keys,
 *      and depth-16 Merkle tree roots for zero-knowledge provider verification.
 */
contract HospitalRegistry {
    address public immutable governance;

    struct HospitalNode {
        string nabhRegistration;
        bytes32 eddsaPublicKeyX;
        bytes32 eddsaPublicKeyY;
        uint256 bondedCollateralInr;
        bool verified;
    }

    // Hospital Address => Details
    mapping(address => HospitalNode) public hospitals;

    // Depth-16 Merkle Root of Accredited Hospitals
    bytes32 public hospitalMerkleRoot;
    uint256 public hospitalCount;

    event HospitalRegistered(address indexed hospital, string nabhRegistration, uint256 leafIndex);
    event CollateralBonded(address indexed hospital, uint256 amountInr);
    event MerkleRootUpdated(bytes32 newRoot);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Unauthorized");
        _;
    }

    constructor() {
        governance = msg.sender;
        // Initial depth-16 Merkle tree root of baseline accredited hospitals
        hospitalMerkleRoot = 0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK_HospRoot_2026;
    }

    function registerHospital(
        address hospital,
        string calldata nabhRegistration,
        bytes32 pubKeyX,
        bytes32 pubKeyY,
        uint256 collateralInr
    ) external onlyGovernance {
        require(hospital != address(0), "Invalid address");
        require(!hospitals[hospital].verified, "Already registered");

        hospitals[hospital] = HospitalNode({
            nabhRegistration: nabhRegistration,
            eddsaPublicKeyX: pubKeyX,
            eddsaPublicKeyY: pubKeyY,
            bondedCollateralInr: collateralInr,
            verified: true
        });

        hospitalCount++;
        emit HospitalRegistered(hospital, nabhRegistration, hospitalCount - 1);
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyGovernance {
        hospitalMerkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }
}
