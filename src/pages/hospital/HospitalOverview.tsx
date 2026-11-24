import React, { useState } from 'react';
import {
  Building2,
  FilePlus2,
  FolderCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Eye,
  FileText,
  Activity,
  Layers,
  Cpu,
  KeyRound,
  ExternalLink,
  Users,
  Shield,
  Coins,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { useCountdown } from '../../hooks/useCountdown';
import { InsuranceClaim } from '../../types';

export const HospitalOverview: React.FC = () => {
  const { records, claims, permissions, hospitals, userLinkedId, breakGlassSessions, setActiveTab } = useArogyaZK();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);
  const [inspectingClaim, setInspectingClaim] = useState<InsuranceClaim | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';
  const currentHospital = hospitals.find((h) => h.id === currentHospitalId) || {
    id: currentHospitalId,
    name:
      currentHospitalId === 'HSP-219'
        ? 'Fortis Diagnostics'
        : currentHospitalId === 'HSP-308'
        ? 'Sankara Eye Centre'
        : currentHospitalId === 'HSP-512'
        ? 'Max Super Speciality'
        : 'Apollo Spectra Hospital',
    nabhRegistration: 'NABH-H-2024-8812',
    city: 'Bengaluru',
    status: 'Verified',
    walletAddress: '0xApolloHsp402B419e782C9012F48'
  };

  const activeConsents = permissions.filter(
    (p) => p.hospitalId === currentHospitalId && p.status === 'Active' && p.expiresAt > Date.now()
  );
  const activeBreakGlass = breakGlassSessions.find(
    (s) => (s.hospitalId === currentHospitalId || !s.hospitalId) && s.status === 'Active_Unlocked' && s.expiresAt > Date.now()
  );
  const isUnlocked = Boolean(activeConsents.length > 0 || activeBreakGlass);
  const scopedRecords = !isUnlocked
    ? []
    : activeBreakGlass
    ? records.filter((r) => r.patientId === activeBreakGlass.patientId || (!r.patientId && r.sharedWithHospitalId === currentHospitalId))
    : records.filter((r) => r.sharedWithHospitalId === currentHospitalId && (r.accessExpiresAt ? r.accessExpiresAt > Date.now() : true));
  const hospitalPermissions = permissions.filter((p) => p.hospitalId === currentHospitalId);
  const hospitalClaims = claims.filter((c) => c.hospitalId === currentHospitalId);
  const settledClaims = hospitalClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled');
  const totalSettledAmount = settledClaims.reduce((acc, c) => acc + c.claimAmount, 0);

  const workflowSteps = [
    {
      step: 1,
      title: 'Patient Grants Scoped Consent',
      subtitle: 'Time-bounded cryptographic access token',
      icon: Lock,
      color: 'teal',
      summary:
        'The patient uses their mobile app or web portal to sign a 3-hour or 12-hour cryptographic consent token for Apollo Spectra. They specify exactly which health records are accessible.',
      technicalDetails: [
        'Client-side ECDSA signature over consent scope manifest',
        'Scoped to hospital NABH ID & session expiration timestamp',
        'No plaintext health records are transferred unencrypted',
        'Revocable at any moment by the patient on-chain'
      ],
      inputOutput: {
        input: 'Patient Private Key + Hospital ID (HSP-402) + Record IDs [REC-1041, REC-1038]',
        output: 'Consent Token PRM-301 (Valid 12h, Zero third-party decryption)'
      }
    },
    {
      step: 2,
      title: 'Hospital Attests Diagnosis Locally',
      subtitle: 'In-vault clinical evaluation & doctor signature',
      icon: FileText,
      color: 'navy',
      summary:
        'The attending physician inspects authorized records in the hospital secure enclave. Diagnosis codes (e.g. ICD-10 K35.80) and bill hashes are attested locally with the hospital’s EdDSA key.',
      technicalDetails: [
        'Local client-side decryption using ephemeral consent key',
        'SHA-256 digest computation over medical notes & invoice',
        'EdDSA BabyJubjub signature generated in browser memory',
        'Private health info (PHI) never leaves hospital perimeter'
      ],
      inputOutput: {
        input: 'Decrypted Clinical Record + ICD-10 Diagnosis Code + Invoice Amount INR 64,000',
        output: 'Doctor EdDSA Signature (0x7a81...b2) + Medical Digest Hash'
      }
    },
    {
      step: 3,
      title: 'Groth16 Strips PHI',
      subtitle: 'Succinct zero-knowledge proof generation',
      icon: Cpu,
      color: 'indigo',
      summary:
        'The ZKure prover executes an 11,845 R1CS constraint Circom circuit. It proves that the diagnosis is valid, procedure is covered by patient policy, and doctor is accredited, without revealing the actual disease or name.',
      technicalDetails: [
        '11,845 R1CS constraints verified on BN254 elliptic curve',
        'Patient identity replaced by cryptographic nullifier hash',
        'Raw diagnosis code replaced by boolean eligibility flag',
        'Generates 3 proof points (pi_a, pi_b, pi_c) in < 2 seconds'
      ],
      inputOutput: {
        input: 'Private Witness: Patient Name, Raw ICD-10 Code, Medical Notes, Hospital Key',
        output: 'Public Signals: Nullifier Hash, Coverage Flag = 1, Bonded Hospital = True'
      }
    },
    {
      step: 4,
      title: 'Instant Settlement',
      subtitle: 'On-chain verification & automated disbursement',
      icon: Coins,
      color: 'emerald',
      summary:
        'The insurer privacy guard verifies the Groth16 proof against the ClaimSettlement.sol smart contract. Because the proof guarantees full compliance, reimbursement is instantly released to the hospital account.',
      technicalDetails: [
        'Instant Tier-1 settlement for verified claims <= INR 1,00,000',
        'Nullifier registered on-chain to permanently eliminate double billing',
        'Zero manual paperwork, zero delayed adjudication',
        'Compliant with IRDAI regulatory standards and ABDM guidelines'
      ],
      inputOutput: {
        input: 'Groth16 Proof (pi_a, pi_b, pi_c) + Public Signals + Contract Call',
        output: 'Automated INR Reimbursement to Hospital Wallet + TX Hash on Ledger'
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{currentHospital.name}</h1>
                <Badge variant="teal" size="sm" dot>NABH Accredited</Badge>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentHospital.id}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Accredited Provider Portal · Zero-Knowledge Attestation Gateway · {currentHospital.city}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('patients')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-teal-600" />
            <span>Patients</span>
          </button>
          <button
            onClick={() => setActiveTab('authorized')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-2xs hover:bg-teal-100/60 transition-colors"
          >
            <FolderCheck className="h-3.5 w-3.5" />
            <span>Authorized ({scopedRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('create-claim')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            <span>Attest & Create Claim</span>
          </button>
        </div>
      </div>

      {/* Security Status Bar */}
      <div className="rounded-xl border border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-slate-50 p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-teal-900 font-medium">
            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
            <span>
              <strong>Cryptographic Protection Active:</strong> Medical records remain confidential in local storage. Only zero-knowledge proofs and EdDSA digests are transmitted to insurance privacy guards.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              EdDSA Node Active
            </span>
            <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              Bonded Collateral: ₹5,00,000
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('authorized')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Consent-Scoped Records</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
              <FolderCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">{scopedRecords.length}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-700 font-medium">
            <Lock className="h-3 w-3" /> Encrypted Vault Stored
          </div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('patients')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Patient Consents</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums">{activeConsents.length}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3 text-emerald-600" /> Time-bounded access tokens
          </div>
        </Card>

        <Card
          hoverable
          className="p-4"
          onClick={() => setActiveTab('submitted')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Claims Submitted</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">{hospitalClaims.length}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <span>Dual-key attestation ledger</span>
          </div>
        </Card>

        <Card
          hoverable
          className="p-4 bg-teal-50/20 border-teal-200/80"
          onClick={() => setActiveTab('submitted')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Settled Reimbursements</span>
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800 border border-teal-200/60">
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-teal-700 font-mono tabular-nums">
            ₹{totalSettledAmount > 0 ? totalSettledAmount.toLocaleString('en-IN') : '64,000'}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-teal-700 font-medium">
            <CheckCircle2 className="h-3 w-3" /> Instant On-Chain Payouts
          </div>
        </Card>
      </div>

      {/* Interactive Architecture Guide: How ZKure Hospital Claims Work */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                ZKure Zero-Knowledge Adjudication Pipeline
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              4-stage cryptographic pipeline that guarantees zero patient PHI disclosure while delivering automated cashless settlement
            </p>
          </div>
          <button
            onClick={() => setActiveTab('verification')}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1"
          >
            Cryptographic Simulator <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Step Navigation Pill Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {workflowSteps.map((stepItem) => {
            const Icon = stepItem.icon;
            const isSelected = activeWorkflowStep === stepItem.step;
            return (
              <button
                key={stepItem.step}
                onClick={() => setActiveWorkflowStep(stepItem.step)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/70 shadow-2xs ring-1 ring-teal-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {stepItem.step}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {stepItem.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{stepItem.subtitle}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep Dive Panel */}
        {(() => {
          const currentStep = workflowSteps.find((s) => s.step === activeWorkflowStep) || workflowSteps[0];
          const StepIcon = currentStep.icon;

          return (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white shrink-0 mt-0.5">
                    <StepIcon className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                        Stage {currentStep.step} of 4
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{currentStep.title}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {currentStep.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentStep.step === 1 && (
                    <button
                      onClick={() => setActiveTab('patients')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      View Patient Directory
                    </button>
                  )}
                  {currentStep.step === 2 && (
                    <button
                      onClick={() => setActiveTab('authorized')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-2xs"
                    >
                      Inspect Authorized Records
                    </button>
                  )}
                  {currentStep.step === 3 && (
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      Inspect Groth16 Prover
                    </button>
                  )}
                  {currentStep.step === 4 && (
                    <button
                      onClick={() => setActiveTab('submitted')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-2xs"
                    >
                      View Settlement Ledger
                    </button>
                  )}
                </div>
              </div>

              {/* Technical Specifications & Input/Output */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                    <Shield className="w-3.5 h-3.5 text-teal-600" /> Cryptographic Guarantees
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {currentStep.technicalDetails.map((td, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{td}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 font-mono text-xs space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-teal-600" /> Pipeline I/O Telemetry
                  </h4>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 font-sans block mb-0.5 uppercase tracking-wider">
                      Input Payload:
                    </span>
                    <span className="text-slate-800 text-[11px] break-all">
                      {currentStep.inputOutput.input}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-teal-50/50 border border-teal-100">
                    <span className="text-[10px] font-bold text-teal-700 font-sans block mb-0.5 uppercase tracking-wider">
                      Verified Output Artifact:
                    </span>
                    <span className="text-teal-900 text-[11px] break-all font-semibold">
                      {currentStep.inputOutput.output}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Two Column Grid: Active Patient Consents & Recent Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Patient Consents Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" /> Active Patient Access Consents
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Patients who have granted temporary cryptographic read tokens to {currentHospital.name}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('patients')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              All Directory →
            </button>
          </div>

          <div className="space-y-3">
            {hospitalPermissions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No active patient permissions on record.
              </div>
            ) : (
              hospitalPermissions.slice(0, 3).map((perm) => (
                <div
                  key={perm.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{perm.hospitalName}</span>
                      <Badge variant={perm.status === 'Active' ? 'emerald' : 'amber'} size="sm">
                        {perm.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>{perm.id}</span>
                      <span>•</span>
                      <span>{perm.recordIds.length} Record(s) permitted</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('authorized')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors shadow-2xs"
                  >
                    View Records
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Claims Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> Recent Claims Dispatched
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Two-Party Zero-Knowledge attestations submitted to insurers
              </p>
            </div>
            <button
              onClick={() => setActiveTab('submitted')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Full Ledger →
            </button>
          </div>

          <div className="space-y-3">
            {hospitalClaims.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No claims submitted yet.
              </div>
            ) : (
              hospitalClaims.slice(0, 3).map((claim) => (
                <div
                  key={claim.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">{claim.id}</span>
                      <Badge
                        variant={
                          claim.status === 'Approved' || claim.status === 'Settled'
                            ? 'emerald'
                            : claim.status === 'Pending'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                        dot
                      >
                        {claim.status}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
                        ₹{claim.claimAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <span>Patient: {claim.patientMaskedId || claim.patientId}</span>
                      <span>•</span>
                      <span>{claim.insurerName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectingClaim(claim)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors shadow-2xs inline-flex items-center gap-1"
                  >
                    <Cpu className="w-3 h-3 text-teal-600" />
                    Inspect
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Proof Inspector Modal */}
      <ProofInspectorModal
        claim={inspectingClaim}
        isOpen={!!inspectingClaim}
        onClose={() => setInspectingClaim(null)}
      />
    </div>
  );
};
