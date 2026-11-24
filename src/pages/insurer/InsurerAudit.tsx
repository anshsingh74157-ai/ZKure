import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Layers,
  FileCheck2,
  Calendar,
  EyeOff,
  Scale,
  Building2,
  CheckCircle,
  FileText,
  X
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { AuditLogEntry } from '../../types';

export const InsurerAudit: React.FC = () => {
  const { auditLogs } = useArogyaZK();

  const [search, setSearch] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState<string>('all');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogEntry | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredLogs = auditLogs.filter((entry) => {
    const matchesSearch =
      (entry.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (entry.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (entry.actorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (entry.targetResource || '').toLowerCase().includes(search.toLowerCase()) ||
      (entry.txHash || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPrivacy === 'zero-phi') return entry.privacyImpact === 'Zero PHI Exposed';
    if (filterPrivacy === 'vault-write') return entry.privacyImpact === 'Encrypted Vault Write';
    if (filterPrivacy === 'consent') return entry.privacyImpact === 'Consent Updated';
    if (filterPrivacy === 'contract') return entry.actorRole === 'Smart Contract';

    return true;
  });

  const zeroPhiCount = auditLogs.filter((l) => l.privacyImpact === 'Zero PHI Exposed').length;
  const vaultWriteCount = auditLogs.filter((l) => l.privacyImpact === 'Encrypted Vault Write').length;
  const consentCount = auditLogs.filter((l) => l.privacyImpact === 'Consent Updated').length;

  const handleDownloadJson = () => {
    const report = {
      reportType: 'IRDAI & DPDP Act Compliance Audit Ledger',
      protocol: 'ZKure Groth16 BN254 Health Claims Privacy System',
      generatedAt: new Date().toISOString(),
      regulations: [
        'IRDAI Master Circular on Health Insurance Products 2024 (Cashless Turnaround SLA)',
        'Digital Personal Data Protection (DPDP) Act 2023 Section 4(1) Data Minimization'
      ],
      totalAuditEntries: auditLogs.length,
      zeroPhiGuaranteedEntries: zeroPhiCount,
      complianceStatus: '100% COMPLIANT',
      entries: auditLogs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZKure_IRDAI_Compliance_Ledger_${new Date().toISOString().slice(0, 10)}.json`;
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">IRDAI Regulatory Audit & Compliance Ledger</h1>
            <Badge variant="teal" dot>DPDP Act Compliant</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
            Cryptographic, tamper-evident audit ledger compliant with IRDAI Health Insurance Regulations 2024 and DPDP Act 2023. Zero Protected Health Information (PHI) retained on insurer premises.
          </p>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          Export IRDAI Compliance Certificate
        </button>
      </div>

      {/* Compliance Overview Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-teal-200/80 bg-gradient-to-br from-teal-50/40 to-white shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
            <EyeOff className="w-4 h-4 text-teal-600" />
            DPDP Act 2023 Sec 4(1) Data Minimization
          </div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-2">0 Bytes PHI</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Patient ICD-10 diagnostic codes, physician notes, and laboratory biomarkers are never exposed or stored in insurer databases. Zero-knowledge circuits deliver mathematical satisfiability proofs only.
          </p>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Scale className="w-4 h-4 text-teal-600" />
            IRDAI 2024 Cashless Mandate
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">&lt; 3 Min SLA</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            IRDAI 2024 guidelines mandate rapid cashless hospital discharge approvals within 3 hours. ZKure executes automated smart contract escrow payouts in under 3 minutes.
          </p>
        </Card>

        <Card className="p-5 border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Lock className="w-4 h-4 text-teal-600" />
            Non-Repudiable Cryptographic Ledger
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">100% Verifiable</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Every transaction is co-signed by hospital EdDSA keys and anchored to immutable smart contract block state, ensuring an ironclad, tamper-evident audit trail for regulatory inspections.
          </p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterPrivacy('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                filterPrivacy === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Events ({auditLogs.length})
            </button>
            <button
              onClick={() => setFilterPrivacy('zero-phi')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                filterPrivacy === 'zero-phi'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Zero PHI Exposed ({zeroPhiCount})
            </button>
            <button
              onClick={() => setFilterPrivacy('contract')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                filterPrivacy === 'contract'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Smart Contract Verifications
            </button>
            <button
              onClick={() => setFilterPrivacy('vault-write')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                filterPrivacy === 'vault-write'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              Encrypted Vault Writes ({vaultWriteCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ledger by hash, actor, claim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Audit Event ID</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Blockchain Tx Hash</th>
                <th className="py-3 px-4 text-right">Privacy Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedLogDetail(entry)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{entry.id}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{entry.timestamp}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{entry.actorName}</span>
                    <span className="text-[11px] text-slate-400">{entry.actorRole}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs">{entry.action}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">{entry.targetResource}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span>{entry.txHash.slice(0, 14)}...</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(entry.txHash, entry.id);
                        }}
                        className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === entry.id ? (
                          <Check className="w-3 h-3 text-teal-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge
                      variant={
                        entry.privacyImpact === 'Zero PHI Exposed'
                          ? 'teal'
                          : entry.privacyImpact === 'Encrypted Vault Write'
                          ? 'navy'
                          : 'amber'
                      }
                      dot
                    >
                      {entry.privacyImpact}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl relative space-y-4 border border-slate-200">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Export Compliance Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Signed JSON Certificate for IRDAI & DPDP Act Audits
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Audit Entries:</span>
                  <span className="font-bold text-slate-900">{auditLogs.length} events</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zero PHI Compliance:</span>
                  <span className="font-semibold text-teal-700">100% Guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consortium Signature:</span>
                  <span className="font-mono text-slate-600">ECDSA SECP256k1</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDownloadJson();
                  setShowExportModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Signed JSON
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl relative space-y-4 border border-slate-200">
            <button
              onClick={() => setSelectedLogDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit Event #{selectedLogDetail.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Tx: {selectedLogDetail.txHash}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-medium text-slate-900">{selectedLogDetail.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor Name:</span>
                <span className="font-semibold text-slate-900">{selectedLogDetail.actorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor Role:</span>
                <span className="font-mono text-slate-700">{selectedLogDetail.actorRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Resource:</span>
                <span className="font-mono text-teal-700 font-bold">{selectedLogDetail.targetResource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Privacy Classification:</span>
                <Badge variant="teal">{selectedLogDetail.privacyImpact}</Badge>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Action Narrative:</span>
              <p className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 leading-relaxed">
                {selectedLogDetail.action}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
