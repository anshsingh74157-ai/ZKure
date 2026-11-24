import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  X,
  Lock,
  Calendar,
  Building2,
  UserCheck,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';

interface PatientConsentItem {
  id: string;
  name: string;
  zkId: string;
  policyNumber: string;
  insurerName: string;
  hospitalId: string;
  hospitalName: string;
  permissionId: string;
  scope: string;
  recordIds: string[];
  expiresAt: number;
  status: 'Active' | 'Expired' | 'Revoked';
  tokenHash: string;
}

const PatientCountdownBadge: React.FC<{ expiresAt: number; status: 'Active' | 'Expired' | 'Revoked' }> = ({
  expiresAt,
  status
}) => {
  const countdown = useCountdown(status === 'Active' ? expiresAt : null);

  if (status !== 'Active') {
    return (
      <Badge variant="rose">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {status}
        </span>
      </Badge>
    );
  }

  const isExpiringSoon = expiresAt - Date.now() < 1000 * 60 * 60 * 2; // under 2 hours

  return (
    <Badge variant={isExpiringSoon ? 'amber' : 'teal'} dot>
      <span className="flex items-center gap-1 font-mono text-[11px]">
        <Clock className="w-3 h-3" /> {countdown}
      </span>
    </Badge>
  );
};

export const HospitalPatients: React.FC = () => {
  const {
    patientProfile,
    permissions,
    records,
    userLinkedId,
    setActiveTab,
    setRole
  } = useArogyaZK();

  const currentHospitalId = userLinkedId || 'HSP-402';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expired'>('All');
  const [selectedConsent, setSelectedConsent] = useState<PatientConsentItem | null>(null);

  const directoryPatients: PatientConsentItem[] = [
    {
      id: 'PAT-9041',
      name: patientProfile.name || 'Rohan Sharma',
      zkId: patientProfile.zkId || 'zkID:0x9041...E4B2',
      policyNumber: patientProfile.policyNumber || 'POL-AZK-774190',
      insurerName: patientProfile.insurerName || 'Star Shield Health Assurance',
      hospitalId: 'HSP-402',
      hospitalName: 'Apollo Spectra Hospital',
      permissionId: 'PRM-301',
      scope: 'Inpatient Surgical Care, Diagnostic Imaging, Discharge Summary',
      recordIds: ['REC-1041', 'REC-1038'],
      expiresAt: Date.now() + 1000 * 3600 * 9 + 1000 * 60 * 18,
      status: 'Active',
      tokenHash: '0x4b19e82f73c109d44e2b8c6190f3a41d7e8920b4a92c817263910247291a0b3c'
    },
    {
      id: 'PAT-9042',
      name: 'Ananya Iyer',
      zkId: 'zkID:0x9042...B3F9',
      policyNumber: 'POL-AZK-881204',
      insurerName: 'Care Health Shield',
      hospitalId: currentHospitalId === 'HSP-308' ? 'HSP-308' : 'HSP-402',
      hospitalName: currentHospitalId === 'HSP-308' ? 'Sankara Eye Centre' : 'Apollo Spectra Hospital',
      permissionId: 'PRM-302',
      scope: 'Corneal Topography & Prescription Records',
      recordIds: ['REC-2001', 'REC-2002'],
      expiresAt: Date.now() + 1000 * 3600 * 5 + 1000 * 60 * 42,
      status: 'Active',
      tokenHash: '0x8f2a1b9c3e4d5067a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1'
    },
    {
      id: 'PAT-9043',
      name: 'Vikram Malhotra',
      zkId: 'zkID:0x9043...C7A1',
      policyNumber: 'POL-AZK-552910',
      insurerName: 'HDFC ERGO Optima',
      hospitalId: currentHospitalId === 'HSP-219' ? 'HSP-219' : 'HSP-402',
      hospitalName: currentHospitalId === 'HSP-219' ? 'Fortis Diagnostics' : 'Apollo Spectra Hospital',
      permissionId: 'PRM-303',
      scope: 'Full Body Blood Panel & Diagnostic Imaging',
      recordIds: ['REC-3001'],
      expiresAt: Date.now() + 1000 * 3600 * 18 + 1000 * 60 * 5,
      status: 'Active',
      tokenHash: '0x3c7e9f1a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e'
    },
    {
      id: 'PAT-9044',
      name: 'Priya Patel',
      zkId: 'zkID:0x9044...D2E8',
      policyNumber: 'POL-AZK-991420',
      insurerName: 'Star Shield Health Assurance',
      hospitalId: 'HSP-402',
      hospitalName: 'Apollo Spectra Hospital',
      permissionId: 'PRM-299',
      scope: 'Endocrine Panel & Thyroid Diagnostics',
      recordIds: ['REC-4001'],
      expiresAt: Date.now() - 1000 * 3600 * 48,
      status: 'Expired',
      tokenHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
    }
  ];

  const mergedPatients = directoryPatients.map((p) => {
    const livePerm = permissions.find((perm) => perm.id === p.permissionId || perm.hospitalId === p.hospitalId);
    if (livePerm && p.id === 'PAT-9041') {
      return {
        ...p,
        status: livePerm.status as 'Active' | 'Expired' | 'Revoked',
        expiresAt: livePerm.expiresAt,
        recordIds: livePerm.recordIds.length > 0 ? livePerm.recordIds : p.recordIds
      };
    }
    return p;
  });

  const filteredPatients = mergedPatients.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.zkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scope.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? item.status === 'Active' && item.expiresAt > Date.now()
        : item.status !== 'Active' || item.expiresAt <= Date.now();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Access Directory</h1>
            <Badge variant="teal" dot>Consent Registry</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Patients who have signed time-bounded zero-knowledge consent tokens granting {currentHospitalId} access to clinical records
          </p>
        </div>

        <button
          onClick={() => setActiveTab('authorized')}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
        >
          <FileText className="w-4 h-4" /> Inspect Authorized Records
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 text-slate-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Fail-Closed Zero-Knowledge Consent:</strong> Hospital accounts can only retrieve records explicitly authorized by an active token. Expired or ungranted patient records remain cryptographically unreadable.
          </span>
        </div>
        <button
          onClick={() => setRole('patient')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
        >
          Simulate Patient Access Grant →
        </button>
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] px-2 py-1 rounded-lg bg-slate-50/80 border border-slate-200/80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Patient Name, ID (PAT-XXXX), Policy #, or diagnosis scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['All', 'Active', 'Expired'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </Card>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching patient consents found</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search or switching filter to "All"</p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isActive = patient.status === 'Active' && patient.expiresAt > Date.now();

            return (
              <Card
                key={patient.id}
                className="p-5 border-slate-200/90 hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {patient.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            {patient.id}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-teal-700 mt-0.5">
                          {patient.zkId}
                        </div>
                      </div>
                    </div>
                    <PatientCountdownBadge expiresAt={patient.expiresAt} status={patient.status} />
                  </div>

                  {/* Policy & Insurer */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Insurance Policy</span>
                      <span className="font-mono font-semibold text-slate-800 text-[11px] mt-0.5 block">
                        {patient.policyNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">Insurer Provider</span>
                      <span className="font-medium text-slate-800 text-[11px] truncate block mt-0.5">
                        {patient.insurerName}
                      </span>
                    </div>
                  </div>

                  {/* Scoped Authorization & Permitted Records */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium flex items-center gap-1.5 text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-teal-600" /> Authorized Records:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {patient.recordIds.length} Document(s)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.recordIds.map((recId) => (
                        <span
                          key={recId}
                          className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 font-mono text-[11px] text-teal-800 font-medium"
                        >
                          {recId}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Scope: {patient.scope}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedConsent(patient)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" /> Consent Token
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('create-claim')}
                      disabled={!isActive}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                    >
                      Create Claim
                    </button>
                    <button
                      onClick={() => setActiveTab('authorized')}
                      disabled={!isActive}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs disabled:cursor-not-allowed"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Records
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Consent Token Deep Inspection Modal */}
      {selectedConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl relative space-y-4 border border-slate-200">
            <button
              onClick={() => setSelectedConsent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Cryptographic Consent Delegation
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Token: {selectedConsent.permissionId}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Subject:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedConsent.name} ({selectedConsent.id})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Masked zkID:</span>
                  <span className="font-mono text-teal-700 font-semibold">
                    {selectedConsent.zkId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Hospital:</span>
                  <span className="font-medium text-slate-800">
                    {selectedConsent.hospitalName} ({selectedConsent.hospitalId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Status:</span>
                  <Badge variant={selectedConsent.status === 'Active' ? 'teal' : 'rose'}>
                    {selectedConsent.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Consent Scope Specification:
                </span>
                <p className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-200 text-teal-950 font-medium">
                  {selectedConsent.scope}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Client-Signed SHA-256 Consent Hash:
                </span>
                <div className="p-2.5 rounded-lg bg-slate-900 text-teal-300 font-mono text-[11px] break-all">
                  {selectedConsent.tokenHash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> On-Chain Anchor & Verification
                </div>
                <p>
                  This token is anchored into the ZKure <code>HealthVault.sol</code> smart contract. Doctors can decrypt scoped records locally in-memory; no raw patient records leave the hospital browser session.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedConsent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedConsent(null);
                  setActiveTab('authorized');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" /> Inspect Authorized Records
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
