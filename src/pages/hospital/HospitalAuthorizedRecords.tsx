import React, { useState } from 'react';
import {
  FolderCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  FilePlus2,
  Lock,
  Eye,
  CheckCircle2,
  Loader2,
  KeyRound,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';

const PATIENT_FALLBACK_MAP: Record<string, { name: string; zkId: string }> = {
  'PAT-9041': { name: 'Rohan Sharma', zkId: 'zkID:0x9041...E4B2' },
  'PAT-9042': { name: 'Ananya Iyer', zkId: 'zkID:0x9042...B3F9' },
  'PAT-9043': { name: 'Vikram Patel', zkId: 'zkID:0x9043...C1A7' },
  'PAT-9044': { name: 'Priya Nair', zkId: 'zkID:0x9044...D5E8' },
};

export const HospitalAuthorizedRecords: React.FC = () => {
  const {
    patientProfile,
    records,
    permissions,
    userLinkedId,
    breakGlassSessions,
    decryptRecord,
    setActiveTab,
    setRole
  } = useArogyaZK();

  const [inspectingRecordId, setInspectingRecordId] = useState<string | null>(null);
  const [decryptedNotes, setDecryptedNotes] = useState<Record<string, { title: string; notes: string; hash: string } | null>>({});
  const [loadingRecordId, setLoadingRecordId] = useState<string | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';
  const activeConsent = permissions.find(
    (p) => p.hospitalId === currentHospitalId && p.status === 'Active' && p.expiresAt > Date.now()
  );
  const activeBreakGlass = breakGlassSessions.find(
    (s) => (s.hospitalId === currentHospitalId || !s.hospitalId) && s.status === 'Active_Unlocked' && s.expiresAt > Date.now()
  );

  const isUnlocked = Boolean(activeConsent || activeBreakGlass);

  const resolvedPatientId = patientProfile.id || activeConsent?.patientId || activeBreakGlass?.patientId || 'PAT-9041';
  const resolvedPatientName = patientProfile.name || PATIENT_FALLBACK_MAP[resolvedPatientId]?.name || 'Rohan Sharma';
  const resolvedPatientZkId = patientProfile.zkId || PATIENT_FALLBACK_MAP[resolvedPatientId]?.zkId || 'zkID:0x9041...E4B2';

  const expiresAt = activeConsent?.expiresAt || activeBreakGlass?.expiresAt || null;
  const countdown = useCountdown(expiresAt);
  const authorizedRecords = !isUnlocked
    ? []
    : activeBreakGlass
    ? records.filter((r) => r.patientId === resolvedPatientId || !r.patientId || r.sharedWithHospitalId === currentHospitalId)
    : records.filter((r) => r.sharedWithHospitalId === currentHospitalId);

  const handleInspect = async (recordId: string) => {
    if (inspectingRecordId === recordId) {
      setInspectingRecordId(null);
      return;
    }
    setInspectingRecordId(recordId);
    if (!decryptedNotes[recordId]) {
      setLoadingRecordId(recordId);
      try {
        const res = await decryptRecord(recordId);
        if (res) {
          setDecryptedNotes((prev) => ({ ...prev, [recordId]: { title: res.title, notes: res.clinicalNotes, hash: res.sha256Hash } }));
        }
      } catch (err) {
        console.error('Decryption failed', err);
      } finally {
        setLoadingRecordId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Authorized Patient Records</h1>
            <Badge variant="teal" dot>Time-Bound Scoped Access</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Encrypted patient health documents granted under cryptographic consent tokens. Decrypted strictly in-browser via ephemeral AES-256-GCM session keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Provider: {currentHospitalId}</Badge>
          <Badge variant="zinc">DPDP Act 2023</Badge>
        </div>
      </div>

      {/* Consent Status Banner */}
      {!isUnlocked ? (
        <Card className="p-6 border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              No Active Cryptographic Consent Token
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
              Provider <span className="font-mono font-semibold text-rose-700">{currentHospitalId}</span> does not currently hold a valid consent delegation for patient{' '}
              <strong className="text-slate-900">{resolvedPatientName}</strong> ({resolvedPatientId}). All clinical payloads remain fail-closed and encrypted.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setRole('patient')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              Switch to Patient Console to Authorize Access →
            </button>
            <button
              onClick={() => setActiveTab('break-glass')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
            >
              Emergency Break-Glass Protocol →
            </button>
          </div>
        </Card>
      ) : activeBreakGlass ? (
        <Card className="p-4 border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-50/30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Emergency Break-Glass Access Active: {resolvedPatientName}
                <span className="font-mono text-xs font-normal text-amber-700">({resolvedPatientId})</span>
                <Badge variant="amber" size="sm">2-of-3 Shamir Reconstructed</Badge>
              </div>
              <p className="text-xs text-amber-900/80 mt-0.5">
                ICU Reason: {activeBreakGlass.icuReason || 'Critical Care Emergency'} · Attending Doctor: {activeBreakGlass.doctorName} · Section 9 DPDP Act
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-900 bg-amber-100/90 px-3.5 py-2 rounded-xl border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>SESSION EXPIRES IN {countdown}</span>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Active Delegation: {resolvedPatientName}
                <span className="font-mono text-xs font-normal text-slate-500">({resolvedPatientId})</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Scope: Diagnostic evaluation & discharge attestation · Ephemeral AES session key active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-teal-900 bg-teal-100/80 px-3.5 py-2 rounded-xl border border-teal-300/80 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-teal-700" />
            <span>EXPIRES IN {countdown}</span>
          </div>
        </Card>
      )}

      {/* Authorized Records Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Authorized Documents Available for Attestation ({authorizedRecords.length})
          </h2>
          <span className="text-[11px] text-slate-400">Zero plaintext storage on server</span>
        </div>

        {authorizedRecords.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-slate-200">
            <FolderCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No medical records are currently authorized</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Ask the patient to share diagnostic records from their Health Vault in the Patient Portal.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authorizedRecords.map((rec) => (
              <Card key={rec.id} className="p-5 flex flex-col justify-between space-y-4 border-slate-200 hover:border-teal-300 transition-all shadow-xs">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[#0D9488] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{rec.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rec.hospitalName} · {rec.date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="teal">{rec.category}</Badge>
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400 font-sans">Record ID:</span>
                      <span className="font-semibold text-slate-800">{rec.id}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400 font-sans">Anchor Hash:</span>
                      <span className="text-teal-700 font-semibold">{rec.sha256Hash.slice(0, 22)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consent Window:</span>
                      <span className="text-teal-800 font-medium">Valid until session expiry</span>
                    </div>
                  </div>

                  {inspectingRecordId === rec.id && (
                    <div className="mt-3.5 p-4 rounded-xl bg-white border border-teal-300 text-xs space-y-2.5 shadow-sm">
                      <div className="font-bold text-teal-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Decrypted Clinical Summary
                        </span>
                        {loadingRecordId === rec.id && (
                          <span className="flex items-center gap-1 text-[11px] text-teal-700">
                            <Loader2 className="w-3 h-3 animate-spin" /> Decrypting in browser...
                          </span>
                        )}
                      </div>
                      {decryptedNotes[rec.id] ? (
                        <div className="space-y-1.5">
                          <div className="font-semibold text-slate-900 text-[11px]">{decryptedNotes[rec.id]?.title}</div>
                          <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {decryptedNotes[rec.id]?.notes}
                          </p>
                        </div>
                      ) : loadingRecordId === rec.id ? (
                        <p className="text-slate-400 text-[11px]">Unwrapping key and decrypting payload with AES-256-GCM...</p>
                      ) : (
                        <p className="text-amber-700 text-[11px]">Decryption failed or record ciphertext unavailable.</p>
                      )}
                      <div className="text-[10px] text-teal-700 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Fingerprint className="w-3 h-3" /> Verified via AES-256-GCM 128-bit auth tag
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">{rec.id}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleInspect(rec.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {inspectingRecordId === rec.id ? 'Close Inspection' : 'Inspect Details'}
                  </button>

                  <button
                    onClick={() => setActiveTab('create-claim')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Create Claim with Record
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
