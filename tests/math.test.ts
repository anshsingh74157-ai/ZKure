import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Field,
  Poseidon,
  BabyJubjub,
  SparseMerkleTree,
  ShamirSecretSharing,
  Groth16MathEngine,
  FIELD_PRIME,
  SUBGROUP_ORDER,
  BJJ_G,
  BJJ_H
} from '../server/crypto/mathEngine.js';

test('Galois Field F_p arithmetic operations are sound and normalized', () => {
  // Modular addition
  assert.equal(Field.add(10n, 20n), 30n);
  assert.equal(Field.add(-5n, 2n), Field.p - 3n);
  assert.ok(Field.add(-5n, 2n) >= 0n && Field.add(-5n, 2n) < Field.p);

  // Modular subtraction
  assert.equal(Field.sub(20n, 10n), 10n);
  assert.equal(Field.sub(5n, 10n), Field.p - 5n);

  // Modular multiplication
  assert.equal(Field.mul(6n, 7n), 42n);
  assert.equal(Field.mul(-2n, 3n), Field.p - 6n);
  assert.ok(Field.mul(-2n, 3n) >= 0n && Field.mul(-2n, 3n) < Field.p);

  // Fermat's Little Theorem Modular Inverse
  const a = 12345678901234567890n;
  const aInv = Field.inv(a);
  assert.equal(Field.mul(a, aInv), 1n, 'a * a^(-1) must equal 1 mod p');

  // Modular exponentiation with negative power
  const aInvViaExp = Field.exp(a, -1n);
  assert.equal(aInvViaExp, aInv);

  // Hex conversion with and without 0x prefix
  const hexWith0x = '0x1234abcd';
  const hexWithout0x = '1234abcd';
  assert.equal(Field.fromHex(hexWith0x), Field.fromHex(hexWithout0x));
  assert.equal(Field.fromHex('0x00'), 0n);
});

test('BabyJubjub curve parameters and generators are on-curve', () => {
  // G is on curve
  assert.equal(BabyJubjub.isOnCurve(BabyJubjub.G), true, 'Canonical generator G must be on the curve');

  // H (Base8) is on curve
  assert.equal(BabyJubjub.isOnCurve(BabyJubjub.H), true, 'Base8 generator H must be on the curve');

  // Identity element is (0, 1)
  const identity = { x: 0n, y: 1n };
  assert.equal(BabyJubjub.isOnCurve(identity), true);

  // G + Identity = G
  const gPlusId = BabyJubjub.add(BabyJubjub.G, identity);
  assert.equal(gPlusId.x, BabyJubjub.G.x);
  assert.equal(gPlusId.y, BabyJubjub.G.y);

  // Scalar multiplication: [1]G = G, [0]G = Identity
  const gMul1 = BabyJubjub.mul(BabyJubjub.G, 1n);
  assert.equal(gMul1.x, BabyJubjub.G.x);
  assert.equal(gMul1.y, BabyJubjub.G.y);

  const gMul0 = BabyJubjub.mul(BabyJubjub.G, 0n);
  assert.equal(gMul0.x, 0n);
  assert.equal(gMul0.y, 1n);

  // [-1]G = -G = (-Gx, Gy)
  const gMulNeg1 = BabyJubjub.mul(BabyJubjub.G, -1n);
  const negG = BabyJubjub.neg(BabyJubjub.G);
  assert.equal(gMulNeg1.x, negG.x);
  assert.equal(gMulNeg1.y, negG.y);

  // G + (-G) = Identity (0, 1)
  const gPlusNegG = BabyJubjub.add(BabyJubjub.G, negG);
  assert.equal(gPlusNegG.x, 0n);
  assert.equal(gPlusNegG.y, 1n);

  // Pedersen commitment C = [v]G + [r]H is on curve and deterministic
  const commit1 = BabyJubjub.pedersenCommit(500000n, 12345n);
  const commit2 = BabyJubjub.pedersenCommit(500000n, 12345n);
  assert.equal(commit1.commitmentHex, commit2.commitmentHex);
  assert.equal(BabyJubjub.isOnCurve(commit1.point), true);
});

test('Poseidon sponge hash satisfies collision resistance and deterministic properties', () => {
  const in1 = 42n;
  const in2 = 99n;
  const hash = Poseidon.hash2(in1, in2);

  // Determinism
  assert.equal(Poseidon.hash2(in1, in2), hash);

  // Non-zero and in F_p
  assert.ok(hash > 0n && hash < Field.p);

  // Avalanche effect: small change causes completely different output
  const hashSlightDiff = Poseidon.hash2(in1 + 1n, in2);
  assert.notEqual(hash, hashSlightDiff);

  // Nullifier computation
  const sk = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const claimId = 'CLM-90124';
  const nullifier1 = Poseidon.computeNullifier(sk, claimId);
  const nullifier2 = Poseidon.computeNullifier(sk, claimId);
  assert.equal(nullifier1, nullifier2);
  assert.notEqual(nullifier1, Poseidon.computeNullifier(sk, 'CLM-90125'));
});

test('Depth-16 Sparse Merkle Tree generates and verifies valid inclusion proofs', () => {
  const smt = new SparseMerkleTree(16);
  const initialRoot = smt.getRoot();
  assert.match(initialRoot, /^0x[a-f0-9]{64}$/i);

  // Insert leaf at index 14 (Hospital #14)
  const leaf14 = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  smt.insert(14, leaf14);
  const updatedRoot = smt.getRoot();
  assert.notEqual(initialRoot, updatedRoot);

  // Proof generation
  const proof = smt.generateProof(14);
  assert.equal(proof.leafIndex, 14);
  assert.equal(proof.siblings.length, 16);
  assert.equal(proof.pathIndices.length, 16);
  assert.equal(proof.isValid, true);

  // Tampered leaf fails verification
  const fakeLeaf = '0x1111111111111111111111111111111111111111111111111111111111111111';
  assert.equal(SparseMerkleTree.verifyProof(fakeLeaf, proof.root, proof.siblings, proof.pathIndices), false);
});

test('Shamir Secret Sharing (2-of-3) splits and reconstructs secrets with tamper detection', () => {
  const rawSecret = BigInt('0xdeadbeefcafebabe1234567890abcdefdeadbeefcafebabe1234567890abcdef');
  const secret = Field.toHex(rawSecret);
  const shares = ShamirSecretSharing.split(secret, 2, 3);
  assert.equal(shares.length, 3);

  // Reconstruct from shares (1, 2)
  const reconstructed12 = ShamirSecretSharing.reconstruct([shares[0], shares[1]]);
  assert.equal(reconstructed12.toLowerCase(), secret.toLowerCase());

  // Reconstruct from shares (2, 3)
  const reconstructed23 = ShamirSecretSharing.reconstruct([shares[1], shares[2]]);
  assert.equal(reconstructed23.toLowerCase(), secret.toLowerCase());

  // Reconstruct from shares (1, 3)
  const reconstructed13 = ShamirSecretSharing.reconstruct([shares[0], shares[2]]);
  assert.equal(reconstructed13.toLowerCase(), secret.toLowerCase());

  // Duplicate shares must throw
  assert.throws(() => {
    ShamirSecretSharing.reconstruct([shares[0], shares[0]]);
  }, /Duplicate guardian share index/);

  // Tampered share commitment must throw
  const tamperedShare = {
    ...shares[0],
    shareCommitment: '0x1111111111111111111111111111111111111111111111111111111111111111'
  };
  assert.throws(() => {
    ShamirSecretSharing.reconstruct([tamperedShare, shares[1]]);
  }, /Tampered Shamir share commitment detected/);
});

test('Groth16 verifier telemetry validates public inputs and nullifier collisions', () => {
  const proofPoints = {
    a: ['0x01', '0x02'],
    b: [['0x03', '0x04'], ['0x05', '0x06']],
    c: ['0x07', '0x08']
  };

  const validPublicSignals = [
    '0x01', // isPolicyActive
    '0x01', // isHospitalVerified
    '0x01', // anchor_root_match
    '0x0f4240', // claim_amount_inr (1,000,000 INR)
    '0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff', // nullifier
    '0x01', // procedure_covered
    '0x01', // amount_within_limit
    '0x00', // instant_tier_eligible
    '0x1234' // merkle_root
  ];

  const consumed = new Set<string>();
  const res = Groth16MathEngine.verifyClaimProof(proofPoints, validPublicSignals, consumed);
  assert.equal(res.verified, true);
  assert.equal(res.nullifierCollision, false);
  assert.equal(res.publicInputsValid, true);

  // Nullifier collision must fail verification
  consumed.add(validPublicSignals[4]);
  const resCollision = Groth16MathEngine.verifyClaimProof(proofPoints, validPublicSignals, consumed);
  assert.equal(resCollision.verified, false);
  assert.equal(resCollision.nullifierCollision, true);
});

test('Groth16 verifier handles string boolean wire signals with equality prefixes', () => {
  const proofPoints = {
    a: ['0x01', '0x02'],
    b: [['0x03', '0x04'], ['0x05', '0x06']],
    c: ['0x07', '0x08']
  };

  const stringSignals = [
    'policy_active=1',
    'hospital_sig_valid=1',
    'anchor_root_match=1',
    'claim_amount_inr=75000',
    '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
    'procedure_covered=1',
    'amount_within_limit=1',
    'instant_tier_eligible=1',
    'hospital_merkle_root=0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK'
  ];

  const consumed = new Set<string>();
  const res = Groth16MathEngine.verifyClaimProof(proofPoints, stringSignals, consumed);
  assert.equal(res.verified, true);
  assert.equal(res.publicInputsValid, true);
  assert.equal(res.scalarFieldBoundValid, true);
  assert.equal(res.nullifierCollision, false);

  // Variations: "true", "0x01", "1", "instant_tier_eligible=0"
  const variationSignals = [
    'true',
    '0x01',
    '1',
    'claim_amount_inr=150000',
    '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890',
    'true',
    '1',
    'instant_tier_eligible=0',
    '0x7A9e4B12F09c8D3E1a44C90B8211F6e0AroGyaZK'
  ];
  const resVar = Groth16MathEngine.verifyClaimProof(proofPoints, variationSignals, new Set());
  assert.equal(resVar.verified, true);
  assert.equal(resVar.publicInputsValid, true);
  assert.equal(resVar.publicWires.length, 9);
  assert.equal(resVar.publicWires[0].name, 'policy_active');
  assert.equal(resVar.publicWires[1].name, 'hospital_sig_valid');
  assert.equal(resVar.publicWires[2].name, 'anchor_root_match');
  assert.equal(resVar.publicWires[3].name, 'claim_amount_inr');
  assert.equal(resVar.publicWires[4].name, 'nullifier_valid');
  assert.equal(resVar.publicWires[5].name, 'procedure_covered');
  assert.equal(resVar.publicWires[6].name, 'amount_within_limit');
  assert.equal(resVar.publicWires[7].name, 'instant_tier_eligible');
  assert.equal(resVar.publicWires[8].name, 'nabh_merkle_root');

  // Failing boolean constraint (e.g. policy_active=0)
  const failingSignals = [...stringSignals];
  failingSignals[0] = 'policy_active=0';
  const resFail = Groth16MathEngine.verifyClaimProof(proofPoints, failingSignals, new Set());
  assert.equal(resFail.verified, false);
  assert.equal(resFail.publicInputsValid, false);
  assert.equal(resFail.publicWires[0].meetsConstraint, false);
});

test('Groth16 verifier telemetry performs fast pairing verification check', () => {
  const validProof = {
    pi_a: ['0x12a9', '0x23b8'],
    pi_b: [['0x34c9', '0x45da'], ['0x56eb', '0x67fc']],
    pi_c: ['0x78ad', '0x89be']
  };
  const signals = ['0x01', '0x02', '0x03'];
  const res = Groth16MathEngine.verifyClaimPairing(validProof, signals);
  assert.equal(res.verified, true);
  assert.ok(res.latencyMs >= 0);

  const invalidProof = {
    pi_a: ['0x12a9'], // missing point
    pi_b: [['0x34c9', '0x45da'], ['0x56eb', '0x67fc']],
    pi_c: ['0x78ad', '0x89be']
  };
  const resInvalid = Groth16MathEngine.verifyClaimPairing(invalidProof, signals);
  assert.equal(resInvalid.verified, false);
});
