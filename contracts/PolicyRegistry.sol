// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PolicyRegistry
 * @notice ZKure Decentralized Insurance Policy & Procedure Registry.
 * @dev Stores Pedersen policy commitments and depth-8 covered medical procedure Merkle roots
 *      for zero-knowledge eligibility verification.
 */
contract PolicyRegistry {
    address public immutable governance;

    struct PolicyCommitment {
        address insurer;
        uint256 coverageLimitInr;
        uint256 validTill;
        bool active;
    }

    // Pedersen Commitment Hash => Policy Metadata
    mapping(bytes32 => PolicyCommitment) public policyCommitments;

    // Depth-8 Merkle Tree Root of Covered ICD-10 Medical Procedures
    bytes32 public coveredProceduresMerkleRoot;

    event PolicyRegistered(bytes32 indexed commitment, address indexed insurer, uint256 coverageLimit, uint256 validTill);
    event ProcedureRootUpdated(bytes32 indexed newRoot);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Unauthorized");
        _;
    }

    constructor() {
        governance = msg.sender;
        // Baseline procedure Merkle root for covered procedures (Cardiology, Surgery, Pathology, Ophthalmology, Orthopedics)
        coveredProceduresMerkleRoot = 0x4f82e1a90c42e8f112b95c4d7019e8a234f56c78d90e12a34b56c78d90e12a34;
    }

    function registerPolicy(
        bytes32 commitment,
        address insurer,
        uint256 coverageLimitInr,
        uint256 validTill
    ) external onlyGovernance {
        require(policyCommitments[commitment].validTill == 0, "Commitment already registered");

        policyCommitments[commitment] = PolicyCommitment({
            insurer: insurer,
            coverageLimitInr: coverageLimitInr,
            validTill: validTill,
            active: true
        });

        emit PolicyRegistered(commitment, insurer, coverageLimitInr, validTill);
    }

    function updateCoveredProcedureRoot(bytes32 newRoot) external onlyGovernance {
        coveredProceduresMerkleRoot = newRoot;
        emit ProcedureRootUpdated(newRoot);
    }
}
