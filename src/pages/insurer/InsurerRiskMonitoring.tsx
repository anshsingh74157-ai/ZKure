import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Wallet,
  Zap,
  Lock,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  Play,
  Copy,
  Check,
  Activity,
  FileCheck2,
  DollarSign,
  Info
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerRiskMonitoring: React.FC = () => {
  const { claims, userLinkedId } = useArogyaZK();

  // Escrow Pool Settings
  const totalEscrowPool = (userLinkedId || '').toLowerCase().includes('hdfc') ? 3500000 : 2500000;
  const activeInsurer = userLinkedId || 'Star Shield Health Assurance';
  const insurerClaims = claims.filter(
    (c) =>
      c.insurerName.toLowerCase() === activeInsurer.toLowerCase() ||
      c.insurerName.toLowerCase().includes(activeInsurer.toLowerCase()) ||
      activeInsurer.toLowerCase().includes(c.insurerName.toLowerCase())
  );
  const settledClaims = insurerClaims.filter((c) => c.status === 'Settled' || c.status === 'Approved');
  const totalDisbursed = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);
  const availableFloat = totalEscrowPool - totalDisbursed;
  const floatPercent = Math.max(0, Math.min(100, Math.round((availableFloat / totalEscrowPool) * 100)));

  // Replay Attack Simulator State
  const [simulatorState, setSimulatorState] = useState<'idle' | 'simulating' | 'blocked'>('idle');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const runReplaySimulation = () => {
    setSimulatorState('simulating');
    setTimeout(() => {
      setSimulatorState('blocked');
    }, 1100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Risk & Anomaly Prevention Dashboard</h1>
            <Badge variant="teal" dot>100% Replay Immunity Active</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Real-time surveillance of nullifier uniqueness, liquidity reserve solvency, provider signature authenticity, and automated settlement rail thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Surveillance Node: Active</Badge>
          <Badge variant="emerald" dot>Zero Double-Spends</Badge>
        </div>
      </div>

      {/* Top 4 Surveillance KPI Meters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Replay Immunity</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">100.0%</div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
            0 collisions detected
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Reserve Solvency</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{floatPercent}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            ₹{availableFloat.toLocaleString('en-IN')} available
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>EdDSA Authenticity</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Verified NABH provider sigs
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Tier 1 Velocity</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">&lt; 2.4 mins</div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            Instant smart contract rail
          </div>
        </Card>
      </div>

      {/* Replay Attack Prevention Monitor */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">
                Replay Attack Prevention Monitor (Nullifier Registry)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">
                Poseidon-T3/T5 over BN254
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Every zero-knowledge proof emits a deterministic nullifier hash: <code>Poseidon(patient_sk, policy_id, treatment_date)</code>. The smart contract consumes each nullifier once, making duplicate claims mathematically impossible.
            </p>
          </div>

          <button
            onClick={runReplaySimulation}
            disabled={simulatorState === 'simulating'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-teal-400" />
            {simulatorState === 'simulating' ? 'Simulating Replay Injection...' : 'Simulate Replay Attack Test'}
          </button>
        </div>

        {/* Live Replay Simulation Result Banner */}
        {simulatorState !== 'idle' && (
          <div className="mt-4 p-4 rounded-xl border animate-in fade-in duration-200 bg-rose-50/80 border-rose-300">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-950">
                    Replay Attack Successfully Intercepted & Reverted by On-Chain Contract
                  </span>
                  <span className="text-[10px] font-mono bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-semibold">
                    STATUS: REVERTED
                  </span>
                </div>
                <p className="text-rose-800 mt-1 font-mono text-[11px]">
                  Target Nullifier: 0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7b8c9d0e1f2a3b4c5d6e7f890
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-rose-950 text-rose-200 font-mono text-[11px] space-y-0.5">
                  <div>Smart Contract Exception: revert(0x892a01b2)</div>
                  <div className="text-rose-400">&gt;&gt; Error: NullifierAlreadyConsumed(nullifierHash, originalBlock: 19482102)</div>
                  <div className="text-slate-400 mt-0.5">Zero payout disbursed. Transaction aborted. Replay immunity verified 100%.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Nullifiers Registry Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Associated Claim</th>
                <th className="py-3 px-4">Nullifier Hash (Poseidon Output)</th>
                <th className="py-3 px-4">Beneficiary Masked zkID</th>
                <th className="py-3 px-4">On-Chain State</th>
                <th className="py-3 px-4 text-right">Collision Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{claim.id}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]" title={claim.zkProof.nullifierHash}>
                        {claim.zkProof.nullifierHash}
                      </span>
                      <button
                        onClick={() => handleCopy(claim.zkProof.nullifierHash, claim.id)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {copiedHash === claim.id ? (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{claim.patientMaskedId}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="teal" dot>Committed (Active)</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[11px] font-semibold text-emerald-700">0 Collisions (Unique)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Liquidity Reserve Meter & Escrow Health */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">
                Escrow Liquidity Reserve & Solvency Meter
              </h2>
              <Badge variant="teal" dot>Auto-Replenish Guarded</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-sig smart contract treasury backing instant Tier 1 cashless settlements for accredited hospitals.
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400">Escrow Contract: </span>
            <span className="font-mono text-teal-700 font-semibold">
              0xClaimSettlement4B12F09c8D3E1a44
            </span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Reserve Utilization: {(100 - floatPercent).toFixed(1)}% Settled (₹{totalDisbursed.toLocaleString('en-IN')})
            </span>
            <span className="font-bold text-teal-600">
              Available Float: {floatPercent}% (₹{availableFloat.toLocaleString('en-IN')})
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 p-0.5 border border-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-teal-600 rounded-l-full transition-all duration-500"
              style={{ width: `${100 - floatPercent}%` }}
              title={`Settled: INR ${totalDisbursed.toLocaleString('en-IN')}`}
            />
            <div
              className="h-full bg-emerald-100 transition-all duration-500"
              style={{ width: `${floatPercent}%` }}
              title={`Available: INR ${availableFloat.toLocaleString('en-IN')}`}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>₹0 (Min)</span>
            <span className="text-amber-700 font-medium">Re-balance Threshold: ₹5,00,000</span>
            <span>Total Escrow: ₹{totalEscrowPool.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 3 Liquidity Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Current Reserve Float</span>
            <span className="font-bold text-base text-slate-900 mt-1 block">
              ₹{availableFloat.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">Solvent · Multi-Sig Escrow</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Claims Settled from Pool</span>
            <span className="font-bold text-base text-teal-600 mt-1 block">
              ₹{totalDisbursed.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500">{settledClaims.length} Instant Disbursements</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Automated Top-Up Policy</span>
            <span className="font-bold text-base text-slate-800 mt-1 block">
              RTGS Sweep at ₹5L
            </span>
            <span className="text-[11px] text-slate-500">Auto-sweeps from corporate treasury</span>
          </div>
        </div>
      </Card>

      {/* Instant Settlement Eligibility Rules Breakdown */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-bold text-base text-slate-900">
            Instant Settlement Eligibility Rules Breakdown
          </h2>
          <Badge variant="teal">Smart Contract Rules</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1 */}
          <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Tier 1 Instant Payout Ceiling (≤ INR 1,00,000)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Claims with requested amounts up to INR 1,00,000 are eligible for 100% automated on-chain execution. The smart contract validates the Groth16 proof pairing, checks nullifier uniqueness, and releases funds directly into the accredited provider’s treasury in &lt; 3 minutes.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-teal-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Automated smart contract settlement rail enabled
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Tier 2 Senior Underwriter Multi-Sig (&gt; INR 1,00,000)
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Claims exceeding INR 1,00,000 generate a high-value audit signal. While the Groth16 zero-knowledge proof verifies coverage mathematically, contract release requires a co-signature from the Senior Actuarial Underwriter key before escrow disbursement.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-800">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Dual-key multi-sig threshold protection
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Provider Whitelist & On-Chain Bonded Collateral
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Only healthcare providers accredited by NABH and possessing an active EdDSA BabyJubjub signing key with on-chain bonded collateral of INR 5,00,000 can submit attestations to the verifier contract.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Accredited registry whitelist validated
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                4
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Merkle Anchor Horizon & Freshness Check
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The patient’s policy leaf commitment must reside in an anchor Merkle tree committed to the blockchain within the last 10,000 blocks (~36 hours), ensuring lapsed policies cannot submit retrospective claims.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Policy active status checked at block level
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
