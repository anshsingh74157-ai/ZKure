import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Search,
  Filter,
  Receipt,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { InsuranceClaim } from '../../types';

export const PatientHistory: React.FC = () => {
  const { claims, patientProfile } = useArogyaZK();
  const currentPatientId = patientProfile.id || 'PAT-9041';
  const patientClaims = claims.filter((c) => c.patientId === currentPatientId);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(patientClaims[0]?.id || null);
  const [inspectingClaim, setInspectingClaim] = useState<InsuranceClaim | null>(null);

  const filteredClaims = patientClaims.filter((c) => {
    const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.hospitalName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalAmount = patientClaims.reduce((acc, c) => acc + c.claimAmount, 0);
  const approvedAmount = patientClaims
    .filter((c) => c.status === 'Approved' || c.status === 'Settled')
    .reduce((acc, c) => acc + c.claimAmount, 0);
  const pendingAmount = patientClaims
    .filter((c) => c.status === 'Pending')
    .reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Claim History & Settlements</h1>
            <Badge variant="teal" size="sm" dot>Immutable Ledger</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking zero-knowledge claims, smart contract pairing verifications, and cashless escrow payouts
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Value Claimed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">{patientClaims.length} claims submitted</div>
        </Card>
        <Card className="p-4 bg-teal-50/20 border-teal-200/80">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Approved & Settled</div>
          <div className="text-2xl font-bold text-teal-700 mt-1 tabular-nums font-mono">
            ₹{approvedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-1">Instant cashless bank transfers</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums font-mono">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Queued in Insurer Privacy Guard</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by claim ID (e.g., CLM-2026-884) or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['All', 'Approved', 'Pending', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Claims List with Expandable Cards */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => {
          const isExpanded = expandedClaimId === claim.id;
          return (
            <Card
              key={claim.id}
              className={`transition-all border ${
                isExpanded ? 'border-slate-300 shadow-xs' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div
                onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      claim.status === 'Approved' || claim.status === 'Settled'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                        : claim.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-mono">{claim.id}</span>
                      <Badge
                        variant={
                          claim.status === 'Approved' || claim.status === 'Settled'
                            ? 'emerald'
                            : claim.status === 'Pending'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                        dot
                      >
                        {claim.status}
                      </Badge>
                      <Badge variant="slate" size="sm">{claim.settlementTier}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {claim.hospitalName} · Date: <span className="font-mono">{claim.treatmentDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Claim Amount</div>
                    <div className="font-bold text-sm text-slate-900 font-mono tabular-nums">
                      ₹{claim.claimAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Timeline Tracker */}
                    <div className="lg:col-span-6 space-y-3">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Cryptographic Verification Timeline
                      </h4>
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                        <ClaimTimeline steps={claim.timeline} />
                      </div>
                    </div>

                    {/* Right: ZK Proof Artifacts & Settlement Info */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Proof Telemetry & Settlement
                        </h4>
                        <button
                          onClick={() => setInspectingClaim(claim)}
                          className="inline-flex items-center gap-1 font-mono text-xs text-teal-700 font-semibold hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80 transition-colors"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Open Groth16 Inspector</span>
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-2.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Proof Identifier:</span>
                          <span className="text-teal-700 font-semibold truncate max-w-[200px]">
                            {claim.zkProof.proofId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Circuit Protocol:</span>
                          <span className="text-slate-900 font-semibold">{claim.zkProof.protocol} (BN254)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Nullifier Hash:</span>
                          <span className="text-slate-600 truncate max-w-[220px]">
                            {claim.zkProof?.nullifierHash || '0x44f9a21c...'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Bilinear Pairing Check:</span>
                          <span className="text-teal-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Precompile 0x08 Valid
                          </span>
                        </div>

                        {claim.settlementTxHash && (
                          <div className="pt-2 border-t border-slate-100 flex justify-between">
                            <span className="text-slate-500 font-sans">Settlement Tx Hash:</span>
                            <span className="text-slate-900 font-medium">
                              {claim.settlementTxHash.slice(0, 18)}...
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => alert(`Downloaded Cryptographic Attestation for ${claim.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Settlement Voucher
                        </button>
                        <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> 0 bytes diagnostic data exposed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Proof Inspector Modal */}
      <ProofInspectorModal
        claim={inspectingClaim}
        isOpen={!!inspectingClaim}
        onClose={() => setInspectingClaim(null)}
      />
    </div>
  );
};
