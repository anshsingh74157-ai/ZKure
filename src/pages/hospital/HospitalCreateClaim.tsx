import React, { useState } from 'react';
import {
  FilePlus2,
  Building2,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Upload,
  X,
  FileCheck
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const PATIENT_FALLBACK_MAP: Record<string, { name: string; zkId: string }> = {
  'PAT-9041': { name: 'Rohan Sharma', zkId: 'zkID:0x9041...E4B2' },
  'PAT-9042': { name: 'Ananya Iyer', zkId: 'zkID:0x9042...B3F9' },
  'PAT-9043': { name: 'Vikram Patel', zkId: 'zkID:0x9043...C1A7' },
  'PAT-9044': { name: 'Priya Nair', zkId: 'zkID:0x9044...D5E8' },
};

export const HospitalCreateClaim: React.FC = () => {
  const {
    patientProfile,
    permissions,
    records,
    claims,
    breakGlassSessions,
    submitHospitalClaim,
    userLinkedId,
    setRole,
    setActiveTab
  } = useArogyaZK();

  const [step, setStep] = useState<number>(1);
  const [searchPatientId, setSearchPatientId] = useState('PAT-9041');
  const [diagnosisCode, setDiagnosisCode] = useState('ICD-10: K35.80 (Acute Laparoscopic Care)');
  const [diagnosisSummary, setDiagnosisSummary] = useState(
    'Inpatient surgical care and post-operative monitoring'
  );
  const [treatmentDate, setTreatmentDate] = useState('2026-11-22');
  const [billFileName, setBillFileName] = useState('Apollo_Discharge_Bill_2026.pdf');
  const [uploadedInvoice, setUploadedInvoice] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [claimAmount, setClaimAmount] = useState(64000);
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || 'REC-1041');
  const [submitting, setSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';
  const targetPatientId = searchPatientId.trim() || patientProfile.id || 'PAT-9041';

  const activeConsent = permissions.find(
    (p) => p.hospitalId === currentHospitalId && (p.patientId === targetPatientId || !p.patientId) && p.status === 'Active' && p.expiresAt > Date.now()
  );
  const activeBreakGlass = breakGlassSessions.find(
    (s) => (s.hospitalId === currentHospitalId || !s.hospitalId) && s.patientId === targetPatientId && s.status === 'Active_Unlocked' && s.expiresAt > Date.now()
  );

  const isAuthorized = Boolean(activeConsent || activeBreakGlass);

  const resolvedPatientId = targetPatientId;
  const resolvedPatientName = patientProfile.id === targetPatientId && patientProfile.name
    ? patientProfile.name
    : PATIENT_FALLBACK_MAP[resolvedPatientId]?.name || 'Rohan Sharma';
  const resolvedPatientZkId = patientProfile.id === targetPatientId && patientProfile.zkId
    ? patientProfile.zkId
    : PATIENT_FALLBACK_MAP[resolvedPatientId]?.zkId || `zkID:0x${resolvedPatientId.replace(/[^a-zA-Z0-9]/g, '')}...E4B2`;

  const authorizedRecords = !isAuthorized
    ? []
    : activeBreakGlass
    ? records.filter((r) => r.patientId === resolvedPatientId || !r.patientId || r.sharedWithHospitalId === currentHospitalId)
    : records.filter((r) => (r.sharedWithHospitalId === currentHospitalId && (r.patientId === resolvedPatientId || !r.patientId)) || (activeConsent?.recordIds && activeConsent.recordIds.includes(r.id)));

  const handleInvoiceSelect = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
      setInvoiceError('Unsupported file type. Please upload a PDF, Image, or Word Document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setInvoiceError('File is too large. Maximum size is 10MB.');
      return;
    }

    if (file.size === 0) {
      setInvoiceError('Selected file is empty (0 bytes).');
      return;
    }

    setInvoiceError(null);
    setUploadedInvoice(file);
    setBillFileName(file.name);
  };

  const handleGenerateClaim = async () => {
    if (!isAuthorized) return;
    setSubmitting(true);
    setClaimError(null);
    try {
      const created = await submitHospitalClaim({
        patientId: resolvedPatientId,
        diagnosisCode,
        diagnosisSummary,
        treatmentDate,
        billFileName,
        claimAmount,
        recordId: selectedRecordId || authorizedRecords[0]?.id || 'REC-1041'
      });
      setLastCreatedId(created.id);
      setStep(5);
    } catch (err: any) {
      setClaimError(err.message || 'Claim generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Zero-Knowledge Insurance Claim</h1>
            <Badge variant="teal" dot>Dual-Key Groth16 Prover</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Healthcare provider attests treatment and expense validity. Groth16 zk-SNARK strips private clinical diagnostics before insurer dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Hospital: {currentHospitalId}</Badge>
          <Badge variant="purple">BN254 Pairing Check</Badge>
        </div>
      </div>

      {!isAuthorized ? (
        <Card className="p-5 border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Active Consent Delegation Required
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                  Patient {resolvedPatientId} has not granted a valid authorization token to {currentHospitalId}. Providers cannot attest claims without valid patient consent or active emergency break-glass quorum.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setRole('patient')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Switch to Patient Portal to Grant Access →
              </button>
              <button
                onClick={() => setActiveTab('break-glass')}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Emergency Break-Glass Protocol →
              </button>
            </div>
          </div>
        </Card>
      ) : activeBreakGlass ? (
        <Card className="p-4 border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-50/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="text-amber-900">Emergency Break-Glass Authorization Verified:</strong> {resolvedPatientName} ({resolvedPatientId}) with {authorizedRecords.length} accessible document(s). 2-of-3 Shamir Quorum Active.
            </span>
          </div>
          <Badge variant="amber" dot>Emergency Quorum Active</Badge>
        </Card>
      ) : (
        <Card className="p-4 border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong className="text-slate-900">Active Patient Consent Verified:</strong> {resolvedPatientName} ({resolvedPatientId}) with {authorizedRecords.length} accessible document(s).
            </span>
          </div>
          <Badge variant="teal" dot>Token Active</Badge>
        </Card>
      )}

      {/* Main Attestation Stepped Form */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-teal-600" /> 5-Stage Claim Attestation Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically seal clinical proof and dispatch to insurer
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : step > s
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stage 1: Patient Identifier (Registered ABHA / ZK ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-slate-50/50"
                />
                <span className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1.5 border border-slate-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" /> {resolvedPatientName}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stage 2: Linked Authorized Health Vault Record
              </label>
              <select
                disabled={!isAuthorized}
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                {authorizedRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.title} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Stage 3: Clinical Diagnosis (Stripped by ZK Circuit)</span>
                <span className="text-[10px] text-teal-700 font-mono">Hidden from Insurer</span>
              </label>
              <input
                type="text"
                disabled={!isAuthorized}
                value={diagnosisCode}
                onChange={(e) => setDiagnosisCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs mb-2 disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white font-mono"
                placeholder="ICD-10 Diagnosis Code"
              />
              <input
                type="text"
                disabled={!isAuthorized}
                value={diagnosisSummary}
                onChange={(e) => setDiagnosisSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                placeholder="Clinical procedure description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Treatment Date
                </label>
                <input
                  type="date"
                  disabled={!isAuthorized}
                  value={treatmentDate}
                  onChange={(e) => setTreatmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Stage 4: Amount (INR)</span>
                  <Badge variant={claimAmount <= 100000 ? 'teal' : 'navy'}>
                    {claimAmount <= 100000 ? 'Tier 1 Instant' : 'Tier 2 High-Value'}
                  </Badge>
                </label>
                <input
                  type="number"
                  disabled={!isAuthorized}
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs disabled:bg-slate-100 font-bold text-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Hospital Invoice Itemization & Discharge Summary
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  PDF, JPG, PNG up to 10MB
                </span>
              </div>

              {!uploadedInvoice ? (
                <label
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (!isAuthorized) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleInvoiceSelect(file);
                  }}
                  className={`flex flex-col items-center justify-center w-full p-5 border-2 border-dashed rounded-xl transition-all ${
                    !isAuthorized
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
                      : isDragging
                      ? 'border-teal-500 bg-teal-50/60 cursor-pointer shadow-sm'
                      : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer'
                  }`}
                >
                  <input
                    type="file"
                    disabled={!isAuthorized}
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleInvoiceSelect(file);
                      e.target.value = '';
                    }}
                  />
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">
                      Click to upload invoice document or drag & drop
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Standard NABH discharge bill, itemized pharmacy receipt, or operative statement
                    </div>
                    {billFileName && (
                      <div className="text-[11px] text-teal-700 font-mono bg-teal-50/80 px-2.5 py-0.5 rounded border border-teal-200/60 mt-1">
                        Attached default: {billFileName}
                      </div>
                    )}
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-teal-300 bg-teal-50/70 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {uploadedInvoice.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{(uploadedInvoice.size / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span className="text-teal-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Document Verified & Ready for Attestation
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadedInvoice(null);
                      setBillFileName('Apollo_Discharge_Bill_2026.pdf');
                      setInvoiceError(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove attached invoice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {invoiceError && (
                <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{invoiceError}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-800">Stage 5: Dual-Key Attestation Proof:</strong>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Merges hospital EdDSA signature and patient consent token into a Groth16 SNARK proof over BN254. Verifies policy coverage without transmitting <code className="text-teal-700 font-semibold">{diagnosisCode}</code> to the insurer.
              </p>
            </div>

            <button
              onClick={handleGenerateClaim}
              disabled={!isAuthorized || submitting}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Generating Groth16 Proof & Disagreeing PHI...
                </>
              ) : (
                <>
                  <FilePlus2 className="w-4 h-4" />
                  Sign Claim Digest & Dispatch to Insurer
                </>
              )}
            </button>

            {claimError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">Claim Generation Blocked (Fail-Closed)</p>
                  <p className="mt-0.5 text-amber-800">{claimError}</p>
                </div>
              </div>
            )}

            {lastCreatedId && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Claim {lastCreatedId} successfully generated with ZK proof!
                </span>
                <button
                  onClick={() => {
                    setRole('insurer');
                    setActiveTab('incoming');
                  }}
                  className="underline font-bold text-slate-900 flex items-center gap-1 hover:text-teal-700"
                >
                  Inspect in Insurer Console →
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
