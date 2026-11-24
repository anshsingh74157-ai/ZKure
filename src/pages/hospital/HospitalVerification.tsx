import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  KeyRound,
  FileCheck2,
  Lock,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  ArrowRight,
  Terminal,
  FileText,
  Building2,
  Coins,
  AlertCircle,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Groth16MathEngine, BabyJubjub } from '../../services/cryptoEngine';

export const HospitalVerification: React.FC = () => {
  const { userLinkedId, hospitals, records } = useArogyaZK();
  const currentHospitalId = userLinkedId || 'HSP-402';
  const currentHospital = hospitals.find((h) => h.id === currentHospitalId) || {
    id: currentHospitalId,
    name: 'Apollo Spectra Hospital'
  };

  const [selectedPatientId, setSelectedPatientId] = useState('PAT-9041');
  const [selectedProcedure, setSelectedProcedure] = useState('ICD-10: K35.80 (Acute Laparoscopic Appendectomy)');
  const [simulatedAmount, setSimulatedAmount] = useState<number>(64000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simResult, setSimResult] = useState<any | null>(null);

  const sampleProcedures = [
    {
      code: 'ICD-10: K35.80 (Acute Laparoscopic Appendectomy)',
      dept: 'General & Gastrointestinal Surgery',
      typicalCost: 64000,
      tier: 'Tier 1 (Instant <= 1L)'
    },
    {
      code: 'ICD-10: H26.9 (Phacoemulsification Cataract Extraction)',
      dept: 'Ophthalmology',
      typicalCost: 38000,
      tier: 'Tier 1 (Instant <= 1L)'
    },
    {
      code: 'ICD-10: I25.10 (Percutaneous Coronary Intervention / Stent)',
      dept: 'Interventional Cardiology',
      typicalCost: 185000,
      tier: 'Tier 2 (Adjudicated > 1L)'
    }
  ];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setSimResult(null);

    setTimeout(() => {
      setSimulationStep(2);
      setTimeout(() => {
        setSimulationStep(3);
        setTimeout(() => {
          setSimulationStep(4);
          setTimeout(() => {
            setSimulationStep(5);
            // Execute real BN254 mathematical verification check via Groth16MathEngine
            const mathVerify = Groth16MathEngine.verifyClaimPairing(
              {
                pi_a: ['0x12a9', '0x23b8'],
                pi_b: [['0x34c9', '0x45da'], ['0x56eb', '0x67fc']],
                pi_c: ['0x78ad', '0x89be']
              },
              [
                '0x7f2a89c4d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
                '0x0000000000000000000000000000000000000000000000000000000000000001',
                `0x${simulatedAmount.toString(16).padStart(64, '0')}`,
                '0x3d91f28b2489c091',
                '0xApolloHsp402B419e782C9012F48'
              ]
            );

            setSimResult({
              proofId: `ZKP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              protocol: 'Groth16 (BN254 Elliptic Curve)',
              circuitConstraints: 11845,
              powersOfTau: 'pot14_final.ptau',
              nullifierHash: '0x7f2a89c4d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
              hospitalEdDsaSignature: '0x992b419ef0a88b12...c771a9e',
              publicSignals: [
                '0x7f2a89c4d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
                '0x0000000000000000000000000000000000000000000000000000000000000001',
                `0x${simulatedAmount.toString(16).padStart(64, '0')}`,
                '0x3d91f28b...e4a1',
                '0xApolloHsp402B419e782C9012F48'
              ],
              groth16Proof: {
                pi_a: [
                  '0x12a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
                  '0x23b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
                  '0x01'
                ],
                pi_b: [
                  [
                    '0x34c9d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
                    '0x45dae6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5'
                  ],
                  [
                    '0x56ebf7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
                    '0x67fca8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7'
                  ]
                ],
                pi_c: [
                  '0x78adb9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
                  '0x89bec0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
                  '0x01'
                ]
              },
              checks: {
                pairingValid: mathVerify.verified,
                policyEligibility: true,
                hospitalAccreditation: true,
                vaultRecordAnchor: true,
                nullifierUnique: true
              },
              verifiedOnChain: true,
              contractAddress: '0xClaimSettlement4B12F09c8D3E1a44C90B8211F6e0',
              gasEstimate: '268,400 gas (Groth16 Pairing)'
            });
            setIsSimulating(false);
          }, 450);
        }, 450);
      }, 450);
    }, 450);
  };

  const signalsComparison = [
    {
      field: 'Patient Identity & ABHA ID',
      hospitalSees: 'Rohan Sharma (ABHA: 91-8402-9182-3819)',
      insurerSees: 'Poseidon Nullifier Hash (0x7f2a89...)',
      privacyStatus: 'Zero PHI Disclosed',
      isSecret: true
    },
    {
      field: 'Clinical Diagnosis / Notes',
      hospitalSees: 'ICD-10 K35.80 (Acute Appendicitis with Local Peritonitis)',
      insurerSees: 'Boolean Verification Signal: is_covered = 1',
      privacyStatus: 'Zero Diagnosis Disclosed',
      isSecret: true
    },
    {
      field: 'Medical Record Raw Content',
      hospitalSees: 'Full Operative Pathology & Ultrasound Imaging',
      insurerSees: 'SHA-256 Digest Anchor (0x8c20f9...) on HealthVault',
      privacyStatus: 'Zero Medical Text Disclosed',
      isSecret: true
    },
    {
      field: 'Hospital Credentials',
      hospitalSees: `${currentHospital.name} (${currentHospitalId})`,
      insurerSees: 'NABH Merkle Tree Root (Depth 16) + Verified EdDSA Sig',
      privacyStatus: 'Cryptographically Verified',
      isSecret: false
    },
    {
      field: 'Claim Billed Amount',
      hospitalSees: `₹${simulatedAmount.toLocaleString('en-IN')}`,
      insurerSees: `₹${simulatedAmount.toLocaleString('en-IN')} (Within Limit Constraint)`,
      privacyStatus: 'Public Signal',
      isSecret: false
    },
    {
      field: 'Settlement Payout Address',
      hospitalSees: '0xApolloHsp402B419e782C9012F48',
      insurerSees: '0xApolloHsp402B419e782C9012F48',
      privacyStatus: 'Public Signal (Direct Transfer)',
      isSecret: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Zero-Knowledge Claim Attestation & Simulator
            </h1>
            <Badge variant="teal" dot>Dual-Key Groth16</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Cryptographic proof engine for hospital attestations: proving policy coverage and medical anchor integrity without disclosing patient PHI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Circuit: ClaimEligibility.circom</Badge>
          <Badge variant="purple">BN254 Curve</Badge>
        </div>
      </div>

      {/* Visual Breakdown of Dual-Key Attestation */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            The Dual-Key Attestation Mechanism
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-3xl">
          Claims cannot be generated unilaterally by either party. A valid claim requires two cryptographic witnesses synthesized simultaneously inside the Groth16 circuit:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key 1: Patient */}
          <div className="p-4 rounded-xl border border-sky-200/80 bg-sky-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-sky-100 text-sky-800">
                <KeyRound className="w-4 h-4" />
              </span>
              <Badge variant="blue">Key 1: Patient</Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Patient Scoped Consent Token</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Patient signs an ephemeral authorization granting the hospital permission to attest records without relinquishing permanent ownership or decryption secrets.
              </p>
            </div>
            <div className="pt-2 border-t border-sky-100/80 font-mono text-[10px] text-sky-900 space-y-1">
              <div>• Signature: ECDSA / secp256k1</div>
              <div>• Bounded Expiry: 12 Hours</div>
              <div>• Target: HSP-402 (Apollo)</div>
            </div>
          </div>

          {/* Key 2: Hospital */}
          <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <Badge variant="teal">Key 2: Hospital</Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Hospital EdDSA Attestation</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Hospital attending doctor evaluates the patient in-vault and signs the SHA-256 diagnosis digest using their BabyJubjub accredited signing key.
              </p>
            </div>
            <div className="pt-2 border-t border-teal-100/80 font-mono text-[10px] text-teal-900 space-y-1">
              <div>• Signature: EdDSA BabyJubjub</div>
              <div>• Digest: SHA-256(Record + Bill)</div>
              <div>• Merkle Root: NABH Depth-16</div>
            </div>
          </div>

          {/* Synthesis: Groth16 Prover */}
          <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                <Cpu className="w-4 h-4" />
              </span>
              <Badge variant="indigo">Synthesis Circuit</Badge>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Groth16 Zero-Knowledge Prover</h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Merges both signatures with the policy commitment. Strips all personal health details and outputs a verifiable SNARK proof for instant settlement.
              </p>
            </div>
            <div className="pt-2 border-t border-indigo-100/80 font-mono text-[10px] text-indigo-900 space-y-1">
              <div>• Constraints: 11,845 R1CS</div>
              <div>• Prover Time: ~1.4 Seconds</div>
              <div>• Zero PHI Leaked to Insurer</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Cryptographic Simulator */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Interactive Attestation Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate in-browser execution of the zero-knowledge claim generation pipeline
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {isSimulating ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" /> Simulating Groth16 Prover...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Attestation & Generate Proof
              </>
            )}
          </button>
        </div>

        {/* Simulator Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Patient Under Care:
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="PAT-9041">Rohan Sharma (PAT-9041) • Star Shield</option>
              <option value="PAT-9042">Ananya Iyer (PAT-9042) • Care Health</option>
              <option value="PAT-9043">Vikram Malhotra (PAT-9043) • HDFC ERGO</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clinical Procedure / Attestation:
            </label>
            <select
              value={selectedProcedure}
              onChange={(e) => {
                setSelectedProcedure(e.target.value);
                const match = sampleProcedures.find((p) => p.code === e.target.value);
                if (match) setSimulatedAmount(match.typicalCost);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-teal-500"
            >
              {sampleProcedures.map((proc) => (
                <option key={proc.code} value={proc.code}>
                  {proc.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Claim Amount (INR):
            </label>
            <input
              type="number"
              value={simulatedAmount}
              onChange={(e) => setSimulatedAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Pipeline Execution Tracker */}
        {(isSimulating || simResult) && (
          <div className="mb-6 p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Cryptographic Execution Pipeline</span>
              {simResult && (
                <span className="text-teal-700 text-xs font-semibold flex items-center gap-1 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pipeline Completed Successfully (1.8s)
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              {[
                { s: 1, label: 'Record SHA-256 Digest' },
                { s: 2, label: 'EdDSA Hospital Signature' },
                { s: 3, label: 'Poseidon Nullifier' },
                { s: 4, label: '11k R1CS Constraints' },
                { s: 5, label: 'Groth16 SNARK Synthesis' }
              ].map((stepObj) => {
                const isPassed = simulationStep > stepObj.s || simResult;
                const isCurrent = simulationStep === stepObj.s && !simResult;

                return (
                  <div
                    key={stepObj.s}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      isPassed
                        ? 'border-teal-300 bg-teal-50/80 text-teal-900'
                        : isCurrent
                        ? 'border-teal-500 bg-white ring-2 ring-teal-500 text-teal-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                      Stage {stepObj.s}
                    </div>
                    <div className="text-[11px] font-semibold truncate">{stepObj.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulation Output Telemetry */}
        {simResult && (
          <div className="p-4 rounded-xl border border-teal-500/30 bg-[#090D16] text-white space-y-3 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-teal-300">
                  Proof Verified: {simResult.proofId}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">
                Ready for on-chain dispatch to ClaimSettlement.sol
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-sans block text-[11px]">
                  Generated Groth16 Public Signals:
                </span>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-teal-300 break-all space-y-1">
                  <div>[0] Nullifier: {simResult.publicSignals[0]}</div>
                  <div>[1] Procedure Covered: {simResult.publicSignals[1]}</div>
                  <div>[2] Claim Amount: {simResult.publicSignals[2]} (INR {simulatedAmount})</div>
                  <div>[3] Hospital Merkle Root: {simResult.publicSignals[3]}</div>
                  <div>[4] Payout Address: {simResult.publicSignals[4]}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-sans block text-[11px]">
                  Proof Points (pi_a, pi_b, pi_c on BN254):
                </span>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-sky-300 break-all space-y-1">
                  <div>pi_a[0]: {simResult.groth16Proof.pi_a[0].slice(0, 32)}...</div>
                  <div>pi_b[0][0]: {simResult.groth16Proof.pi_b[0][0].slice(0, 32)}...</div>
                  <div>pi_c[0]: {simResult.groth16Proof.pi_c[0].slice(0, 32)}...</div>
                  <div className="text-slate-400 pt-1.5 border-t border-slate-800 font-sans text-[10px]">
                    Gas Estimate: {simResult.gasEstimate} • Contract: {simResult.contractAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Public Signals vs Secret Vault Data Comparison Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              What Insurer Sees vs What Remains Secret in Hospital Vault
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic audit of information boundaries enforced by the ZKure circuit
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Data Attribute</th>
                <th className="py-3 px-4 text-slate-700">Hospital Internal Vault</th>
                <th className="py-3 px-4 text-teal-700">What Insurer Discovers</th>
                <th className="py-3 px-4 text-right">Privacy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signalsComparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.field}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 text-[11px] max-w-[240px] truncate">
                    {row.hospitalSees}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-900 text-[11px] max-w-[240px] truncate">
                    {row.insurerSees}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={row.isSecret ? 'teal' : 'navy'}>
                      {row.isSecret ? (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3 text-teal-600" /> {row.privacyStatus}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-600" /> {row.privacyStatus}
                        </span>
                      )}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
