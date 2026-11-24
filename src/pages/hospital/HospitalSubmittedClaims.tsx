import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  ShieldCheck,
  Eye,
  Zap,
  Cpu,
  FileText
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { InsuranceClaim } from '../../types';

export const HospitalSubmittedClaims: React.FC = () => {
  const { claims, userLinkedId, hospitals } = useArogyaZK();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [inspectProofClaim, setInspectProofClaim] = useState<InsuranceClaim | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';
  const hospitalClaims = claims.filter((c) => c.hospitalId === currentHospitalId);

  const currentHospital = hospitals.find((h) => h.id === currentHospitalId) || {
    id: currentHospitalId,
    name:
      currentHospitalId === 'HSP-219'
        ? 'Fortis Diagnostics'
        : currentHospitalId === 'HSP-308'
        ? 'Sankara Eye Centre'
        : currentHospitalId === 'HSP-512'
        ? 'Max Super Speciality'
        : 'Apollo Spectra Hospital'
  };

  const filteredClaims = hospitalClaims.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.patientId.toLowerCase().includes(search.toLowerCase()) ||
      c.billFileName.toLowerCase().includes(search.toLowerCase()) ||
      (c.hospitalName && c.hospitalName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalClaimed = hospitalClaims.reduce((acc, c) => acc + c.claimAmount, 0);
  const settledClaims = hospitalClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled');
  const totalSettled = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submitted Hospital Claims</h1>
            <Badge variant="teal">{currentHospital.name}</Badge>
            <Badge variant="navy">{currentHospital.id}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cryptographic ledger of claims dispatched to insurance privacy guards with smart contract settlement tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Billed Volume</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            ₹{totalClaimed.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{hospitalClaims.length} total claims recorded</div>
        </Card>

        <Card className="p-4 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Settled to Hospital Treasury</div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">
            ₹{totalSettled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">{settledClaims.length} instant payouts confirmed</div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Adjudication</div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 mt-1">
            {hospitalClaims.filter((c) => c.status === 'Pending').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under Insurer Privacy Guard review</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] px-2.5 py-1 rounded-lg bg-slate-50/80 border border-slate-200/80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by claim ID, patient, or invoice document name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Approved', 'Pending', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Claims Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Patient Mask</th>
                <th className="py-3 px-4">Healthcare Provider</th>
                <th className="py-3 px-4">Treatment Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Invoice PDF</th>
                <th className="py-3 px-4">ZK Proof</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((c) => {
                const isExpanded = expandedClaimId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{c.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{c.patientId}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {c.hospitalName || currentHospital.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{c.treatmentDate}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{c.claimAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{c.billFileName}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setInspectProofClaim(c)}
                          className="font-mono text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1"
                        >
                          <Cpu className="w-3 h-3 text-teal-600" />
                          {c.zkProof.proofId}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            c.status === 'Approved' || c.status === 'Settled'
                              ? 'teal'
                              : c.status === 'Pending'
                              ? 'amber'
                              : 'rose'
                          }
                          dot
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectProofClaim(c)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                            title="Inspect ZK Proof"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedClaimId(isExpanded ? null : c.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                          >
                            {isExpanded ? 'Hide' : 'Timeline'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Timeline & Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-4 bg-slate-50/60 border-y border-slate-200/80">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                                Verification Lifecycle
                              </h4>
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <ClaimTimeline steps={c.timeline} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                                Settlement Cryptography
                              </h4>
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2.5 font-mono shadow-2xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">Insurer:</span>
                                  <span className="font-sans text-slate-900 font-semibold">{c.insurerName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-sans">Hospital EdDSA Signature:</span>
                                  <span className="text-slate-600 text-[11px]">{c.hospitalSignature.slice(0, 24)}...</span>
                                </div>
                                {c.settlementTxHash && (
                                  <div className="flex justify-between pt-1.5 border-t border-slate-100">
                                    <span className="text-slate-400 font-sans">Settlement Tx Hash:</span>
                                    <span className="text-teal-700 font-bold text-[11px]">{c.settlementTxHash.slice(0, 24)}...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Proof Inspector Modal */}
      {inspectProofClaim && (
        <ProofInspectorModal
          claim={inspectProofClaim}
          onClose={() => setInspectProofClaim(null)}
        />
      )}
    </div>
  );
};
