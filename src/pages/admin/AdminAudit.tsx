import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  CheckCircle2,
  Lock,
  Activity,
  Layers,
  FileCheck2,
  Copy,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AdminAudit: React.FC = () => {
  const { auditLogs } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterImpact, setFilterImpact] = useState('All');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesRole = filterRole === 'All' || log.actorRole === filterRole;
    const matchesImpact = filterImpact === 'All' || log.privacyImpact === filterImpact;
    const matchesSearch =
      (log.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.targetResource || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.txHash || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.actorRole || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.actorName || '').toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesImpact && matchesSearch;
  });

  const exportAuditBundle = () => {
    const bundle = {
      bundleType: 'Consortium Governance Audit Bundle',
      exportedAt: new Date().toISOString(),
      nodes: 4,
      totalEvents: auditLogs.length,
      protocol: 'ZKure BN254 Groth16',
      events: auditLogs
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consortium_Audit_${new Date().toISOString().slice(0, 10)}.json`;
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System-Wide Consortium Audit Ledger</h1>
            <Badge variant="teal" dot>Consortium Governance</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Tamper-proof event logs recording every record hash anchor, consent token lifecycle, and settlement execution across all participating nodes.
          </p>
        </div>
        <button
          onClick={exportAuditBundle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4 text-slate-500" /> Export Consortium Logs
        </button>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Total System Events</div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">{auditLogs.length}</div>
          <div className="text-[11px] text-teal-700 mt-0.5">Anchored across consortium rollup</div>
        </Card>
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Zero PHI Violations</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">0</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Circuit-enforced data privacy</div>
        </Card>
        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Consortium Nodes Synced</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">4 / 4</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Subnet consensus healthy</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] px-2.5 py-1 rounded-lg bg-slate-50/80 border border-slate-200/80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by action, actor, target resource, or transaction hash..."
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
            <option value="All">All Roles</option>
            <option value="Patient">Patient</option>
            <option value="Hospital">Hospital</option>
            <option value="Insurer">Insurer</option>
            <option value="Smart Contract">Smart Contract</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 outline-none"
          >
            <option value="All">All Privacy Types</option>
            <option value="Zero PHI Exposed">Zero PHI Exposed</option>
            <option value="Encrypted Vault Write">Encrypted Vault Write</option>
            <option value="Consent Updated">Consent Updated</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Tx Hash</th>
                <th className="py-3 px-4 text-right">Privacy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{log.id}</td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.actorName}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{log.actorRole}</td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-teal-700 font-medium">{log.targetResource}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span>{log.txHash.slice(0, 14)}...</span>
                      <button
                        onClick={() => handleCopy(log.txHash, log.id)}
                        className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
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
