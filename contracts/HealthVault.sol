// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HealthVault
 * @notice ZKure Decentralized Health Record Anchor & Consent Registry.
 * @dev Anchors AES-256-GCM encrypted medical record hashes and enforces cryptographic
 *      time-bound patient consent tokens with zero PHI on-chain.
 */
contract HealthVault {
    struct RecordAnchor {
        bytes32 recordHash;       // SHA-256 fingerprint of the plaintext payload
        string ipfsCid;           // Content-addressed IPFS CID of encrypted ciphertext
        uint256 anchoredAt;       // Block timestamp of record creation
        bool exists;
    }

    struct ConsentToken {
        address patient;          // Patient wallet authorizing access
        address hospital;         // NABH-accredited hospital provider wallet
        bytes32[] recordHashes;   // Scoped list of record hashes authorized
        uint256 grantedAt;        // Timestamp when consent was signed
        uint256 expiresAt;        // Strict expiration timestamp (max 24h)
        bool revoked;             // Immediate emergency patient revocation flag
    }

    // Patient => (Record ID => RecordAnchor)
    mapping(address => mapping(string => RecordAnchor)) public patientRecords;
    
    // Consent Token ID => ConsentToken
    mapping(bytes32 => ConsentToken) public consentTokens;

    // Hospital => Patient => Active Consent Token ID
    mapping(address => mapping(address => bytes32)) public activeHospitalConsent;

    event RecordAnchored(address indexed patient, string indexed recordId, bytes32 recordHash, string ipfsCid, uint256 timestamp);
    event ConsentGranted(bytes32 indexed consentId, address indexed patient, address indexed hospital, uint256 expiresAt);
    event ConsentRevoked(bytes32 indexed consentId, address indexed patient, address indexed hospital);

    error RecordAlreadyExists(string recordId);
    error ConsentExpiredOrInvalid();
    error Unauthorized();

    /**
     * @notice Anchors an encrypted medical record's cryptographic hash to the blockchain.
     * @param recordId Unique identifier for the medical record (e.g. REC-1041).
     * @param recordHash SHA-256 digest of the original clinical document.
     * @param ipfsCid IPFS CID pointing to the AES-256-GCM ciphertext.
     */
    function anchorRecord(string calldata recordId, bytes32 recordHash, string calldata ipfsCid) external {
        if (patientRecords[msg.sender][recordId].exists) revert RecordAlreadyExists(recordId);

        patientRecords[msg.sender][recordId] = RecordAnchor({
            recordHash: recordHash,
            ipfsCid: ipfsCid,
            anchoredAt: block.timestamp,
            exists: true
        });

        emit RecordAnchored(msg.sender, recordId, recordHash, ipfsCid, block.timestamp);
    }

    /**
     * @notice Issues a time-bound scoped consent token for a verified healthcare provider.
     * @param hospital NABH provider wallet address.
     * @param recordHashes Array of record hashes explicitly granted in this token.
     * @param durationHours Duration in hours (1 to 24).
     */
    function grantConsent(address hospital, bytes32[] calldata recordHashes, uint256 durationHours) external returns (bytes32 consentId) {
        require(hospital != address(0), "Invalid hospital address");
        require(durationHours >= 1 && durationHours <= 24, "Duration must be between 1 and 24 hours");
        require(recordHashes.length > 0 && recordHashes.length <= 50, "Record scope must be 1 to 50 items");

        uint256 expiresAt = block.timestamp + (durationHours * 1 hours);
        consentId = keccak256(abi.encodePacked(msg.sender, hospital, block.timestamp, block.prevrandao));

        consentTokens[consentId] = ConsentToken({
            patient: msg.sender,
            hospital: hospital,
            recordHashes: recordHashes,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });

        activeHospitalConsent[hospital][msg.sender] = consentId;

        emit ConsentGranted(consentId, msg.sender, hospital, expiresAt);
    }

    /**
     * @notice Instantly revokes an active consent token with immediate effect.
     * @param consentId The unique ID of the consent token to terminate.
     */
    function revokeConsent(bytes32 consentId) external {
        ConsentToken storage token = consentTokens[consentId];
        if (token.patient != msg.sender) revert Unauthorized();

        token.revoked = true;
        if (activeHospitalConsent[token.hospital][msg.sender] == consentId) {
            delete activeHospitalConsent[token.hospital][msg.sender];
        }

        emit ConsentRevoked(consentId, msg.sender, token.hospital);
    }

    /**
     * @notice Cryptographically verifies if a hospital has active, unexpired consent to view a specific record hash.
     */
    function isConsentValid(address patient, address hospital, bytes32 recordHash) external view returns (bool) {
        bytes32 consentId = activeHospitalConsent[hospital][patient];
        if (consentId == bytes32(0)) return false;

        ConsentToken storage token = consentTokens[consentId];
        if (token.revoked || block.timestamp > token.expiresAt) return false;

        for (uint256 i = 0; i < token.recordHashes.length; i++) {
            if (token.recordHashes[i] == recordHash) return true;
        }

        return false;
    }
}
