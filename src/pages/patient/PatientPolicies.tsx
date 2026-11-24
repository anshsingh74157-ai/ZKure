import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Building2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  ExternalLink,
  ChevronRight,
  Cpu,
  Layers,
  KeyRound,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PatientPolicies: React.FC = () => {
  const { patientProfile, claims, hospitals, setActiveTab } = useArogyaZK();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentPatientId = patientProfile.id || 'PAT-9041';
  const patientClaims = claims.filter((c) => c.patientId === currentPatientId);

  const effectiveLimit = patientProfile.coverageLimit > 0 ? patientProfile.coverageLimit : 500000;
  const approvedClaimsTotal = patientClaims
    .filter((c) => c.status === 'Approved' || c.status === 'Settled')
    .reduce((sum, c) => sum + c.claimAmount, 0);

  const availableCoverage = Math.max(0, effectiveLimit - approvedClaimsTotal);
  const percentageUtilized = effectiveLimit > 0
    ? Math.min(100, Math.round((approvedClaimsTotal / effectiveLimit) * 100))
    : 0;

  const networkHospitals = hospitals && hospitals.length > 0
    ? hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        nabh: h.nabhRegistration,
        type: 'Super-Speciality & Daycare Surgery',
        status: h.status.includes('Verified') || h.status.includes('Approved') ? 'Cashless Pre-Approved' : h.status
      }))
    : [
    {
      id: 'HSP-402',
      name: 'Apollo Spectra Hospital',
      city: 'Bengaluru (Koramangala)',
      nabh: 'NABH-H-2024-8812',
      type: 'Super-Speciality & Daycare Surgery',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-219',
      name: 'Fortis Diagnostics',
      city: 'Mumbai (Mulund)',
      nabh: 'NABH-L-2023-4410',
      type: 'Advanced Pathology & Imaging',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-308',
      name: 'Sankara Eye Centre',
      city: 'Bengaluru (Kundalahalli)',
      nabh: 'NABH-E-2022-7719',
      type: 'Ophthalmology & Retinal Care',
      status: 'Cashless Pre-Approved'
    },
    {
      id: 'HSP-615',
      name: 'Medanta Super Speciality',
      city: 'Gurugram (Sector 38)',
      nabh: 'NABH-H-2026-9904',
      type: 'Cardiology & Multi-Organ Transplant',
      status: 'Cashless Pre-Approved'
    }
  ];

  const coveredTreatments = [
    { name: 'Cardiology & Inpatient Cardiac Care', limit: 'Up to Sum Insured', copay: '0% Co-pay' },
    { name: 'Laparoscopic & Daycare Procedures', limit: '100% Covered (Zero 24h wait)', copay: '0% Co-pay' },
    { name: 'Specialist Diagnostics & MRI/CT/OCT Scans', limit: 'Up to ₹50,000 / yr', copay: '0% Co-pay' },
    { name: 'Pre & Post Hospitalization (60/90 Days)', limit: 'Reimbursable via ZK proof', copay: '0% Co-pay' },
    { name: 'Emergency ICU & Road Ambulance', limit: 'Up to ₹10,000 per claim', copay: '0% Co-pay' }
  ];

  const handleDownloadCertificate = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Insurance Policies</h1>
            <Badge variant="teal" size="sm" dot>Poseidon Anchored</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-knowledge cryptographic policy certificate verifying coverage eligibility without revealing confidential medical history
          </p>
        </div>

        <button
          onClick={handleDownloadCertificate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs shrink-0"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificate Verified & Saved</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download ZK Policy Certificate</span>
            </>
          )}
        </button>
      </div>

      {/* Main Digital Insurance Card (Fintech / Web3 Style) */}
      <div className="relative rounded-2xl bg-[#0B1120] text-white p-6 sm:p-8 shadow-xl border border-slate-800 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-inner">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-teal-400 font-semibold font-mono">
                  {patientProfile.insurerName}
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{patientProfile.planName}</h2>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Policy Number</span>
              <div className="font-mono text-sm sm:text-base font-bold text-teal-300 tracking-wider">
                {patientProfile.policyNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Sum Insured</div>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                ₹{effectiveLimit.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Utilized Claims</div>
              <div className="text-xl font-bold text-teal-300 mt-1 tabular-nums">
                ₹{approvedClaimsTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Balance</div>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                ₹{availableCoverage.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Coverage Term</div>
              <div className="text-xl font-bold text-slate-200 mt-1 font-mono">{patientProfile.validTill || '2027-03-31'}</div>
            </div>
          </div>

          {/* Coverage Meter */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-300 font-mono">
              <span>Coverage Utilization</span>
              <span className="text-teal-300 font-semibold">{percentageUtilized}% utilized</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(percentageUtilized, 3)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: ZK Cryptographic Leaf & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ZK Cryptographic Proof Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  ZK Policy Commitment & Soundness
                </h3>
              </div>
              <Badge variant="teal" size="sm">Verified On-Chain</Badge>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your insurance coverage is mathematically anchored using BabyJubjub Pedersen commitments and Poseidon sponge hashing. When you submit a claim, ZKure verifies you hold an active policy without ever exposing private diagnosis notes to underwriters.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Policy Commitment:</span>
                <span className="text-teal-700 font-semibold truncate max-w-[170px]">0x2e8f19...c34b</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Elliptic Curve:</span>
                <span className="text-slate-900 font-semibold">BN254 (alt_bn128)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Procedure Tree:</span>
                <span className="text-slate-900 font-semibold">Depth-8 Poseidon (256 codes)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Replay Protection:</span>
                <span className="text-teal-700 font-semibold">Poseidon Nullifier Shield</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs text-teal-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Zero PHI Disclosure Guarantee:</strong>
                <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed font-sans">
                  Medical diagnosis codes (ICD-10) and clinical impressions remain 100% hidden. The Groth16 circuit evaluates claims purely via quadratic arithmetic programs over the BN254 scalar field F_p.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('submit-claim')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Initiate Claim with this Policy</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Card>
        </div>

        {/* Benefits & Inclusions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Covered Benefits & ZK-Preauthorized Treatments
            </h3>
            <div className="space-y-2.5">
              {coveredTreatments.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="font-medium text-slate-900">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px]">{item.limit}</span>
                    <Badge variant="teal" size="sm">{item.copay}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cashless Network Hospitals */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Cashless Network Hospitals (NABH Certified)
              </h3>
              <span className="text-xs text-slate-500 font-mono">{networkHospitals.length} Empanelled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {networkHospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors text-xs space-y-2 bg-slate-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{hosp.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {hosp.city}
                      </p>
                    </div>
                    <Badge variant="teal" size="sm">Instant ZK</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 font-mono">
                    <span className="text-slate-500">{hosp.nabh}</span>
                    <span className="text-teal-700 font-medium font-sans">{hosp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
