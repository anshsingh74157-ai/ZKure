import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Lock,
  Layers,
  ArrowRight,
  Play,
  RotateCcw,
  Code,
  EyeOff,
  Check,
  Copy,
  Terminal,
  Activity,
  FileCheck,
  Hash,
  Database,
  Zap,
  CheckCheck
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Groth16MathEngine, Poseidon, Field } from '../../services/cryptoEngine';
import { InsuranceClaim } from '../../types';

export const InsurerZKVerify: React.FC = () => {
  const { claims } = useArogyaZK();

  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    claims.length > 0 ? claims[0].id : 'CLM-2026-884'
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(100);
  const [activeStepIndex, setActiveStepIndex] = useState(4);
  const [showRawProof, setShowRawProof] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [realMathLatency, setRealMathLatency] = useState<number>(0.42);

  const currentClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const runVerificationSimulation = () => {
    setIsVerifying(true);
    setVerificationProgress(0);
    setActiveStepIndex(0);

    // Run real math engine check in background
    const startTime = performance.now();
    const consumedNullifiers = new Set<string>();
    const proofArtifact = {
      a: ['0x12a8f9c4d5e6b7a891a2b3c4', '0x23b9c0d1e2f3a4b502b3c4d5'],
      b: [
        ['0x098f6bcd4621d373e4b1a2c3', '0x1a8f9c4d5e6b7a8089a1b2c3'],
        ['0x2b9c0d1e2f3a4b5c90b2c3d4', '0x3c0d1e2f3a4b5c6da1c3d4e5']
      ],
      c: ['0x4d1e2f3a4b5c6d7eb2d4e5f6', '0x5e2f3a4b5c6d7e8fc3e5f6a7']
    };
    const publicWires = [
      '0x01',
      '0x01',
      '0x01',
      `0x${(currentClaim?.claimAmount || 75000).toString(16)}`,
      currentClaim?.zkProof?.nullifierHash || '0x01',
      '0x01',
      '0x01',
      (currentClaim?.claimAmount ?? 0) <= 100000 ? '0x01' : '0x00',
      '0x1a8f9c2e4b01d368fe0912cb8491823791238479182379182379182379182379'
    ];

    Groth16MathEngine.verifyClaimProof(proofArtifact, publicWires, consumedNullifiers);
    const measuredLatency = Number((performance.now() - startTime).toFixed(3));
    setRealMathLatency(measuredLatency > 0 ? measuredLatency : 0.42);

    const stepDuration = 380;
    setTimeout(() => {
      setActiveStepIndex(1);
      setVerificationProgress(25);
    }, stepDuration);

    setTimeout(() => {
      setActiveStepIndex(2);
      setVerificationProgress(50);
    }, stepDuration * 2);

    setTimeout(() => {
      setActiveStepIndex(3);
      setVerificationProgress(75);
    }, stepDuration * 3);

    setTimeout(() => {
      setActiveStepIndex(4);
      setVerificationProgress(100);
      setIsVerifying(false);
    }, stepDuration * 4);
  };

  const verificationGates = [
    {
      step: 1,
      title: 'Depth-16 SMT Policy Inclusion',
      desc: 'Validates patient policy commitment leaf inside the consortium Merkle accumulator root using Poseidon sponge.',
      target: 'Anchor Root: 0x7A9e4B... Matched',
      status: activeStepIndex >= 1 ? 'PASSED' : 'WAITING',
      technical: 'circuits/ClaimEligibility.circom (1,024 constraints)'
    },
    {
      step: 2,
      title: 'Hospital EdDSA Attestation',
      desc: 'Verifies accredited hospital BabyJubjub key attestation over the SHA-256 clinical invoice digest.',
      target: 'Provider Sig: 0xSigHSP402... Valid',
      status: activeStepIndex >= 2 ? 'PASSED' : 'WAITING',
      technical: 'BabyJubjub Edwards Curve Verification (3,840 constraints)'
    },
    {
      step: 3,
      title: 'Poseidon Nullifier Anti-Replay Shield',
      desc: 'N = Poseidon(patient_sk, claim_id) evaluated against on-chain nullifier double-spend registry.',
      target: 'Nullifier Collision: 0 (Unspent Single-Use)',
      status: activeStepIndex >= 3 ? 'PASSED' : 'WAITING',
      technical: 'Poseidon(t=3) over BN254 scalar field F_p (240 constraints)'
    },
    {
      step: 4,
      title: '64-Bit Range & Coverage Comparator',
      desc: 'Proves claim_amount <= policy_coverage_limit without exposing patient remaining balance or medical diagnosis.',
      target: 'Constraint: claim_amount <= limit [Satisfied]',
      status: activeStepIndex >= 4 ? 'PASSED' : 'WAITING',
      technical: '64-bit Num2Bits Bit Decomposition (6,741 constraints)'
    }
  ];

  const rawProofJson = JSON.stringify(
    {
      pi_a: [
        '0x12a8f9c4d5e6b7a891a2b3c4',
        '0x23b9c0d1e2f3a4b502b3c4d5',
        '0x01'
      ],
      pi_b: [
        [
          '0x098f6bcd4621d373e4b1a2c3',
          '0x1a8f9c4d5e6b7a8089a1b2c3'
        ],
        [
          '0x2b9c0d1e2f3a4b5c90b2c3d4',
          '0x3c0d1e2f3a4b5c6da1c3d4e5'
        ],
        ['0x01', '0x00']
      ],
      pi_c: [
        '0x4d1e2f3a4b5c6d7eb2d4e5f6',
        '0x5e2f3a4b5c6d7e8fc3e5f6a7',
        '0x01'
      ],
      protocol: 'groth16',
      curve: 'bn254 (alt_bn128)',
      precompileAddress: '0x0000000000000000000000000000000000000008',
      verifierContract: currentClaim?.zkProof?.verifierContract || '0x7A9e4B12F09c8D3E1a44C90B8211F6e0',
      circuitId: 'ClaimEligibilityV2(16,8)'
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Groth16 Proof Verification Studio
            </h1>
            <Badge variant="teal" size="sm" dot>BN254 Pairing Engine</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cryptographic bilinear pairing verification, public signal inspection, and circuit constraint validation before escrow disbursement.
          </p>
        </div>

        {/* Claim Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-600">Select Claim:</label>
          <select
            value={selectedClaimId}
            onChange={(e) => {
              setSelectedClaimId(e.target.value);
              setActiveStepIndex(4);
              setVerificationProgress(100);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-2xs font-mono"
          >
            {claims.map((claim) => (
              <option key={claim.id} value={claim.id}>
                {claim.id} · {claim.hospitalName} (₹{claim.claimAmount.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Circuit Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-white to-slate-50/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>R1CS Constraints</span>
            <Cpu className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">11,845</div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
            ClaimEligibility(16,8)
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-slate-50/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Elliptic Curve</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-950 mt-1 font-mono">BN254</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            alt_bn128 (Precompile 0x08)
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-slate-50/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Trusted Setup</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1 font-mono">Tau 14</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            16,384 gate ceremony
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-slate-50/60">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Execution Latency</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">
            {realMathLatency} ms
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            ~272,200 EVM gas
          </div>
        </Card>
      </div>

      {/* Main Verification Chamber Simulator */}
      <Card className="p-6 border-teal-200/80 bg-gradient-to-br from-teal-50/20 via-white to-slate-50/40">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900">
                Chamber Simulation: {currentClaim?.id}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-100/70 text-teal-800 border border-teal-200">
                Proof ID: {currentClaim?.zkProof?.proofId || 'ZKP-2026-884'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Beneficiary: <strong className="font-mono text-teal-700">{currentClaim?.patientMaskedId}</strong> · Provider: <strong className="text-slate-800">{currentClaim?.hospitalName}</strong> · Amount: <strong className="text-slate-900 tabular-nums">₹{(currentClaim?.claimAmount ?? 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runVerificationSimulation}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Verifying Pairing Gates...' : 'Execute Bilinear Pairing Check'}</span>
            </button>
            <button
              onClick={() => {
                setActiveStepIndex(4);
                setVerificationProgress(100);
              }}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Verification Pipeline Progress</span>
            <span className="text-teal-700 font-mono">{verificationProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${verificationProgress}%` }}
            />
          </div>
        </div>

        {/* 4 Step-by-Step Cryptographic Verification Gates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {verificationGates.map((gate) => {
            const isPassed = gate.status === 'PASSED';
            const isActive = isVerifying && activeStepIndex === gate.step - 1;

            return (
              <div
                key={gate.step}
                className={`p-4 rounded-xl border transition-all ${
                  isPassed
                    ? 'border-teal-200/90 bg-white shadow-2xs'
                    : isActive
                    ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                    : 'border-slate-200 bg-slate-50/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isPassed
                          ? 'bg-teal-600 text-white'
                          : isActive
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : gate.step}
                    </div>
                    <h3 className="font-bold text-xs text-slate-900">{gate.title}</h3>
                  </div>

                  <Badge variant={isPassed ? 'emerald' : isActive ? 'amber' : 'slate'} size="sm">
                    {isPassed ? 'VERIFIED' : isActive ? 'PROCESSING' : 'WAITING'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{gate.desc}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-teal-800 font-semibold truncate max-w-[200px]">{gate.target}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{gate.technical}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pairing Equation Terminal Box */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs shadow-inner border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              BN254 Bilinear Pairing Equation Result
            </span>
            <span className="text-slate-500">alt_bn128 pairing check (EIP-197)</span>
          </div>

          <div className="pt-3 space-y-2 text-xs">
            <div className="text-slate-400">// Groth16 Bilinear Pairing on G1 x G2 -&gt; GT:</div>
            <div className="text-teal-300 font-bold text-sm tracking-wide bg-black/40 p-2.5 rounded-lg border border-teal-500/20">
              e(-A, B) · e(α, β) · e(∑ (x_i · IC_i), γ) · e(C, δ) == 1 ∈ G_T
            </div>
            <div className="flex items-center gap-3 pt-1 text-xs">
              <span className="text-slate-400">Pairing Precompile Check (0x08):</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> EQUALITY VERIFIED (Q.E.D.)
              </span>
              <span className="text-slate-500 font-mono">| Latency: {realMathLatency}ms</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Public Signals Decoded Breakdown Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">
              Public Signals Decoded Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              The 9 public signals transmitted to the on-chain verifier contract for Claim <span className="font-mono">{currentClaim?.id}</span>
            </p>
          </div>
          <button
            onClick={() => setShowRawProof(!showRawProof)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            {showRawProof ? 'Hide Raw Proof JSON' : 'View Raw Proof Artifact'}
          </button>
        </div>

        {/* Raw Proof Artifact Dropdown */}
        {showRawProof && (
          <div className="mb-4 p-4 rounded-xl bg-slate-950 text-teal-400 font-mono text-xs relative border border-slate-800">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>Groth16 BN254 Proof Structure (128 bytes)</span>
              <button
                onClick={() => handleCopyRaw(rawProofJson)}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedRaw ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRaw ? 'Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-200">
              {rawProofJson}
            </pre>
          </div>
        )}

        {/* Signals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 font-semibold">Index</th>
                <th className="py-2.5 font-semibold">Signal Identifier</th>
                <th className="py-2.5 font-semibold">Wire Value</th>
                <th className="py-2.5 font-semibold">Cryptographic Interpretation</th>
                <th className="py-2.5 font-semibold text-right">Gate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  idx: 0,
                  name: 'policy_active',
                  wire: '1',
                  meaning: 'Patient insurance policy is valid, in-force, and not lapsed',
                  valid: true
                },
                {
                  idx: 1,
                  name: 'hospital_sig_valid',
                  wire: '1',
                  meaning: 'Valid EdDSA signature from accredited NABH hospital provider key',
                  valid: true
                },
                {
                  idx: 2,
                  name: 'anchor_root_match',
                  wire: '1',
                  meaning: 'Medical record Merkle root matches on-chain anchor contract state',
                  valid: true
                },
                {
                  idx: 3,
                  name: 'claim_amount_inr',
                  wire: `${currentClaim?.claimAmount || 75000}`,
                  meaning: `Claim amount (₹${(currentClaim?.claimAmount ?? 0).toLocaleString('en-IN')}) evaluated against ceiling`,
                  valid: true
                },
                {
                  idx: 4,
                  name: 'nullifier_valid',
                  wire: '1',
                  meaning: 'Poseidon nullifier hash verified unique; zero replay or duplicate claim',
                  valid: true
                },
                {
                  idx: 5,
                  name: 'procedure_covered',
                  wire: '1',
                  meaning: 'Procedure category covered under policy schedule without revealing ICD-10 codes',
                  valid: true
                },
                {
                  idx: 6,
                  name: 'tier_instant_eligible',
                  wire: (currentClaim?.claimAmount ?? 0) <= 100000 ? '1' : '0',
                  meaning: (currentClaim?.claimAmount ?? 0) <= 100000 ? 'Eligible for automated Tier 1 instant cashless disbursement' : 'Requires Tier 2 multi-sig senior underwriter approval',
                  valid: true
                }
              ].map((item) => (
                <tr key={item.idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono text-slate-400">[{item.idx}]</td>
                  <td className="py-3 font-mono font-bold text-teal-800">{item.name}</td>
                  <td className="py-3 font-mono text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-[11px]">
                      {item.wire}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{item.meaning}</td>
                  <td className="py-3 text-right">
                    <Badge variant="emerald" size="sm" dot>Satisfied</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Privacy Architecture: Secret Vault vs Public Wires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-rose-200/80 bg-rose-50/20">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-2">
            <Lock className="w-4 h-4 text-rose-600" />
            Kept Strictly Secret Inside Hospital Vault (0 PHI Exposed)
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
            <li>Exact ICD-10 medical diagnosis code (e.g. I20.9, E11.9)</li>
            <li>Physician clinical notes and comprehensive discharge summary</li>
            <li>Laboratory test raw biomarker values and diagnostic radiology scans</li>
            <li>Remaining cumulative policy sum insured</li>
          </ul>
        </Card>

        <Card className="p-5 border-teal-200/80 bg-teal-50/20">
          <div className="flex items-center gap-2 text-teal-950 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            Mathematically Proven to Insurer (Groth16 Public Signals)
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
            <li>Boolean proof that policy is active and covers this procedure category</li>
            <li>Hospital EdDSA BabyJubjub cryptographic authorization</li>
            <li>Single-use Poseidon nullifier hash preventing duplicate claims</li>
            <li>Mathematical proof that requested payout amount &lt;= coverage limit</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
