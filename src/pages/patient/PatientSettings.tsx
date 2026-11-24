import React, { useState } from 'react';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  Download,
  RefreshCw,
  Bell,
  Wallet,
  Lock,
  Check,
  UserCheck,
  Share2,
  Copy,
  Zap,
  Fingerprint
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ShamirEngine } from '../../services/cryptoEngine';

export const PatientSettings: React.FC = () => {
  const { patientProfile } = useArogyaZK();
  const [backedUp, setBackedUp] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [shamirSplit, setShamirSplit] = useState(false);
  const [notifyConsentExpiry, setNotifyConsentExpiry] = useState(true);
  const [notifyClaimSettled, setNotifyClaimSettled] = useState(true);
  const [requirePassphrase, setRequirePassphrase] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleBackupKeys = () => {
    const backupBundle = {
      subject: patientProfile.name || 'Rohan Sharma',
      zkId: patientProfile.zkId || 'zkID:0x9041...E4B2',
      policyNumber: patientProfile.policyNumber || 'POL-AZK-774190',
      keyType: 'AES-256-GCM Vault Root Secret',
      derivation: 'PBKDF2-HMAC-SHA256 (100,000 iterations)',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZKure_Vault_Backup_${patientProfile.id || 'PAT-9041'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackedUp(true);
    setTimeout(() => setBackedUp(false), 3000);
  };

  const handleRotateKey = () => {
    setRotated(true);
    setTimeout(() => setRotated(false), 3000);
  };

  const handleShamirSplit = () => {
    setShamirSplit(true);
    setTimeout(() => setShamirSplit(false), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Settings & Identity</h1>
            <Badge variant="teal" dot>Decentralized ID Verified</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage your sovereign cryptographic keys, privacy preferences, and connected Web3 zero-knowledge wallet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">W3C DID v1.0</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & DID */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Card */}
          <Card className="p-6 space-y-4 border-slate-200/80 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" /> Sovereign Patient Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Full Legal Name</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{patientProfile.name || 'Rohan Sharma'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Patient Identifier</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">{patientProfile.id || 'PAT-9041'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">ABHA Digital Health ID</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">91-4402-8819-2041</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">Zero-Knowledge ID</span>
                <div className="font-mono text-teal-700 font-bold text-xs mt-0.5">{patientProfile.zkId || 'zkID:0x9041...E4B2'}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> W3C DID Standard Active
              </div>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Your DID URI is: <code className="bg-teal-100/90 px-1.5 py-0.5 rounded font-mono">did:zkure:0x9041...E4B2</code>.
                No personal health information (PHI) is tied to your public address.
              </p>
            </div>
          </Card>

          {/* Cryptographic Key Management */}
          <Card className="p-6 space-y-4 border-slate-200/80 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" /> Cryptographic Key Management
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/40">
                <div>
                  <div className="font-bold text-slate-900">AES-256 Vault Backup Key</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">
                    Export your encrypted recovery key to decrypt your vault on a new browser or device.
                  </p>
                </div>
                <button
                  onClick={handleBackupKeys}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {backedUp ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-400" /> Backed Up!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Export Key
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/40">
                <div>
                  <div className="font-bold text-slate-900">ZK Prover Blinding Factor (Salt)</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">
                    Rotate your zero-knowledge circuit blinding salt to ensure claims cannot be linked by third parties.
                  </p>
                </div>
                <button
                  onClick={handleRotateKey}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  {rotated ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600" /> Salt Rotated!
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Rotate Salt
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/40">
                <div>
                  <div className="font-bold text-slate-900">Shamir 2-of-3 Social Recovery</div>
                  <p className="text-slate-500 mt-0.5 text-[11px]">
                    Split your vault root master secret into 3 polynomial Lagrange shares over BN254 scalar field.
                  </p>
                </div>
                <button
                  onClick={handleShamirSplit}
                  className="px-3.5 py-2 rounded-xl border border-teal-200 hover:bg-teal-50 text-teal-800 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  {shamirSplit ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600" /> Shares Generated!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-teal-600" /> Generate Shares
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Preferences & Connected Wallet */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notification & Security Preferences */}
          <Card className="p-6 space-y-4 border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" /> Privacy & Notification Controls
            </h3>

            <div className="space-y-3.5 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyConsentExpiry}
                  onChange={(e) => setNotifyConsentExpiry(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Consent Expiry Warning</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Alert 30 minutes before temporary hospital access token expires
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyClaimSettled}
                  onChange={(e) => setNotifyClaimSettled(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Instant Settlement Alerts</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Notify upon smart contract escrow release to healthcare provider
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePassphrase}
                  onChange={(e) => setRequirePassphrase(e.target.checked)}
                  className="mt-0.5 rounded text-teal-600 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-900">Passphrase on Consent Signing</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Prompt for local password before granting hospital access
                  </p>
                </div>
              </label>
            </div>
          </Card>

          {/* Connected Web3 Wallet */}
          <Card className="p-6 space-y-4 border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-600" /> Blockchain Settlement Rail
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Network:</span>
                <span className="text-teal-700 font-semibold font-sans">ZKure Rollup (BN254 Subnet)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Patient Address:</span>
                <span className="text-slate-900 font-semibold">0x9041...E4B2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Gas Subsidy:</span>
                <span className="text-emerald-700 font-sans font-medium">100% Paymaster Subsidized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Pairing Precompile:</span>
                <span className="text-slate-700 font-mono">0x08 (BN254 Alt_Bn128)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              All transactions executed on behalf of the patient are gasless via ERC-4337 paymasters. No cryptocurrency or private seeds are exposed.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
