import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  UserCheck,
  ArrowRight,
  Building2,
  Landmark,
  CheckCircle2,
  Shield,
  EyeOff,
  Cpu,
  Layers,
  Zap,
  Key,
  Database,
  X,
  UserPlus,
  Check,
  AlertCircle
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';

const TEST_ACCOUNTS = [
  {
    label: 'Patient (Rohan Sharma)',
    id: 'PAT-9041',
    email: 'patient.rohan@example.test',
    pass: 'PatientPass1234!',
    role: 'Patient',
    desc: 'Health vault, consent grants & claim status'
  },
  {
    label: 'Hospital (Apollo Spectra)',
    id: 'HSP-402',
    email: 'hospital.apollo@example.test',
    pass: 'HospitalPass1234!',
    role: 'Hospital',
    desc: 'Clinical records & EdDSA dual-key attestation'
  },
  {
    label: 'Insurer (Star Shield)',
    id: 'INS-881',
    email: 'insurer.star@example.test',
    pass: 'InsurerPass1234!',
    role: 'Insurer',
    desc: 'Groth16 proof verification & zero-PHI settlement'
  },
  {
    label: 'Network Admin (Governance)',
    id: 'ADM-001',
    email: 'admin@example.test',
    pass: 'AdminPass1234!',
    role: 'Admin',
    desc: 'NABH approvals, smart contract monitor & audit'
  }
];

export const LandingPage: React.FC = () => {
  const { login, register } = useArogyaZK();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration form state
  const [regRole, setRegRole] = useState<'Patient' | 'Hospital' | 'Insurer'>('Patient');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regInsurer, setRegInsurer] = useState('Star Shield Health Assurance');
  const [regCoverage, setRegCoverage] = useState(500000);
  const [regHospitalName, setRegHospitalName] = useState('');
  const [regNabh, setRegNabh] = useState('');
  const [regCity, setRegCity] = useState('Bengaluru');
  const [regWallet, setRegWallet] = useState('');
  const [regInsurerName, setRegInsurerName] = useState('');
  const [regError, setRegError] = useState('');

  const [busy, setBusy] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLoginError('');
    const error = await login(email, password);
    setLoginError(error || '');
    setBusy(false);
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegError('');
    if (regPassword.length < 12) {
      setRegError('Password must be at least 12 characters.');
      return;
    }
    setBusy(true);
    const error = await register({
      role: regRole,
      email: regEmail,
      password: regPassword,
      name: regRole === 'Patient' ? regName : undefined,
      insurerName: regRole === 'Patient' ? regInsurer : (regRole === 'Insurer' ? regInsurerName : undefined),
      coverageLimit: regRole === 'Patient' ? regCoverage : undefined,
      hospitalName: regRole === 'Hospital' ? regHospitalName : undefined,
      nabhRegistration: regRole === 'Hospital' ? regNabh : undefined,
      city: regRole === 'Hospital' ? regCity : undefined,
      walletAddress: regRole === 'Hospital' && regWallet ? regWallet : undefined
    });
    if (error) {
      setRegError(error);
    }
    setBusy(false);
  };

  const fillAccount = (acc: typeof TEST_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#142D4E] to-[#1D3E6B] text-white font-black flex items-center justify-center text-sm shadow-sm ring-1 ring-white/20">
              ZK
            </div>
            <div>
              <div className="font-extrabold text-xl text-[#142D4E] tracking-tight leading-none">
                ZK<span className="text-[#0D9488]">ure</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                Privacy Guard
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="hover:text-[#142D4E] transition-colors">Overview</a>
            <a href="#guarantees" className="hover:text-[#142D4E] transition-colors">ZK Guarantees</a>
            <a href="#how-it-works" className="hover:text-[#142D4E] transition-colors">How It Works</a>
            <a href="#workspaces" className="hover:text-[#142D4E] transition-colors">Workspaces</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
                fillAccount(TEST_ACCOUNTS[0]);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-teal-600" /> Demo Quick-Fill
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>Zero-Knowledge Healthcare Privacy Guard · Groth16 BN254</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#142D4E] tracking-tight leading-[1.12]">
            Decentralized Healthcare. <br />
            <span className="text-[#0D9488]">Absolute Privacy.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 mt-6 leading-relaxed max-w-2xl font-normal">
            ZKure empowers patients to own and encrypt medical records client-side with AES-256-GCM.
            Insurance claims are verified through zero-knowledge Groth16 proofs — validating policy
            coverage and hospital authorization without ever exposing diagnosis codes, physician notes, or clinical data.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-8">
            <button
              onClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm shadow-md transition-all hover:translate-y-[-1px]"
            >
              <UserPlus className="w-4 h-4" />
              Create Free Account
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
                fillAccount(TEST_ACCOUNTS[0]);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#142D4E] hover:bg-[#1D3E6B] text-white font-semibold text-sm shadow-md transition-all hover:translate-y-[-1px]"
            >
              Launch Patient Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-colors"
            >
              Select Workspace
            </button>
          </div>
        </div>

        {/* Telemetry / Proof Guarantees Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 pt-8 border-t border-slate-200">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-2xl font-black text-[#142D4E]">100%</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Zero-PHI Disclosed</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Diagnoses remain cryptographically hidden from insurers</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-2xl font-black text-[#0D9488]">11,845</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">R1CS Constraints</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Groth16 SNARK circuit over BN254 elliptic curve</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-2xl font-black text-[#142D4E]">AES-256</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Client Vault Encryption</div>
            <div className="text-[11px] text-slate-400 mt-0.5">GCM authenticated cipher with SHA-256 record digests</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-2xl font-black text-[#0D9488]">Dual-Key</div>
            <div className="text-xs font-semibold text-slate-700 mt-1">Attested Claims</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Patient consent token + Hospital EdDSA signature</div>
          </div>
        </div>
      </section>

      {/* Key Zero-Knowledge Privacy Guarantees */}
      <section id="guarantees" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>Cryptographic Privacy Guarantees</span>
          </div>
          <h2 className="text-3xl font-bold text-[#142D4E] tracking-tight">
            How ZKure Protects Health Data
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Traditional health insurance requires handing over complete medical records. ZKure introduces zero-knowledge proofs to verify coverage without disclosing sensitive medical facts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: EyeOff,
              title: 'Zero-Knowledge Groth16 Proofs',
              badge: 'Privacy Core',
              desc: 'Mathematical SNARK proofs certify that medical treatments qualify under policy guidelines, without disclosing ICD-10 diagnosis codes or clinician observations.'
            },
            {
              icon: UserCheck,
              title: 'Patient-Gated Scoped Consent',
              badge: 'Self-Sovereignty',
              desc: 'Patients grant granular, time-bound access delegations to verified hospital accounts. Access expires automatically and can be revoked on-demand.'
            },
            {
              icon: ShieldCheck,
              title: 'Client-Side Vault Encryption',
              badge: 'Data Integrity',
              desc: 'All health records are encrypted client-side using AES-256-GCM. Unencrypted data never leaves the patient device; verification relies on SHA-256 hashes.'
            },
            {
              icon: Key,
              title: 'Dual-Key EdDSA Attestation',
              badge: 'Fraud Shield',
              desc: 'Hospitals attest diagnoses with EdDSA private keys. Both patient consent and hospital signatures are verified simultaneously in the zero-knowledge circuit.'
            }
          ].map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#142D4E] text-base">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pillar.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works - Visual Step Workflow */}
      <section id="how-it-works" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>Zero-Knowledge Pipeline</span>
            </div>
            <h2 className="text-3xl font-bold text-[#142D4E] tracking-tight">
              The 4-Step Zero-Knowledge Workflow
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From clinical consultation to instant insurer reimbursement without disclosing confidential diagnoses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: '01',
                title: 'Patient Encrypts & Stores',
                role: 'Patient Portal',
                detail: 'Medical documents are encrypted in-browser using AES-256-GCM. Cryptographic SHA-256 digests anchor the record.'
              },
              {
                step: '02',
                title: 'Scoped Hospital Consent',
                role: 'Hospital Portal',
                detail: 'Patient issues a time-bound access permission to an accredited NABH hospital, granting read access solely for the current treatment.'
              },
              {
                step: '03',
                title: 'Groth16 Claim Proving',
                role: 'Attestation Engine',
                detail: 'The zero-knowledge circuit proves coverage eligibility and hospital EdDSA attestation without revealing diagnosis codes.'
              },
              {
                step: '04',
                title: 'Instant Settlement',
                role: 'Insurer Underwriter',
                detail: 'Insurer verifies public circuit signals (policy root, hospital signature, claim amount) and settles reimbursement instantly.'
              }
            ].map((s) => (
              <div key={s.step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-slate-300 font-mono">{s.step}</span>
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {s.role}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Enterprise Workspaces */}
      <section id="workspaces" className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Role-Gated Ecosystem</span>
          </div>
          <h2 className="text-3xl font-bold text-[#142D4E] tracking-tight">
            Role-Based Enterprise Workspaces
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Each actor logs into an isolated workspace strictly enforced by backend session authentication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              role: 'patient' as const,
              accIndex: 0,
              title: 'Patient Portal',
              badge: 'Self-Sovereign Vault',
              icon: UserCheck,
              points: [
                'Client-side AES-256-GCM record vault',
                'Time-gated hospital consent controls',
                'Real-time claim status & audit trail'
              ]
            },
            {
              role: 'hospital' as const,
              accIndex: 1,
              title: 'Hospital Clinical Console',
              badge: 'Provider Network',
              icon: Building2,
              points: [
                'Consent-scoped patient record access',
                'Dual-key EdDSA diagnostic attestation',
                'Automated claim submission pipeline'
              ]
            },
            {
              role: 'insurer' as const,
              accIndex: 2,
              title: 'Insurer Underwriter Guard',
              badge: 'Zero-PHI Settlement',
              icon: Landmark,
              points: [
                'Groth16 mathematical proof verification',
                'Zero diagnosis / PHI exposure guarantee',
                'Real-time liquidity & risk monitoring'
              ]
            },
            {
              role: 'admin' as const,
              accIndex: 3,
              title: 'Network Administration',
              badge: 'Consortium Governance',
              icon: ShieldCheck,
              points: [
                'NABH accredited hospital approvals',
                'Smart contract verifier monitoring',
                'Immutable system audit & event ledger'
              ]
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.role} className="p-5 flex flex-col justify-between border-slate-200 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#142D4E] text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#142D4E] text-base">{item.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {item.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                    fillAccount(TEST_ACCOUNTS[item.accIndex]);
                  }}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-[#142D4E] hover:text-white text-[#142D4E] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  Launch {item.title} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-white font-bold flex items-center justify-center text-xs">
              ZK
            </div>
            <div>
              <span className="font-extrabold text-[#142D4E] tracking-tight">ZK<span className="text-[#0D9488]">ure</span></span>
              <p className="text-xs text-slate-500">Zero-Knowledge Decentralized Healthcare & Medical Privacy Guard</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            <span>Client-side AES-256-GCM · Groth16 BN254 Circuit · SQLite WAL Backed</span>
            <div className="text-slate-400 mt-1">Built with Privacy-Preserving Cryptographic Primitives</div>
          </div>
        </div>
      </footer>

      {/* Auth Modal: Dual Mode (Sign In & Register) */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#142D4E] to-[#1D3E6B] text-white font-black flex items-center justify-center text-sm shadow-sm ring-1 ring-white/20">
                  ZK
                </div>
                <div>
                  <h2 id="auth-title" className="text-lg font-bold text-[#142D4E] leading-tight">
                    {authMode === 'login' ? 'Sign in to ZKure' : 'Create ZKure Identity'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {authMode === 'login'
                      ? 'Select a quick test account or enter your workspace credentials.'
                      : 'Provision your cryptographic identity vault on the ZKure network.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mt-5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-[#142D4E] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-[#0D9488] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {authMode === 'login' ? (
                <>
                  {/* Quick Test Account Pills */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-teal-600" />
                        Quick-Fill Demo Accounts
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Click to populate</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEST_ACCOUNTS.map((acc) => {
                        const isSelected = email === acc.email;
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => fillAccount(acc)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-200'
                                : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#142D4E]">{acc.label}</span>
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600">
                                {acc.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{acc.email}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{acc.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={submitLogin} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.test"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                      />
                    </div>

                    {loginError && (
                      <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="mt-6 pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setLoginError('');
                        }}
                        className="text-xs font-semibold text-[#0D9488] hover:underline"
                      >
                        Need an account? Register here →
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAuthModalOpen(false)}
                          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={busy}
                          type="submit"
                          className="rounded-xl bg-[#142D4E] hover:bg-[#1D3E6B] px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                        >
                          {busy ? 'Authenticating…' : 'Sign In'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                /* Registration Form */
                <form onSubmit={submitRegistration} className="mt-4 space-y-4">
                  {/* Role Segmented Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Account Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('Patient')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          regRole === 'Patient'
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-200 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 text-xs'
                        }`}
                      >
                        <UserCheck className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        <div className="text-xs">Patient</div>
                        <div className="text-[10px] text-slate-400 font-normal">Health Vault</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('Hospital')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          regRole === 'Hospital'
                            ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-200 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 text-xs'
                        }`}
                      >
                        <Building2 className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                        <div className="text-xs">Hospital</div>
                        <div className="text-[10px] text-slate-400 font-normal">Provider</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('Insurer')}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          regRole === 'Insurer'
                            ? 'border-purple-500 bg-purple-50/80 text-purple-900 ring-2 ring-purple-200 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 text-xs'
                        }`}
                      >
                        <FileCheck2 className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                        <div className="text-xs">Insurer</div>
                        <div className="text-[10px] text-slate-400 font-normal">Adjudicator</div>
                      </button>
                    </div>
                  </div>

                  {/* Role Specific Fields */}
                  {regRole === 'Patient' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Full Legal Name
                        </label>
                        <input
                          required
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Insurance Provider
                          </label>
                          <select
                            value={regInsurer}
                            onChange={(e) => setRegInsurer(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                          >
                            <option value="Star Shield Health Assurance">Star Shield Assurance</option>
                            <option value="Care Health Insurance">Care Health Insurance</option>
                            <option value="HDFC ERGO Health">HDFC ERGO Health</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Coverage Limit
                          </label>
                          <select
                            value={regCoverage}
                            onChange={(e) => setRegCoverage(Number(e.target.value))}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                          >
                            <option value={500000}>INR 5,00,000</option>
                            <option value={1000000}>INR 10,00,000</option>
                            <option value={2500000}>INR 25,00,000</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {regRole === 'Hospital' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Hospital / Facility Name
                        </label>
                        <input
                          required
                          type="text"
                          value={regHospitalName}
                          onChange={(e) => setRegHospitalName(e.target.value)}
                          placeholder="e.g. City Multispecialty Hospital"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            NABH Registration No.
                          </label>
                          <input
                            required
                            type="text"
                            value={regNabh}
                            onChange={(e) => setRegNabh(e.target.value)}
                            placeholder="NABH-2026-9182"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            City
                          </label>
                          <input
                            required
                            type="text"
                            value={regCity}
                            onChange={(e) => setRegCity(e.target.value)}
                            placeholder="e.g. Bengaluru"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {regRole === 'Insurer' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Insurance Organization Name
                      </label>
                      <input
                        required
                        type="text"
                        value={regInsurerName}
                        onChange={(e) => setRegInsurerName(e.target.value)}
                        placeholder="e.g. Apex Health Assurance"
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                      />
                    </div>
                  )}

                  {/* Common Credentials */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Official Email Address
                    </label>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Master Password
                      </label>
                      <span className={`text-[10px] font-mono font-semibold ${
                        regPassword.length >= 12 ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {regPassword.length >= 12 ? '✓ 12+ characters' : `${regPassword.length}/12 chars`}
                      </span>
                    </div>
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 12 characters"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all"
                    />
                  </div>

                  {/* Cryptographic Privacy Assurance Callout */}
                  <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cryptographic Privacy Assurance:</span>
                      <p className="text-teal-800 mt-0.5">
                        Your identity will be provisioned with client-side AES-256-GCM encryption and zero-knowledge ID anchoring.
                      </p>
                    </div>
                  </div>

                  {regError && (
                    <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="mt-5 pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setRegError('');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      ← Already registered? Sign in
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(false)}
                        className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={busy}
                        type="submit"
                        className="rounded-xl bg-[#0D9488] hover:bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {busy ? 'Registering Vault…' : 'Create Account'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
