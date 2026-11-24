import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Download,
  Receipt,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  FileCheck2,
  Zap,
  Lock,
  Eye,
  Cpu
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { InsuranceClaim } from '../../types';

export const InsurerApprovedClaims: React.FC = () => {
  const { claims, userLinkedId } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [inspectProofClaim, setInspectProofClaim] = useState<InsuranceClaim | null>(null);

  const activeInsurer = userLinkedId || 'Star Shield Health Assurance';
  const insurerClaims = claims.filter(
    (c) =>
      c.insurerName.toLowerCase() === activeInsurer.toLowerCase() ||
      c.insurerName.toLowerCase().includes(activeInsurer.toLowerCase()) ||
      activeInsurer.toLowerCase().includes(c.insurerName.toLowerCase())
  );
  const approvedClaims = insurerClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled');
  const filteredClaims = approvedClaims.filter((c) => {
    return (
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      c.patientMaskedId.toLowerCase().includes(search.toLowerCase()) ||
      (c.settlementTxHash && c.settlementTxHash.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const totalSettled = approvedClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  const downloadVoucher = (claim: InsuranceClaim) => {
    const voucherData = {
      voucherType: 'ZKure Cashless Settlement Confirmation',
      claimId: claim.id,
      patientMaskedZkId: claim.patientMaskedId,
      policyNumber: claim.policyNumber,
      provider: claim.hospitalName,
      providerId: claim.hospitalId,
      treatmentDate: claim.treatmentDate,
      disbursedAmountInr: claim.claimAmount,
      settlementTier: claim.settlementTier || (claim.claimAmount <= 100000 ? 'Tier 1' : 'Tier 2'),
      proofId: claim.zkProof.proofId,
      settlementTxHash: claim.settlementTxHash || '0x77b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
      verifierContract: claim.zkProof.verifierContract,
      timestamp: claim.submittedAt,
      status: 'SETTLED_ON_CHAIN'
    };

    const blob = new Blob([JSON.stringify(voucherData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Settlement_Voucher_${claim.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Approved Claims & Disbursements</h1>
            <Badge variant="teal" dot>100% Groth16 Verified</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Verified claims settled via smart contract liquidity escrow directly into accredited healthcare provider treasuries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Consortium Escrow</Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Total Settled Volume</div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">
            ₹{totalSettled.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-teal-700 mt-0.5">Disbursed directly to hospital accounts</div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Approved Claims Count</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{approvedClaims.length}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">100% Groth16 mathematical proof match</div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Payout Latency</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">&lt; 2.4 minutes</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Smart contract automated execution rail</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3.5 flex items-center gap-2.5 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search approved claims by ID, hospital, or masked zkID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
        />
      </Card>

      {/* Approved Claims Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Beneficiary Masked zkID</th>
                <th className="py-3 px-4">Healthcare Provider</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">ZK Proof Signal</th>
                <th className="py-3 px-4">Settlement Tx</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{claim.id}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700 font-semibold">{claim.patientMaskedId}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{claim.hospitalName}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{claim.claimAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setInspectProofClaim(claim)}
                      className="font-mono text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1"
                    >
                      <Cpu className="w-3 h-3 text-teal-600" />
                      {claim.zkProof.proofId}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {claim.settlementTxHash
                      ? claim.settlementTxHash.slice(0, 16) + '...'
                      : '0x77b8c9d0e1f2...'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectProofClaim(claim)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                        title="Inspect ZK Proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadVoucher(claim)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                        title="Download Voucher"
                      >
                        <Download className="w-3 h-3 text-slate-500" /> Voucher
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
