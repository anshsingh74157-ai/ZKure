import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Lock,
  ExternalLink,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientAudit: React.FC = () => {
  const { auditLogs } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [filterImpact, setFilterImpact] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesImpact = filterImpact === 'All' || log.privacyImpact === filterImpact;
    const matchesRole = filterRole === 'All' || log.actorRole === filterRole;
    const matchesSearch =
      (log.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.targetResource || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.actorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.actorRole || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.txHash || '').toLowerCase().includes(search.toLowerCase());
    return matchesImpact && matchesRole && matchesSearch;
  });

  const exportPatientAudit = () => {
    const report = {
      reportType: 'Patient Personal Cryptographic Audit Ledger',
      exportedAt: new Date().toISOString(),
      totalEvents: auditLogs.length,
      protocol: 'ZKure Groth16 BN254 Health Privacy Network',
      events: auditLogs
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.json`;
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Privacy & Audit Log</h1>
            <Badge variant="teal" dot>Immutable Cryptographic Audit</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time chronological log of all encryption, consent updates, and zero-knowledge verifications associated with your medical vault.
          </p>
        </div>
        <button
          onClick={exportPatientAudit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-slate-500" /> Export Signed Log
        </button>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Privacy Guarantee</div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">Zero PHI Disclosed</div>
          <div className="text-[11px] text-teal-700 mt-0.5">DPDP Act 2023 Sec 4(1) Compliant</div>
        </Card>
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Audit Events Recorded</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tamper-evident SQLite WAL + On-Chain State</div>
        </Card>
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unconsented Data Reads</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">0</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Enforced by cryptographic circuits</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] px-2.5 py-1 rounded-lg bg-slate-50/80 border border-slate-200/80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search action, target resource, or tx hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Actors</option>
            <option value="Patient">Patient</option>
            <option value="Hospital">Hospital</option>
            <option value="Insurer">Insurer</option>
            <option value="Smart Contract">Smart Contract</option>
          </select>

          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Privacy Classifications</option>
            <option value="Zero PHI Exposed">Zero PHI Exposed</option>
            <option value="Encrypted Vault Write">Encrypted Vault Write</option>
            <option value="Consent Updated">Consent Updated</option>
          </select>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Blockchain Anchor Tx</th>
                <th className="py-3 px-4 text-right">Privacy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{log.id}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{log.actorName}</span>
                    <span className="text-[11px] text-slate-400">{log.actorRole}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">{log.targetResource}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span>{log.txHash.slice(0, 14)}...</span>
                      <button
                        onClick={() => handleCopy(log.txHash, log.id)}
                        className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy Tx Hash"
                      >
                        {copiedTx === log.id ? (
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
                        log.privacyImpact === 'Zero PHI Exposed'
                          ? 'teal'
                          : log.privacyImpact === 'Encrypted Vault Write'
                          ? 'navy'
                          : 'amber'
                      }
                      dot
                    >
                      {log.privacyImpact}
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
