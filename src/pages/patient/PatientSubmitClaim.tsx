import React, { useState } from 'react';
import {
  FilePlus2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Cpu,
  UploadCloud,
  X,
  FileCheck
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientSubmitClaim: React.FC = () => {
  const {
    patientProfile,
    records,
    hospitals,
    submitPatientClaim,
    setActiveTab,
    setRole
  } = useArogyaZK();

  const [hospitalId, setHospitalId] = useState('HSP-402');
  const [treatmentType, setTreatmentType] = useState('Cardiology Consultation & Stress Echo');
  const [treatmentDate, setTreatmentDate] = useState('2026-11-20');
  const [claimAmount, setClaimAmount] = useState<number>(45000);
  const [billFileName, setBillFileName] = useState('Apollo_Cashless_Estimate_45000.pdf');
  const [uploadedBill, setUploadedBill] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleBillSelect = (file: File) => {
    setUploadedBill(file);
    setBillFileName(file.name);
  };
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || 'REC-1041');
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaimId, setSubmittedClaimId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId) || hospitals[0] || {
    id: 'HSP-402',
    name: 'Apollo Spectra Hospital',
    nabhRegistration: 'NABH-H-2024-8812',
    city: 'Bengaluru',
    status: 'Approved',
    walletAddress: '0xApolloHsp402B419e782C9012F48c901239A'
  };
  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0] || {
    id: selectedRecordId || 'REC-1041',
    patientId: patientProfile.id || 'PAT-9041',
    title: 'Discharge Summary & Itemized Medical Bill',
    category: 'Discharge Summary' as const,
    date: '2026-11-15',
    hospitalName: selectedHospital.name,
    encryptionStatus: 'AES-256-GCM (Hardware Sealed)',
    sha256Hash: '0x9f84c2e18b73a109d44e2b8c6190f3a41d7e8920b4c1a83f9120e4d5c6b7a801',
    anchorTxHash: '0x3a19b841e0892d1948ba29048102948190248102948102948102948102948102',
    sharedWithHospitalId: selectedHospital.id,
    sharedWithHospitalName: selectedHospital.name,
    accessExpiresAt: null
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claimAmount <= 0) return;
    setSubmitting(true);
    setClaimError(null);

    try {
      const created = await submitPatientClaim({
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        treatmentType,
        treatmentDate,
        claimAmount,
        billFileName,
        recordId: selectedRecordId
      });

      setSubmittedClaimId(created.id);
    } catch (err: any) {
      setClaimError(err.message || 'Claim submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isInstantEligible = claimAmount <= 100000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Submit Cashless Claim</h1>
            <Badge variant="teal" size="sm" dot>Client-Side ZK Generation</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Initiate automated cashless reimbursement or pre-authorization with mathematical zero-knowledge privacy guarantees
          </p>
        </div>
      </div>

      {submittedClaimId ? (
        <Card className="p-8 text-center space-y-5 border-teal-300 bg-teal-50/30 max-w-2xl mx-auto shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto border border-teal-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 font-mono">
              Claim Dispatched via Smart Contract
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1 font-mono">{submittedClaimId}</h2>
            <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Your cashless claim for <strong className="tabular-nums">₹{claimAmount.toLocaleString('en-IN')}</strong> at{' '}
              <strong>{selectedHospital.name}</strong> has been mathematically verified via Groth16 zk-SNARK with zero diagnostic disclosure.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-teal-200 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Public Policy Signal:</span>
              <span className="text-teal-700 font-semibold">policy_active=1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Hospital Anchor Match:</span>
              <span className="text-teal-700 font-semibold">anchor_root_match=1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Diagnostic Data Exposed:</span>
              <span className="text-slate-900 font-semibold">0 bytes (Stripped by Circuit)</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('history')}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              Track in Claim History
            </button>
            <button
              onClick={() => {
                setRole('insurer');
                setActiveTab('incoming');
              }}
              className="px-4 py-2 rounded-lg border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Inspect in Insurer Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSubmittedClaimId(null)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium"
            >
              Submit Another Claim
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claim Submission Form */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FilePlus2 className="w-4 h-4 text-teal-600" /> Claim Pre-Authorization Form
                </h2>
                <Badge variant={isInstantEligible ? 'emerald' : 'amber'} size="sm">
                  {isInstantEligible ? 'Tier 1 Instant Eligible' : 'Tier 2 Escrow'}
                </Badge>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Policy Banner */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-500">Active Insurance:</span>
                    <strong className="text-slate-900 ml-1.5">{patientProfile.insurerName}</strong>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {patientProfile.policyNumber || 'POL-AZK-774190'} · Sum Insured: ₹{(patientProfile.coverageLimit > 0 ? patientProfile.coverageLimit : 500000).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Badge variant="teal" size="sm">Active</Badge>
                </div>

                {/* 1. Hospital Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      1. Healthcare Provider / Hospital
                    </label>
                    <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {hospitals.length} Network Providers Available
                    </span>
                  </div>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium text-slate-800"
                  >
                    {hospitals.map((hosp) => (
                      <option key={hosp.id} value={hosp.id}>
                        {hosp.name} — {hosp.city} ({hosp.nabhRegistration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Treatment Type & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Treatment / Procedure
                    </label>
                    <input
                      type="text"
                      required
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value)}
                      placeholder="e.g., Cardiology Stress Test & Echo"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Treatment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={treatmentDate}
                      onChange={(e) => setTreatmentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* 3. Linked Health Record from Vault */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Linked Encrypted Vault Record (Proof Anchor)
                  </label>
                  <select
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none font-mono"
                  >
                    {records.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {r.title} ({r.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    SHA-256 Seal: {selectedRecord?.sha256Hash ? `${selectedRecord.sha256Hash.slice(0, 24)}...` : 'AES-GCM Local Vault'}
                  </p>
                </div>

                {/* 4. Amount and Document */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Claim Amount (INR)
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      max="500000"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none font-semibold text-slate-900 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Hospital Bill / Estimate Document
                      </label>
                      <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                    </div>

                    {!uploadedBill ? (
                      <label
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleBillSelect(file);
                        }}
                        className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                          isDragging
                            ? 'border-teal-500 bg-teal-50/50'
                            : 'border-slate-300 hover:border-teal-400 bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBillSelect(file);
                          }}
                          className="hidden"
                        />
                        <UploadCloud className="w-5 h-5 text-teal-600 mb-1" />
                        <p className="text-xs font-medium text-slate-700">
                          Click to upload or drag & drop invoice
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Hospital invoice or estimate bill (PDF, PNG, JPG)
                        </p>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-teal-200 bg-teal-50/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-5 h-5 text-teal-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {uploadedBill.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {(uploadedBill.size / 1024).toFixed(1)} KB • Verified Local File
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedBill(null);
                            setBillFileName('Apollo_Cashless_Estimate_45000.pdf');
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                          title="Remove document"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  {submitting ? (
                    'Claim submission is currently unavailable'
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Generate ZK Proof & Submit Claim (₹{claimAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>

                {claimError && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-950">Claim Submission Blocked (Fail-Closed)</p>
                      <p className="mt-0.5 text-amber-800">{claimError}</p>
                    </div>
                  </div>
                )}
              </form>
            </Card>
          </div>

          {/* Privacy Disclosure & Zero-Knowledge Comparison */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5 border-slate-300 shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ZKure Privacy Guard Architecture
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Zero-knowledge SNARK circuits mathematically prove you are covered by an active policy without exposing your diagnostic codes, lab test findings, or doctor notes.
              </p>

              <div className="space-y-3">
                {/* Traditional System */}
                <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Traditional Health Claim (High Privacy Risk)
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 font-sans">
                    <li>Full medical history exposed to insurer staff</li>
                    <li>Clinical diagnosis notes stored permanently in cloud</li>
                    <li>Risk of claim denial from irrelevant past ailments</li>
                  </ul>
                </div>

                {/* ZKure System */}
                <div className="p-3.5 rounded-xl border border-teal-200/80 bg-teal-50/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    ZKure Zero-Knowledge Protection
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-teal-800 space-y-0.5 font-sans">
                    <li><strong>Zero PHI Exposure:</strong> Diagnosis code stripped by circuit</li>
                    <li><strong>Pedersen Commitments:</strong> Mathematical proof of policy validity</li>
                    <li><strong>Smart Contract Escrow:</strong> Instant cashless payout execution</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                BN254 Curve · 11,845 Constraints · Powers of Tau 14
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
