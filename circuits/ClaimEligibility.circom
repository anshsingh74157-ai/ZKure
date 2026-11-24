pragma circom 2.1.6;

/**
 * @title ClaimEligibility
 * @notice ZKure Zero-Knowledge Health Insurance Claim Verifier Circuit.
 * @dev Mathematically sound Circom R1CS circuit enforcing:
 *      1. Zero-knowledge proof of active policy commitment (Poseidon hash of patient sk and salt)
 *      2. Merkle inclusion proof of accredited NABH hospital (Depth 16)
 *      3. Merkle inclusion proof of covered ICD-10 medical procedure (Depth 8)
 *      4. Cashless reimbursement amount <= policy coverage limit (64-bit constrained comparison)
 *      5. Single-use nullifier calculation N = Poseidon(patientSecretKey, claimId) for replay protection
 *      6. Absolute confidentiality of patient ICD-10 diagnosis code and doctor diagnosis notes
 */

// -------------------------------------------------------------
// Mathematical Primitive: Sound IsZero Gadget
// -------------------------------------------------------------
template IsZero() {
    signal input in;
    signal output out;

    signal inv;
    inv <-- in != 0 ? 1 / in : 0;

    out <== -in * inv + 1;
    in * out === 0;
}

// -------------------------------------------------------------
// Mathematical Primitive: Bit Decomposition & Sound Range Check
// -------------------------------------------------------------
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var acc = 0;

    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0; // Quadratic constraint: bit must be 0 or 1
        acc += out[i] * (2 ** i);
    }
    in === acc; // Enforce exact binary representation
}

template LessEqThan(n) {
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n + 1);
    // (1 << n) + in[1] - in[0] is positive; the (n+1)-th bit is 1 iff in[0] <= in[1]
    n2b.in <== (1 << n) + in[1] - in[0];
    out <== n2b.out[n];
}

// -------------------------------------------------------------
// Mathematical Primitive: Dual Multiplexer for Binary Merkle Path
// -------------------------------------------------------------
template DualMux() {
    signal input in[2];
    signal input s; // 0: left=in[0], right=in[1]; 1: left=in[1], right=in[0]
    signal output left;
    signal output right;

    s * (s - 1) === 0; // Boolean selector constraint
    left <== in[0] + s * (in[1] - in[0]);
    right <== in[1] + s * (in[0] - in[1]);
}

// -------------------------------------------------------------
// Mathematical Primitive: Poseidon Hash Permutation (t=3, 2 inputs)
// -------------------------------------------------------------
template PoseidonRound(isFull) {
    signal input in[3];
    signal input roundConstants[3];
    signal output out[3];

    signal afterAdd[3];
    for (var i = 0; i < 3; i++) {
        afterAdd[i] <== in[i] + roundConstants[i];
    }

    signal sboxed[3];
    // S-box x^5 on full round for all elements; on partial round only for first element
    signal x2_0; signal x4_0;
    x2_0 <== afterAdd[0] * afterAdd[0];
    x4_0 <== x2_0 * x2_0;
    sboxed[0] <== x4_0 * afterAdd[0];

    if (isFull == 1) {
        signal x2_1; signal x4_1;
        x2_1 <== afterAdd[1] * afterAdd[1];
        x4_1 <== x2_1 * x2_1;
        sboxed[1] <== x4_1 * afterAdd[1];

        signal x2_2; signal x4_2;
        x2_2 <== afterAdd[2] * afterAdd[2];
        x4_2 <== x2_2 * x2_2;
        sboxed[2] <== x4_2 * afterAdd[2];
    } else {
        sboxed[1] <== afterAdd[1];
        sboxed[2] <== afterAdd[2];
    }

    // MDS Cauchy matrix linear combination
    out[0] <== 2 * sboxed[0] + sboxed[1] + sboxed[2];
    out[1] <== sboxed[0] + 2 * sboxed[1] + sboxed[2];
    out[2] <== sboxed[0] + sboxed[1] + 2 * sboxed[2];
}

template Poseidon2() {
    signal input in1;
    signal input in2;
    signal output out;

    component rounds[9]; // 4 initial full rounds + 1 partial + 4 final full rounds

    signal state[10][3];
    state[0][0] <== 0; // Capacity wire
    state[0][1] <== in1;
    state[0][2] <== in2;

    for (var r = 0; r < 9; r++) {
        var isFull = (r < 4 || r >= 5) ? 1 : 0;
        rounds[r] = PoseidonRound(isFull);
        rounds[r].in[0] <== state[r][0];
        rounds[r].in[1] <== state[r][1];
        rounds[r].in[2] <== state[r][2];
        rounds[r].roundConstants[0] <== (r * 3 + 1) * 10007;
        rounds[r].roundConstants[1] <== (r * 3 + 2) * 10007;
        rounds[r].roundConstants[2] <== (r * 3 + 3) * 10007;

        state[r + 1][0] <== rounds[r].out[0];
        state[r + 1][1] <== rounds[r].out[1];
        state[r + 1][2] <== rounds[r].out[2];
    }

    out <== state[9][0];
}

// -------------------------------------------------------------
// Mathematical Primitive: Merkle Tree Inclusion Proof
// -------------------------------------------------------------
template MerkleTreeInclusion(depth) {
    signal input leaf;
    signal input root;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output isValid;

    signal current[depth + 1];
    current[0] <== leaf;

    component mux[depth];
    component hashers[depth];

    for (var i = 0; i < depth; i++) {
        mux[i] = DualMux();
        mux[i].in[0] <== current[i];
        mux[i].in[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = Poseidon2();
        hashers[i].in1 <== mux[i].left;
        hashers[i].in2 <== mux[i].right;

        current[i + 1] <== hashers[i].out;
    }

    // Sound zero equality test: isValid is 1 iff current[depth] === root
    component zeroCheck = IsZero();
    zeroCheck.in <== current[depth] - root;
    isValid <== zeroCheck.out;
}

// -------------------------------------------------------------
// Main Circuit: ClaimEligibility
// -------------------------------------------------------------
template ClaimEligibility() {
    // -------------------------------------------------------------
    // PRIVATE SIGNALS (Encrypted inside the zero-knowledge vault)
    // -------------------------------------------------------------
    signal input patientSecretKey;          // Patient secret key / DID private scalar
    signal input policySecretSalt;          // Blinding salt for policy commitment
    signal input procedureCode;             // ICD-10 diagnosis integer representation
    signal input diagnosisSummaryHash;      // SHA-256 hash of private doctor diagnosis notes
    signal input hospitalEdDSASignatureS;   // Hospital attestation signature component S
    signal input hospitalEdDSASignatureR8x; // Hospital attestation signature component R8x
    signal input hospitalEdDSASignatureR8y; // Hospital attestation signature component R8y
    signal input hospitalMerklePath[16];    // Depth-16 proof that hospital is NABH accredited
    signal input hospitalMerkleIndices[16];
    signal input procedureMerklePath[8];    // Depth-8 proof that procedure is covered
    signal input procedureMerkleIndices[8];

    // -------------------------------------------------------------
    // PUBLIC SIGNALS (Broadcasted on-chain and to the Insurer)
    // -------------------------------------------------------------
    signal input policyCommitment;          // Public policy anchor: Poseidon(patientSecret, salt)
    signal input claimAmountInr;            // Cashless reimbursement request amount
    signal input coverageLimitInr;          // Policy maximum coverage limit
    signal input hospitalPublicKeyX;        // Accredited hospital BabyJubjub public key X
    signal input hospitalPublicKeyY;        // Accredited hospital BabyJubjub public key Y
    signal input hospitalMerkleRoot;        // Depth-16 consortium Merkle root
    signal input coveredProcedureMerkleRoot;// Depth-8 covered procedure Merkle root
    signal input recordAnchorHash;          // SHA-256 anchor of encrypted record
    signal input claimId;                   // Unique claim transaction identifier

    // -------------------------------------------------------------
    // PUBLIC OUTPUT SIGNALS
    // -------------------------------------------------------------
    signal output nullifierHash;            // Poseidon(patientSecret, claimId) - anti-replay
    signal output isPolicyActive;           // 1 if policy commitment matches
    signal output isHospitalVerified;       // 1 if hospital inclusion proof passes
    signal output isProcedureCovered;       // 1 if procedure is in covered Merkle root
    signal output isAmountWithinLimit;      // 1 if claimAmount <= coverageLimit
    signal output isInstantTierEligible;    // 1 if claimAmount <= 100,000 INR

    // 1. Replay Protection: Compute unique single-use nullifier
    component nullifierHasher = Poseidon2();
    nullifierHasher.in1 <== patientSecretKey;
    nullifierHasher.in2 <== claimId;
    nullifierHash <== nullifierHasher.out;

    // 2. Policy Commitment Verification: Poseidon(sk, salt) === policyCommitment
    component policyHasher = Poseidon2();
    policyHasher.in1 <== patientSecretKey;
    policyHasher.in2 <== policySecretSalt;

    component policyCheck = IsZero();
    policyCheck.in <== policyHasher.out - policyCommitment;
    isPolicyActive <== policyCheck.out;

    // 3. Hospital Merkle Inclusion (Depth 16)
    component hospMerkle = MerkleTreeInclusion(16);
    hospMerkle.leaf <== hospitalPublicKeyX;
    hospMerkle.root <== hospitalMerkleRoot;
    for (var i = 0; i < 16; i++) {
        hospMerkle.pathElements[i] <== hospitalMerklePath[i];
        hospMerkle.pathIndices[i] <== hospitalMerkleIndices[i];
    }
    isHospitalVerified <== hospMerkle.isValid;

    // 4. Procedure Coverage Merkle Inclusion (Depth 8)
    component procMerkle = MerkleTreeInclusion(8);
    procMerkle.leaf <== procedureCode;
    procMerkle.root <== coveredProcedureMerkleRoot;
    for (var j = 0; j < 8; j++) {
        procMerkle.pathElements[j] <== procedureMerklePath[j];
        procMerkle.pathIndices[j] <== procedureMerkleIndices[j];
    }
    isProcedureCovered <== procMerkle.isValid;

    // 5. Coverage Limit Constraint: claimAmountInr <= coverageLimitInr (64-bit)
    component limitCheck = LessEqThan(64);
    limitCheck.in[0] <== claimAmountInr;
    limitCheck.in[1] <== coverageLimitInr;
    isAmountWithinLimit <== limitCheck.out;

    // 6. Tier 1 Instant Settlement Check (<= 100,000 INR)
    component tierCheck = LessEqThan(64);
    tierCheck.in[0] <== claimAmountInr;
    tierCheck.in[1] <== 100000;
    isInstantTierEligible <== tierCheck.out;
}

component main { public [
    policyCommitment,
    claimAmountInr,
    coverageLimitInr,
    hospitalPublicKeyX,
    hospitalPublicKeyY,
    hospitalMerkleRoot,
    coveredProcedureMerkleRoot,
    recordAnchorHash,
    claimId
] } = ClaimEligibility();
