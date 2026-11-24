import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  Scale,
  EyeOff,
  Building2,
  FilePlus2,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Check,
  ExternalLink
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimsTrendChart } from '../../components/charts/ClaimsTrendChart';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { InsuranceClaim } from '../../types';

function getInsurerDetails(userLinkedId: string | null) {
  const raw = (userLinkedId || '').toLowerCase();
  if (raw.includes('care')) {
    return {
      name: 'Care Health Insurance',
      code: 'INS-CARE-02',
      initials: 'CH',
      tagline: 'Smart Contract Automated Adjudication & Instant Payouts',
      license: 'IRDAI Reg. No. 148',
      escrowPool: 2500000,
      color: 'bg-emerald-700'
    };
  }
  if (raw.includes('hdfc')) {
    return {
      name: 'HDFC ERGO Health',
      code: 'INS-HDFC-03',
      initials: 'HE',
      tagline: 'Instant Automated Settlement & Liquidity Escrow Pool',
      license: 'IRDAI Reg. No. 146',
      escrowPool: 3500000,
      color: 'bg-indigo-700'
    };
  }
  return {
    name: 'Star Shield Health Assurance',
    code: 'INS-STAR-01',
    initials: 'SS',
    tagline: 'Decentralized Zero-Knowledge Underwriting & Settlement',
    license: 'IRDAI Reg. No. 129',
    escrowPool: 2500000,
    color: 'bg-slate-900'
  };
}

export const InsurerOverview: React.FC = () => {
  const { claims, setActiveTab, userLinkedId, approveAndSettleClaim } = useArogyaZK();
  const insurer = getInsurerDetails(userLinkedId);
  const [inspectingClaim, setInspectingClaim] = useState<InsuranceClaim | null>(null);

  const activeInsurer = userLinkedId || insurer.name || 'Star Shield Health Assurance';
  const scopedClaims = claims.filter(
    (c) =>
      c.insurerName.toLowerCase() === activeInsurer.toLowerCase() ||
      c.insurerName.toLowerCase().includes(activeInsurer.toLowerCase()) ||
      activeInsurer.toLowerCase().includes(c.insurerName.toLowerCase())
  );

  const totalClaims = scopedClaims.length;
  const approvedClaims = scopedClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled');
  const pendingClaims = scopedClaims.filter((c) => c.status === 'Pending');
  const totalSettledAmount = approvedClaims.reduce((acc, c) => acc + c.claimAmount, 0);
  const pendingAmount = pendingClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  return (
    <div className="space-y-6">
      {/* Insurer Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${insurer.color} flex items-center justify-center text-white font-bold text-sm shadow-xs`}>
              {insurer.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{insurer.name}</h1>
                <Badge variant="teal" size="sm" dot>IRDAI Licensed</Badge>
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {insurer.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {insurer.tagline} · {insurer.license} · Escrow Liquidity Pool Active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('zk-verify')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>Groth16 Verifier</span>
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Incoming Queue ({pendingClaims.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('incoming')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Adjudication</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums font-mono">{pendingClaims.length}</div>
          <div className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
            ₹{pendingAmount.toLocaleString('en-IN')} queued
          </div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('approved')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Approved & Settled</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums font-mono">{approvedClaims.length}</div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1.5">
            100% Groth16 Verified
          </div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('settlements')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Payout Disbursed</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">
            ₹{totalSettledAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">Automated cashless escrow</div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('risk')}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Settlement Velocity</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">&lt; 2.4 mins</div>
          <div className="text-[11px] text-teal-700 font-medium mt-1.5">Tier 1 instant automated</div>
        </Card>
      </div>

      {/* Privacy Guard Architecture Banner */}
      <div className="p-5 rounded-2xl bg-[#090D16] text-white border border-slate-800 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/30">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-white">ZKure Claims Privacy Architecture Active</h3>
                <Badge variant="teal" size="sm">Groth16 BN254</Badge>
                <Badge variant="emerald" size="sm">Zero PHI Exposed</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                Patient diagnosis codes, physician notes, and laboratory findings remain confidential in hospital vaults. The smart contracts verify policy limits, hospital EdDSA signatures, and procedure schedule inclusion purely via zero-knowledge proofs over the BN254 scalar field F_p.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('zk-verify')}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 self-start md:self-center"
          >
            <span>Launch Verifier Chamber</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Analytics & Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Settlement Velocity & Volume Analytics */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Settlement Velocity & Volume Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time tracking of zero-knowledge claims processed under IRDAI guidelines
                </p>
              </div>
              <Badge variant="teal" size="sm">Live Telemetry</Badge>
            </div>
            <ClaimsTrendChart />
          </Card>
        </div>

        {/* Right: Quick Claims Queue */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Incoming Claims Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pendingClaims.length} pending ZK cashless settlement
                </p>
              </div>
              <button
                onClick={() => setActiveTab('incoming')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {scopedClaims.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors text-xs space-y-2 bg-slate-50/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{claim.id}</span>
                      <Badge variant="slate" size="sm">{claim.settlementTier}</Badge>
                    </div>
                    <Badge
                      variant={claim.status === 'Approved' || claim.status === 'Settled' ? 'emerald' : claim.status === 'Pending' ? 'amber' : 'rose'}
                      size="sm"
                      dot
                    >
                      {claim.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="truncate max-w-[180px] font-medium text-slate-800">{claim.hospitalName}</span>
                    <strong className="text-slate-900 font-mono font-bold tabular-nums">
                      ₹{claim.claimAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Beneficiary: {claim.patientMaskedId}
                    </span>
                    <button
                      onClick={() => setInspectingClaim(claim)}
                      className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
                    >
                      <Cpu className="w-3 h-3" />
                      Inspect Proof
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
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
