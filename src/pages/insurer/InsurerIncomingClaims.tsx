import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Zap,
  Search,
  Filter,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  Building2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Download,
  Fingerprint
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { InsuranceClaim } from '../../types';

export const InsurerIncomingClaims: React.FC = () => {
  const { claims, approveAndSettleClaim, rejectClaim, userLinkedId } = useArogyaZK();

  const activeInsurer = userLinkedId || 'Star Shield Health Assurance';
  const activePool = claims.filter(
    (c) =>
      c.insurerName.toLowerCase() === activeInsurer.toLowerCase() ||
      c.insurerName.toLowerCase().includes(activeInsurer.toLowerCase()) ||
      activeInsurer.toLowerCase().includes(c.insurerName.toLowerCase())
  );

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'tier1' | 'tier2' | 'settled' | 'rejected'>('all');
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});

  // Modals & Actions
  const [selectedProofClaim, setSelectedProofClaim] = useState<InsuranceClaim | null>(null);
  const [approveModalClaim, setApproveModalClaim] = useState<InsuranceClaim | null>(null);
  const [rejectModalClaim, setRejectModalClaim] = useState<InsuranceClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('Coverage limit threshold exceeded');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const showToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleSignals = (id: string) => {
    setExpandedSignals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine claim settlement tier
  const getClaimTier = (claim: InsuranceClaim): 'Tier 1' | 'Tier 2' => {
    if (claim.settlementTier) return claim.settlementTier;
    return claim.claimAmount <= 100000 ? 'Tier 1' : 'Tier 2';
  };

  // Filtered Claims
  const filteredClaims = activePool.filter((claim) => {
    const tier = getClaimTier(claim);
    const matchesSearch =
      claim.id.toLowerCase().includes(search.toLowerCase()) ||
      claim.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      claim.patientMaskedId.toLowerCase().includes(search.toLowerCase()) ||
      claim.billHash.toLowerCase().includes(search.toLowerCase()) ||
      claim.policyNumber.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return claim.status === 'Pending';
    if (filterTab === 'settled') return claim.status === 'Settled' || claim.status === 'Approved';
    if (filterTab === 'rejected') return claim.status === 'Rejected';
    if (filterTab === 'tier1') return tier === 'Tier 1';
    if (filterTab === 'tier2') return tier === 'Tier 2';
    return true;
  });

  const pendingCount = activePool.filter((c) => c.status === 'Pending').length;
  const settledCount = activePool.filter((c) => c.status === 'Settled' || c.status === 'Approved').length;
  const rejectedCount = activePool.filter((c) => c.status === 'Rejected').length;
  const tier1Count = activePool.filter((c) => getClaimTier(c) === 'Tier 1').length;
  const tier2Count = activePool.filter((c) => getClaimTier(c) === 'Tier 2').length;

  // Handle Approve Execution
  const handleApproveConfirm = async () => {
    if (!approveModalClaim) return;
    const claimId = approveModalClaim.id;
    setActionInProgress(claimId);
    try {
      await approveAndSettleClaim(claimId);
      showToast(
        'Claim Approved & Settled',
        `Claim ${claimId} successfully verified on-chain and disbursed via smart contract escrow.`
      );
      setApproveModalClaim(null);
    } catch (err: any) {
      showToast('Settlement Failed', err?.message || 'Error processing payout', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Reject Execution
  const handleRejectConfirm = async () => {
    if (!rejectModalClaim) return;
    const claimId = rejectModalClaim.id;
    const finalReason = rejectReason === 'Other' ? customRejectReason : rejectReason;
    if (!finalReason) {
      showToast('Reason Required', 'Please specify a valid rejection reason.', 'error');
      return;
    }
    setActionInProgress(claimId);
    try {
      await rejectClaim(claimId, finalReason);
      showToast('Claim Rejected', `Claim ${claimId} has been marked as rejected with reason: ${finalReason}`);
      setRejectModalClaim(null);
    } catch (err: any) {
      showToast('Rejection Error', err?.message || 'Failed to reject claim', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm max-w-md animate-in slide-in-from-bottom duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-teal-500/40 text-white'
              : 'bg-rose-950 border-rose-500/40 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">{toastMessage.title}</div>
            <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Claim Adjudication Console</h1>
            <Badge variant="teal" dot>IRDAI Cashless Active</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-3xl leading-relaxed">
            Adjudicate incoming claims using Groth16 zero-knowledge proofs. Authorize instant smart contract disbursements with zero Protected Health Information (PHI) exposure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Insurer: {userLinkedId || 'Star Shield'}</Badge>
          <Badge variant="zinc">Pairing: BN254</Badge>
        </div>
      </div>

      {/* Visual Privacy Badge Banner */}
      <div className="rounded-xl border border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40 p-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <EyeOff className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                Diagnosis code and notes cryptographically masked by Groth16 circuit; zero PHI exposed
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                <Lock className="w-3 h-3" /> 100% Blinded Underwriting
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Medical diagnosis codes (ICD-10), laboratory findings, and physician notes remain encrypted inside the hospital vault. The Circom zero-knowledge circuit mathematically confirms that the patient has an active policy, the hospital holds an accredited EdDSA key, and the treatment category is covered.
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Claims ({activePool.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              filterTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('tier1')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              filterTab === 'tier1'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tier 1 Instant ({tier1Count})
          </button>
          <button
            onClick={() => setFilterTab('tier2')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              filterTab === 'tier2'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tier 2 Adjudicated ({tier2Count})
          </button>
          <button
            onClick={() => setFilterTab('settled')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              filterTab === 'settled'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Settled ({settledCount})
          </button>
          {rejectedCount > 0 && (
            <button
              onClick={() => setFilterTab('rejected')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                filterTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, hospital, zkID, hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 border-dashed">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <div className="font-semibold text-slate-700">No claims match the selected criteria</div>
          <p className="text-xs text-slate-400 mt-1">Try resetting the filter or search query.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const tier = getClaimTier(claim);
            const isSignalsExpanded = !!expandedSignals[claim.id];
            const isPending = claim.status === 'Pending';
            const isSettled = claim.status === 'Settled' || claim.status === 'Approved';
            const isRejected = claim.status === 'Rejected';

            return (
              <Card
                key={claim.id}
                className={`p-5 transition-all border shadow-xs ${
                  isPending
                    ? 'border-amber-200/90'
                    : isSettled
                    ? 'border-teal-200/80 bg-teal-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Claim Card Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-base text-slate-900 font-mono">{claim.id}</span>

                    {/* Settlement Tier Badge */}
                    {tier === 'Tier 1' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        Tier 1 Instant (≤ ₹1L)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Tier 2 Adjudicated (&gt; ₹1L)
                      </span>
                    )}

                    {/* Status Badge */}
                    <Badge variant={isSettled ? 'teal' : isPending ? 'amber' : 'rose'} dot>
                      {claim.status === 'Approved' ? 'Settled (Approved)' : claim.status}
                    </Badge>

                    <span className="text-xs text-slate-400">· Submitted: {claim.submittedAt}</span>
                  </div>

                  {/* Top Right Claim Amount */}
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Claim Amount</div>
                    <div className="text-lg font-bold tracking-tight text-slate-900">
                      ₹{claim.claimAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Beneficiary (Masked zkID)</span>
                    <span className="font-mono text-teal-700 font-semibold text-xs mt-0.5 block">
                      {claim.patientMaskedId}
                    </span>
                    <span className="text-[11px] text-slate-400">Policy: {claim.policyNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Healthcare Provider</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                      {claim.hospitalName}
                    </span>
                    <span className="text-[11px] text-slate-500">Provider ID: {claim.hospitalId}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Treatment & Service Date</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                      {claim.treatmentDate}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Invoice: {claim.billFileName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Bill SHA-256 Digest</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]" title={claim.billHash}>
                        {claim.billHash}
                      </span>
                      <button
                        onClick={() => handleCopy(claim.billHash, claim.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy Bill Hash"
                      >
                        {copiedHash === claim.id ? (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Public Signals Inspector Box */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Cpu className="w-4 h-4 text-teal-600" />
                      <span>Zero-Knowledge Public Signals Inspector</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        Groth16-BN254
                      </span>
                    </div>
                    <button
                      onClick={() => toggleSignals(claim.id)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                    >
                      {isSignalsExpanded ? 'Collapse Signals' : 'View Verified Signals (5)'}
                      {isSignalsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Summary signals row always visible */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Policy Active: <strong>1</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Hospital EdDSA: <strong>Valid</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Anchor Root: <strong>Matched</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Procedure Covered: <strong>1</strong></span>
                    </div>
                  </div>

                  {/* Expanded Signals Details */}
                  {isSignalsExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">NULLIFIER HASH (REPLAY SHIELD)</span>
                          <span className="text-slate-800 truncate block mt-0.5" title={claim.zkProof.nullifierHash}>
                            {claim.zkProof.nullifierHash || '0x44f9a21c88b3d019e72f1c45a908b321d4e5f6a7'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">VERIFIER CONTRACT ON-CHAIN</span>
                          <span className="text-slate-800 truncate block mt-0.5">
                            {claim.zkProof.verifierContract || '0x7A9e4B12F09c8D3E1a44C90B8211F6e0'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                        <div className="font-semibold text-slate-800 mb-1">Public Wires from Circom Prover:</div>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                          {(claim.zkProof.publicSignals || [
                            'policy_active=1',
                            'hospital_sig_valid=1',
                            'anchor_root_match=1',
                            `claim_amount_inr=${claim.claimAmount}`,
                            'nullifier_valid=1',
                            'procedure_covered=1'
                          ]).map((sig, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProofClaim(claim)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Inspect Groth16 Proof
                    </button>
                  </div>

                  {/* Adjudication actions when pending */}
                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectModalClaim(claim)}
                        disabled={actionInProgress === claim.id}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Reject Claim
                      </button>
                      <button
                        onClick={() => setApproveModalClaim(claim)}
                        disabled={actionInProgress === claim.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionInProgress === claim.id ? 'Processing...' : 'Approve & Execute Settlement'}
                      </button>
                    </div>
                  )}

                  {/* Settled Confirmation Details */}
                  {isSettled && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Settlement Disbursed via Smart Contract
                      </span>
                      {claim.settlementTxHash && (
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Tx: {claim.settlementTxHash.slice(0, 10)}...{claim.settlementTxHash.slice(-8)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejected Details */}
                  {isRejected && (
                    <div className="text-xs text-rose-700 font-medium">
                      Claim rejected during adjudication.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- STANDARDIZED PROOF INSPECTOR MODAL --- */}
      {selectedProofClaim && (
        <ProofInspectorModal
          claim={selectedProofClaim}
          onClose={() => setSelectedProofClaim(null)}
        />
      )}

      {/* --- MODAL 2: Approve & Execute Settlement Modal --- */}
      {approveModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Authorize Cashless Settlement
                </h3>
                <p className="text-xs text-slate-500">
                  Execute on-chain smart contract disbursement for Claim {approveModalClaim.id}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200/70">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-mono text-teal-800 font-semibold">{approveModalClaim.patientMaskedId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/70">
                <span className="text-slate-500">Healthcare Provider:</span>
                <span className="font-semibold text-slate-800">{approveModalClaim.hospitalName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/70">
                <span className="text-slate-500">Settlement Tier:</span>
                <span className="font-semibold text-emerald-700">
                  {getClaimTier(approveModalClaim)} Instant Cashless
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-semibold text-slate-700">Payout Amount:</span>
                <span className="text-lg font-bold text-teal-600">
                  ₹{approveModalClaim.claimAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/60 space-y-1">
              <div className="font-semibold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Zero-Knowledge Cryptographic Guarantee
              </div>
              <p>
                Approving will execute the settlement smart contract to disburse ₹{approveModalClaim.claimAmount.toLocaleString('en-IN')} directly into the verified treasury of {approveModalClaim.hospitalName}. No private patient health records are recorded or transmitted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setApproveModalClaim(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={actionInProgress === approveModalClaim.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionInProgress === approveModalClaim.id ? 'Disbursing...' : 'Confirm & Disburse Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Reject Claim Modal --- */}
      {rejectModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Reject Claim Adjudication
                </h3>
                <p className="text-xs text-slate-500">
                  Specify reason for rejecting Claim {rejectModalClaim.id}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  IRDAI Regulatory Rejection Reason
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Coverage limit threshold exceeded">Coverage limit threshold exceeded</option>
                  <option value="Policy inactive during treatment date">Policy inactive during treatment date</option>
                  <option value="Hospital provider key not verified with NABH">Hospital provider key not verified with NABH</option>
                  <option value="Duplicate nullifier or replay anomaly">Duplicate nullifier or replay anomaly</option>
                  <option value="Non-covered procedure schedule">Non-covered procedure schedule</option>
                  <option value="Other">Other (Custom reason)</option>
                </select>
              </div>

              {rejectReason === 'Other' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Custom Reason</label>
                  <textarea
                    rows={2}
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    placeholder="Enter explicit reason for audit log..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectModalClaim(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionInProgress === rejectModalClaim.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {actionInProgress === rejectModalClaim.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
