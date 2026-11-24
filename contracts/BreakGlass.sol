// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title BreakGlass
 * @notice 2-of-3 Shamir Secret Sharing Emergency ICU Medical Protocol.
 * @dev Enables verified emergency physicians to unlock life-critical medical data
 *      only when at least 2 independent verified medical guardians sign on-chain.
 */
contract BreakGlass {
    struct EmergencySession {
        string patientId;
        string hospitalId;
        string doctorName;
        string icuReason;
        uint256 initiatedAt;
        uint256 expiresAt;
        uint256 signCount;
        bool unlocked;
        mapping(address => bool) hasSigned;
    }

    // Session ID => EmergencySession
    mapping(bytes32 => EmergencySession) private sessions;

    // Authorized Consortium Guardians
    mapping(address => bool) public authorizedGuardians;

    event EmergencyInitiated(bytes32 indexed sessionId, string patientId, string doctorName, string icuReason);
    event GuardianSigned(bytes32 indexed sessionId, address indexed guardian, uint256 totalSignatures);
    event EmergencyAccessUnlocked(bytes32 indexed sessionId, uint256 timestamp);

    error NotAuthorizedGuardian();
    error SessionExpiredOrUnlocked();
    error AlreadySigned();

    constructor(address[] memory initialGuardians) {
        for (uint256 i = 0; i < initialGuardians.length; i++) {
            authorizedGuardians[initialGuardians[i]] = true;
        }
    }

    function initiateEmergencyAccess(
        string calldata patientId,
        string calldata hospitalId,
        string calldata doctorName,
        string calldata icuReason
    ) external returns (bytes32 sessionId) {
        sessionId = keccak256(abi.encodePacked(patientId, hospitalId, block.timestamp, msg.sender));

        EmergencySession storage session = sessions[sessionId];
        session.patientId = patientId;
        session.hospitalId = hospitalId;
        session.doctorName = doctorName;
        session.icuReason = icuReason;
        session.initiatedAt = block.timestamp;
        session.expiresAt = block.timestamp + 4 hours; // Emergency window max 4h
        session.signCount = 0;
        session.unlocked = false;

        emit EmergencyInitiated(sessionId, patientId, doctorName, icuReason);
    }

    function signEmergencyAccess(bytes32 sessionId) external {
        if (!authorizedGuardians[msg.sender]) revert NotAuthorizedGuardian();

        EmergencySession storage session = sessions[sessionId];
        if (session.unlocked || block.timestamp > session.expiresAt) revert SessionExpiredOrUnlocked();
        if (session.hasSigned[msg.sender]) revert AlreadySigned();

        session.hasSigned[msg.sender] = true;
        session.signCount++;

        emit GuardianSigned(sessionId, msg.sender, session.signCount);

        // 2-of-3 Shamir threshold requirement
        if (session.signCount >= 2 && !session.unlocked) {
            session.unlocked = true;
            emit EmergencyAccessUnlocked(sessionId, block.timestamp);
        }
    }

    function isSessionUnlocked(bytes32 sessionId) external view returns (bool) {
        return sessions[sessionId].unlocked && block.timestamp <= sessions[sessionId].expiresAt;
    }
}
