import React, { useState } from 'react';
import {
  Lock,
  Plus,
  FileText,
  KeyRound,
  ShieldCheck,
  FileCheck2,
  Clock,
  ArrowRight,
  Shield,
  Eye,
  CheckCircle2,
  Cpu,
  Sparkles,
  ExternalLink,
  Zap,
  LockKeyhole,
  FilePlus2,
  QrCode,
  Fingerprint,
  Copy,
  Check,
  Upload,
  AlertCircle,
  HelpCircle,
  FolderLock,
  Receipt,
  UserCheck
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ClaimTimeline } from '../../components/common/ClaimTimeline';
import { ProofInspectorModal } from '../../components/common/ProofInspectorModal';
import { MedicalRecord, InsuranceClaim } from '../../types';

export const PatientOverview: React.FC = () => {
  const {
    setActiveTab,
    patientProfile,
    records,
    permissions,
    claims,
    revokeHospitalAccess
  } = useArogyaZK();

  const [inspectingClaim, setInspectingClaim] = useState<InsuranceClaim | null>(null);
  const [copiedDid, setCopiedDid] = useState(false);

  const currentPatientId = patientProfile.id || 'PAT-9041';
  const patientClaims = claims.filter((c) => c.patientId === currentPatientId);
  const totalClaims = patientClaims.length;
  const approvedClaims = patientClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled').length;
  const pendingClaims = patientClaims.filter((c) => c.status === 'Pending').length;
  const sharedRecords = records.filter((r) => r.sharedWithHospitalId !== null);
  const privateOnlyRecords = records.filter((r) => r.sharedWithHospitalId === null);
  const latestClaim = patientClaims[0];

  const handleCopyDid = () => {
    navigator.clipboard.writeText(`did:zkure:${patientProfile.id || 'PAT-9041'}`);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const effectiveLimit = patientProfile.coverageLimit > 0 ? patientProfile.coverageLimit : 500000;
  const approvedClaimsTotal = approvedClaims > 0
    ? patientClaims.filter((c) => c.status === 'Approved' || c.status === 'Settled').reduce((sum, c) => sum + c.claimAmount, 0)
    : 0;
  const remainingCoverage = Math.max(0, effectiveLimit - approvedClaimsTotal);
  const usedCoveragePercent = Math.min(100, Math.round((approvedClaimsTotal / effectiveLimit) * 100));

  // Determine active permissions
  const activePermissions = permissions.filter(
    (p) => (!p.patientId || p.patientId === currentPatientId) && p.status === 'Active' && p.expiresAt > Date.now()
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Friendly Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {(patientProfile.name || 'Rohan Sharma').split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your health records are completely private. Only you decide who can view them.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('submit-claim')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-teal-200" />
            File a Claim
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-300" />
            Upload PDF / Record
          </button>
        </div>
      </div>

      {/* Digital Health Insurance Pass */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#1e293b] border border-slate-700/60 p-6 text-white shadow-xl">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Health Insurance
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ABHA ID: 91-8402-9182-4410
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">
                Provider: <strong className="text-white">{patientProfile.insurerName}</strong>
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Policy Holder</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {patientProfile.name}
              </h2>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span>Policy Number: <strong className="font-mono text-white">{patientProfile.policyNumber}</strong></span>
                <span>·</span>
                <span>Plan: <strong className="text-white">{patientProfile.planName}</strong></span>
                <span>·</span>
                <span>Valid Until: <strong className="text-white">{patientProfile.validTill}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleCopyDid}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/10 transition-colors font-mono cursor-pointer"
                title="Click to copy your unique digital identity ID"
              >
                {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>ID: {patientProfile.id}</span>
              </button>
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-300 bg-teal-500/15 px-3 py-1.5 rounded-lg border border-teal-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Zero-Knowledge Privacy Shield Active</span>
              </div>
            </div>
          </div>

          {/* Cashless Coverage Gauge */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 min-w-[280px] lg:max-w-xs space-y-3 backdrop-blur-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Available Coverage
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                {100 - usedCoveragePercent}% Left
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                ₹{remainingCoverage.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                out of ₹{effectiveLimit.toLocaleString('en-IN')} total limit
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, 100 - usedCoveragePercent)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>₹{approvedClaimsTotal.toLocaleString('en-IN')} Used</span>
              <span>₹{effectiveLimit.toLocaleString('en-IN')} Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Clean Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Privacy Status */}
        <Card className="p-4 bg-teal-50/50 border-teal-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">Privacy Status</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-teal-950 mt-2">
            100% Private
          </div>
          <p className="text-xs text-teal-800 mt-1">
            {activePermissions.length > 0
              ? `${activePermissions.length} hospital authorized with time limits.`
              : 'Vault locked. Zero external parties have access.'}
          </p>
        </Card>

        {/* Card 2: Saved Records */}
        <Card
          hoverable
          className="p-4 cursor-pointer"
          onClick={() => setActiveTab('vault')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Health Records</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {records.length} Documents
          </div>
          <div className="text-xs text-teal-700 font-semibold mt-1 flex items-center gap-1">
            <span>View Vault</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Card>

        {/* Card 3: Claims Status */}
        <Card
          hoverable
          className="p-4 cursor-pointer"
          onClick={() => setActiveTab('history')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Insurance Claims</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {totalClaims} Claims Filed
          </div>
          <div className="text-xs text-slate-600 mt-1">
            <strong className="text-emerald-700">{approvedClaims} settled</strong> · {pendingClaims} in review
          </div>
        </Card>

        {/* Card 4: Doctor Permissions */}
        <Card
          hoverable
          className="p-4 cursor-pointer"
          onClick={() => setActiveTab('permissions')}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Access</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {activePermissions.length} Active Grant{activePermissions.length === 1 ? '' : 's'}
          </div>
          <div className="text-xs text-amber-800 font-semibold mt-1">
            {activePermissions.length > 0 ? 'Auto-revoking access' : 'No doctors currently viewing'}
          </div>
        </Card>
      </div>

      {/* 3 Clear Action Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: Upload PDF */}
        <div
          onClick={() => setActiveTab('vault')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Upload Medical Document (PDF)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add lab tests, doctor reports, or scans. Your file is encrypted on your device so no one else can read it.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
            <span>Open Health Vault</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 2: Submit Cashless Claim */}
        <div
          onClick={() => setActiveTab('submit-claim')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                File a Cashless Claim
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit a hospital bill for instant approval. The insurance company verifies eligibility without seeing your illness.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
            <span>Start Claim Process</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action 3: Doctor Access */}
        <div
          onClick={() => setActiveTab('permissions')}
          className="group p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-800 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                Doctor & Hospital Permissions
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Share a specific test with your doctor for a limited time. Cancel access anytime with a single click.
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
            <span>Manage Access</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Records & Active Doctor Permissions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Sharing Alert (if any) */}
          {activePermissions.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-950">
                    A Hospital Currently Has Access to Your Records
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 font-medium">Time-Limited Access</span>
              </div>

              {activePermissions.map((p) => (
                <div key={p.id} className="p-3 bg-white rounded-xl border border-amber-200/70 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{p.hospitalName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Can view {p.recordIds.length} document{p.recordIds.length === 1 ? '' : 's'} · Auto-expires soon
                    </div>
                  </div>
                  <button
                    onClick={() => revokeHospitalAccess(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer shrink-0"
                  >
                    Stop Access
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Health Documents */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Recent Health Documents
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stored securely in your private vault with tamper-proof verification
                </p>
              </div>
              <button
                onClick={() => setActiveTab('vault')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All ({records.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {records.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {rec.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-slate-600">{rec.category}</span>
                        <span>·</span>
                        <span>{rec.date}</span>
                        {rec.hospitalName && (
                          <>
                            <span>·</span>
                            <span className="truncate">{rec.hospitalName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rec.sharedWithHospitalId ? (
                      <Badge variant="amber" size="sm" dot>Shared</Badge>
                    ) : (
                      <Badge variant="emerald" size="sm">Private</Badge>
                    )}
                    <button
                      onClick={() => setActiveTab('vault')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                      title="Open in Health Vault to decrypt"
                    >
                      Decrypt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Simple Privacy Explainer Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold">How ZKure Protects Your Privacy</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px]">1</span>
                  No Peeking
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Insurers only check if your policy covers the bill — they never see doctor notes or diagnoses.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px]">2</span>
                  You Hold the Key
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your files are locked on your device. Even if data leaks, no one can read encrypted documents without your key.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px]">3</span>
                  Instant Revocation
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hospital permissions automatically expire, and you can cancel doctor access with one tap anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Latest Claim & Status */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Latest Claim Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Claim ID: <span className="font-mono font-bold text-slate-800">{latestClaim?.id}</span>
                </p>
              </div>
              <Badge
                variant={latestClaim?.status === 'Approved' || latestClaim?.status === 'Settled' ? 'emerald' : latestClaim?.status === 'Pending' ? 'amber' : 'rose'}
                size="sm"
                dot
              >
                {latestClaim?.status === 'Approved' || latestClaim?.status === 'Settled' ? 'Approved & Paid' : 'Under Review'}
              </Badge>
            </div>

            {latestClaim ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Hospital:</span>
                    <strong className="text-slate-900">{latestClaim.hospitalName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Claim Amount:</span>
                    <strong className="text-slate-900 tabular-nums font-mono text-sm">
                      ₹{latestClaim.claimAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 items-center pt-2 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Zero Diagnosis Disclosed
                    </span>
                    <button
                      onClick={() => setInspectingClaim(latestClaim)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-700 hover:text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 hover:bg-teal-100/60 transition-colors cursor-pointer"
                      title="Inspect mathematical zero-knowledge proof verification"
                    >
                      <Cpu className="w-3 h-3" />
                      View ZK Proof
                    </button>
                  </div>
                </div>

                {/* Friendly Claim Timeline */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-700 mb-2">Claim Progress</div>
                  <ClaimTimeline steps={latestClaim.timeline} />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active claims filed yet.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">History: {patientClaims.length} claims</span>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Full Claims History</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Proof Inspector Modal (Expandable for technical reviewers) */}
      <ProofInspectorModal
        claim={inspectingClaim}
        isOpen={!!inspectingClaim}
        onClose={() => setInspectingClaim(null)}
      />
    </div>
  );
};
