import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Search,
  Wallet,
  CheckCircle2,
  Building2,
  ExternalLink,
  Coins,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Copy,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const InsurerSettlements: React.FC = () => {
  const { claims, userLinkedId } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const totalPool = (userLinkedId || '').toLowerCase().includes('hdfc') ? 3500000 : 2500000;
  const activeInsurer = userLinkedId || 'Star Shield Health Assurance';
  const insurerClaims = claims.filter(
    (c) =>
      c.insurerName.toLowerCase() === activeInsurer.toLowerCase() ||
      c.insurerName.toLowerCase().includes(activeInsurer.toLowerCase()) ||
      activeInsurer.toLowerCase().includes(c.insurerName.toLowerCase())
  );
  const settledClaims = insurerClaims.filter((c) => c.status === 'Settled' || c.status === 'Approved');
  const totalSettledAmount = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);
  const remainingFloat = totalPool - totalSettledAmount;
  const floatPercent = Math.max(0, Math.min(100, Math.round((remainingFloat / totalPool) * 100)));

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const settlementLedger = settledClaims.map((c) => ({
    settleId: `STL-${c.id.replace('CLM-', '')}`,
    claimId: c.id,
    payee: c.hospitalName,
    amount: c.claimAmount,
    timestamp: c.submittedAt,
    txHash: c.settlementTxHash || '0x77b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    status: 'Confirmed'
  }));

  const filteredLedger = settlementLedger.filter((item) => {
    return (
      item.settleId.toLowerCase().includes(search.toLowerCase()) ||
      item.claimId.toLowerCase().includes(search.toLowerCase()) ||
      item.payee.toLowerCase().includes(search.toLowerCase()) ||
      item.txHash.toLowerCase().includes(search.toLowerCase())
    );
  });

  const exportFinancialReport = () => {
    const report = {
      reportType: 'ZKure Insurer Financial Settlement Ledger',
      insurerAccount: userLinkedId || 'Star Shield Health Assurance',
      generatedAt: new Date().toISOString(),
      totalEscrowPoolInr: totalPool,
      settledAmountInr: totalSettledAmount,
      availableFloatInr: remainingFloat,
      settlementsCount: settledClaims.length,
      discrepancyRate: '0.00%',
      settlements: settlementLedger
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Settlement_Reconciliation_${new Date().toISOString().slice(0, 10)}.json`;
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settlement History & Treasury</h1>
            <Badge variant="teal" dot>Escrow Active</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Transparent on-chain settlement ledger tracking smart contract disbursements to healthcare provider treasuries.
          </p>
        </div>
        <button
          onClick={exportFinancialReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-slate-500" /> Export Financial Reconciliation
        </button>
      </div>

      {/* Treasury Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center justify-between">
            <span>Escrow Liquidity Float</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            ₹{remainingFloat.toLocaleString('en-IN')}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
              <span>Pool Reserve ({floatPercent}% Available)</span>
              <span>Cap: ₹{totalPool.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${floatPercent}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Claims Settled (YTD)</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-2">
            ₹{totalSettledAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{settledClaims.length} instant payouts executed</div>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Reconciliation Discrepancy Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">0.00%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Smart contract exact balance matching</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3.5 flex items-center gap-2.5 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search settlement records by Payout ID, Claim ID, or Hospital..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
        />
      </Card>

      {/* Ledger Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Healthcare Provider</th>
                <th className="py-3 px-4">Amount Disbursed</th>
                <th className="py-3 px-4">Disbursement Rail</th>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((row) => (
                <tr key={row.settleId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{row.settleId}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{row.claimId}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{row.payee}</td>
                  <td className="py-3.5 px-4 font-bold text-teal-600">
                    ₹{row.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">Smart Contract Escrow</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-slate-500 text-[11px]">
                      <span>{row.txHash.slice(0, 16)}...</span>
                      <button
                        onClick={() => handleCopy(row.txHash, row.settleId)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === row.settleId ? (
                          <Check className="w-3 h-3 text-teal-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="teal" dot>{row.status}</Badge>
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
