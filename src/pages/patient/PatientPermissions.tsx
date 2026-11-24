import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Clock,
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  X
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';
import { AccessPermission } from '../../types';

export const PatientPermissions: React.FC = () => {
  const {
    permissions,
    records,
    hospitals,
    grantHospitalAccess,
    revokeHospitalAccess,
    patientProfile
  } = useArogyaZK();

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('HSP-402');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([records[0]?.id || 'REC-1041']);
  const [hours, setHours] = useState(3);
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const currentPatientId = patientProfile.id || 'PAT-9041';
  const patientPermissions = permissions.filter((p) => !p.patientId || p.patientId === currentPatientId);
  const activePermissions = patientPermissions.filter((p) => p.status === 'Active' && p.expiresAt > Date.now());
  const inactivePermissions = patientPermissions.filter((p) => p.status !== 'Active' || p.expiresAt <= Date.now());

  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) return;
    setGranting(true);
    setGrantError(null);
    try {
      const hosp = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0] || { id: 'HSP-402', name: 'Apollo Spectra Hospital' };
      await grantHospitalAccess(hosp.id, hosp.name, selectedRecordIds, hours);
      setShowGrantModal(false);
    } catch (err: any) {
      setGrantError(err.message || 'Failed to grant access permission');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Access Permissions & Consent</h1>
            <Badge variant="teal" size="sm" dot>ABDM & DPDP 2023</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fine-grained, time-bounded consent tokens controlling medical provider access to your encrypted vault
          </p>
        </div>

        <button
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Grant New Consent Token</span>
        </button>
      </div>

      {/* Compliance / Privacy Guarantee Banner */}
      <div className="p-4 rounded-xl bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Consent-Driven Cryptographic Access Control</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hospitals cannot decrypt or view any medical records without a cryptographically valid token signed by your private key.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-teal-400 bg-black/40 px-2.5 py-1 rounded border border-teal-500/30">
          Zero-Export Rule Active
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="p-4 bg-teal-50/20 border-teal-200/80">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Active Permissions</div>
          <div className="text-2xl font-bold text-teal-700 mt-1 tabular-nums font-mono">{activePermissions.length}</div>
          <div className="text-[11px] text-teal-700 mt-1">Time-bound active access in progress</div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Revoked / Expired</div>
          <div className="text-2xl font-bold text-slate-700 mt-1 tabular-nums font-mono">{inactivePermissions.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Access terminated permanently</div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Vault Records</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Protected by AES-256-GCM envelope</div>
        </Card>
      </div>

      {/* Active Permissions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Currently Active Consent Grants ({activePermissions.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">Tokens auto-expire upon countdown completion</span>
        </div>

        {activePermissions.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500 border-dashed">
            No active permissions currently granted. Your vault is completely isolated.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePermissions.map((perm) => (
              <ActivePermissionItem
                key={perm.id}
                permission={perm}
                onRevoke={() => revokeHospitalAccess(perm.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Consent History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Consent History & Immutable Ledger</span>
          </div>
          <span className="text-[11px] text-slate-400">Complete audit trail of all issued tokens</span>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">Token ID</th>
                  <th className="py-3 px-4 font-semibold">Healthcare Provider</th>
                  <th className="py-3 px-4 font-semibold">NABH Registration</th>
                  <th className="py-3 px-4 font-semibold">Records Scoped</th>
                  <th className="py-3 px-4 font-semibold">Granted At</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{p.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{p.hospitalName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.nabhId}</td>
                    <td className="py-3 px-4 text-slate-700">{p.recordIds.join(', ')}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.grantedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={p.status === 'Active' ? 'emerald' : p.status === 'Revoked' ? 'rose' : 'slate'} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Issue Scoped Consent Token</h3>
                  <p className="text-xs text-slate-500">Time-bounded cryptographic authorization</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    1. Healthcare Provider (Verified NABH)
                  </label>
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {hospitals.length} Network Providers
                  </span>
                </div>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-800"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city} ({h.nabhRegistration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Select Records to Include in Scope ({selectedRecordIds.length} selected)
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50">
                  {records.map((rec) => {
                    const isChecked = selectedRecordIds.includes(rec.id);
                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleToggleRecord(rec.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-teal-600 focus:ring-0"
                          />
                          <span className="font-semibold">{rec.title}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{rec.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  3. Token Validity Duration: <strong className="text-teal-700 font-mono">{hours} hour{hours > 1 ? 's' : ''}</strong>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHours(h)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        hours === h
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-[11px] text-teal-900 space-y-1">
                <strong>DPDP / ABDM Guarantee:</strong> The provider cannot save, forward, or export these records. When the timer expires or if revoked prematurely, their decryption capability is invalidated immediately.
              </div>

              {grantError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{grantError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowGrantModal(false); setGrantError(null); }}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting || selectedRecordIds.length === 0}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  {granting ? 'Issuing Consent Token...' : 'Grant Signed Consent'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const ActivePermissionItem: React.FC<{
  permission: AccessPermission;
  onRevoke: () => void;
}> = ({ permission, onRevoke }) => {
  const countdown = useCountdown(permission.expiresAt);

  return (
    <Card className="p-5 border-amber-200/90 bg-amber-50/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm border border-amber-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">{permission.hospitalName}</h3>
              <Badge variant="teal" size="sm">{permission.nabhId}</Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Token: {permission.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Remaining</div>
            <div className="font-mono text-sm font-bold text-amber-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> {countdown}
            </div>
          </div>
          <button
            onClick={onRevoke}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <ShieldOff className="w-3.5 h-3.5" /> Revoke Now
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white border border-amber-200/70 text-xs space-y-1">
        <div className="text-slate-600">
          <strong className="text-slate-900">Authorized Scope:</strong> {permission.scope}
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          <strong>Permitted Record IDs:</strong> {permission.recordIds.join(', ')}
        </div>
      </div>
    </Card>
  );
};
