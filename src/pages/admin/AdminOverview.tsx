import React from 'react';
import {
  ShieldCheck,
  Building2,
  Blocks,
  Lock,
  Activity,
  ArrowRight,
  Server,
  Cpu,
  CheckCircle2,
  FileCheck2,
  FileCode,
  Layers,
  Flame,
  Zap,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminOverview: React.FC = () => {
  const { hospitals, approveHospitalEntity, auditLogs, claims, setActiveTab } = useArogyaZK();

  const pendingHospitals = hospitals.filter((h) => h.status === 'Pending Approval');
  const accreditedHospitals = hospitals.filter((h) => h.status !== 'Pending Approval');

  const settledClaims = claims.filter((c) => c.status === 'Approved' || c.status === 'Settled');
  const settledAmount = settledClaims.reduce((sum, c) => sum + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Admin Governance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-teal-300 font-bold shadow-xs">
              ZK
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ZKure Network Governance</h1>
            <Badge variant="teal" size="sm" dot>Consortium Rollup Active</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consortium administration console monitoring smart contracts, provider accreditations, and zero-knowledge claim settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Badge variant="navy" size="md">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span>Admin Key Isolation: Zero Access to Patient Records</span>
          </Badge>
        </div>
      </div>

      {/* Quick Links Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('contracts')}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Protocol Contracts</div>
              <div className="text-[10px] text-slate-400 font-mono">5 Deployed</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Subnet Explorer</div>
              <div className="text-[10px] text-slate-400 font-mono">Block #1,842,918</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => setActiveTab('hospitals')}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Provider Registry</div>
              <div className="text-[10px] text-slate-400 font-mono">{hospitals.length} Hospitals</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">Consortium Audit</div>
              <div className="text-[10px] text-slate-400 font-mono">{auditLogs.length} Events Logged</div>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('contracts')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Smart Contracts</span>
            <FileCode className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            5 / 5 Active
          </div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">Solidity v0.8.28 · Formally Verified</div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('hospitals')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Accredited Hospitals</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">{hospitals.length}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {pendingHospitals.length > 0 ? `${pendingHospitals.length} Pending Approval` : 'All Verified & Active'}
          </div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('explorer')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Proofs Verified On-Chain</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">2,891</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">100% Zero-Leakage Adjudications</div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('audit')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Consortium Security Logs</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tamper-Proof Audit Events</div>
        </Card>
      </div>

      {/* Architecture Health Matrix */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-teal-600" /> Network Architecture & Core Services Health
          </h2>
          <Badge variant="emerald" size="sm" dot>All Subsystems Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Groth16 Verifier
              </span>
              <span className="text-teal-700 font-bold font-mono text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">0x08 Active</span>
            </div>
            <p className="text-[11px] text-slate-600 font-sans">BN254 pairing precompile on EVM · 11,845 R1CS constraints</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" /> Settlement Escrow
              </span>
              <span className="text-indigo-700 font-bold font-mono text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">₹1.25 Cr</span>
            </div>
            <p className="text-[11px] text-slate-600 font-sans">Instant cashless Tier-1 escrow pool for verified healthcare claims</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Nullifier Shield
              </span>
              <span className="text-emerald-700 font-bold font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">SMT-16 Active</span>
            </div>
            <p className="text-[11px] text-slate-600 font-sans">Poseidon sponge anti-replay protection permanently prevents duplicate claims</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-center font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Consent Registry
              </span>
              <span className="text-amber-700 font-bold font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">DPDP Act §4(1)</span>
            </div>
            <p className="text-[11px] text-slate-600 font-sans">HealthVault contract enforcing patient-controlled cryptographic tokens</p>
          </div>
        </div>
      </Card>

      {/* Healthcare Provider Applications Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" /> Healthcare Provider Registry & Merkle Leaves
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accredited institutions enrolled in the Depth-16 sparse Merkle tree accumulator
            </p>
          </div>
          <button
            onClick={() => setActiveTab('hospitals')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            Manage All {hospitals.length} Providers <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 font-semibold">Hospital ID</th>
                <th className="py-2.5 font-semibold">Institution</th>
                <th className="py-2.5 font-semibold">NABH Registration</th>
                <th className="py-2.5 font-semibold">City</th>
                <th className="py-2.5 font-semibold">Merkle Status</th>
                <th className="py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-semibold font-mono text-slate-900">{h.id}</td>
                  <td className="py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="py-3 font-mono text-slate-600">{h.nabhRegistration}</td>
                  <td className="py-3 text-slate-600">{h.city}</td>
                  <td className="py-3">
                    <Badge variant={h.status === 'Pending Approval' ? 'amber' : 'emerald'} size="sm">
                      {h.status === 'Pending Approval' ? 'Pending Approval' : 'Accredited Leaf'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    {h.status === 'Pending Approval' ? (
                      <button
                        onClick={() => approveHospitalEntity(h.id)}
                        className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        Approve Provider
                      </button>
                    ) : (
                      <span className="text-teal-700 font-semibold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled on-chain
                      </span>
                    )}
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
