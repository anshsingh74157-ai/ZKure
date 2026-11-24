import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2,
  Fingerprint
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';

export const HospitalBreakGlass: React.FC = () => {
  const {
    breakGlassSessions,
    requestEmergencyBreakGlass,
    signEmergencyBreakGlass,
    userLinkedId,
    patientProfile,
    setActiveTab
  } = useArogyaZK();

  const [doctorName, setDoctorName] = useState('Dr. Arvind Rao, Chief Intensivist');
  const [patientId, setPatientId] = useState(patientProfile.id || 'PAT-9041');
  const [icuReason, setIcuReason] = useState(
    'Acute Subdural Hematoma & Unconscious State — Emergency Surgical Decompression Required'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signingSession, setSigningSession] = useState<{ id: string; guardian: number } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !icuReason.trim()) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      await requestEmergencyBreakGlass(doctorName.trim(), icuReason.trim(), patientId.trim());
      setActionSuccess('Emergency Break-Glass session initiated on-chain. Dispatched alerts to 3 designated guardians.');
    } catch (err) {
      console.error('Failed to request break-glass', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSign = async (sessionId: string, guardianNumber: number) => {
    setSigningSession({ id: sessionId, guardian: guardianNumber });
    setActionSuccess(null);
    try {
      await signEmergencyBreakGlass(sessionId, guardianNumber);
      setActionSuccess(`Guardian #${guardianNumber} signature attested into Lagrange interpolation polynomial.`);
    } catch (err) {
      console.error('Failed to sign break-glass share', err);
    } finally {
      setSigningSession(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Emergency Break-Glass Protocol</h1>
            <Badge variant="rose" dot>2-of-3 Shamir Threshold</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Statutory emergency medical override under DPDP Act 2023 §9 for unresponsive, comatose, or trauma patients. Reconstructs hardware-sealed clinical records only upon cryptographic quorum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy">Provider: {currentHospitalId}</Badge>
          <Badge variant="zinc">Lagrange F_p Quorum</Badge>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-teal-600 hover:text-teal-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Protocol Architecture Banner */}
      <Card className="p-5 border-rose-200 bg-gradient-to-r from-rose-50/60 via-amber-50/30 to-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">
                Cryptographic 2-of-3 Multi-Party Guardian Quorum
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Patient master key is split into 3 Shamir polynomial shares: <strong>(1) Chief Medical Officer</strong>, <strong>(2) Institutional Ethics Committee</strong>, and <strong>(3) Registered Patient Nominee</strong>. Any 2 valid shares reconstruct the ephemeral AES session key.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-700 bg-white/80 px-3 py-2 rounded-xl border border-rose-200 shrink-0">
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            <span>Zero Unilateral Access</span>
          </div>
        </div>
      </Card>

      {/* Break-Glass Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Break-Glass Audit Registry ({breakGlassSessions.length})
          </h2>
        </div>

        {breakGlassSessions.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No Break-Glass Sessions Requested</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Initiate an emergency session below when life-saving interventions require immediate clinical history.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {breakGlassSessions.map((session) => {
              const totalSigned = session.guardian1Signed + session.guardian2Signed + session.guardian3Signed;
              const isUnlocked = session.status === 'Active_Unlocked' && session.expiresAt > Date.now();

              return (
                <Card
                  key={session.id}
                  className={`p-5 transition-all ${
                    isUnlocked
                      ? 'border-teal-300 bg-teal-50/20 shadow-sm'
                      : 'border-slate-200/80 bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                          {session.id}
                        </span>
                        {isUnlocked ? (
                          <Badge variant="teal" dot>Active Unlocked (Quorum Met)</Badge>
                        ) : (
                          <Badge variant="amber" dot>Pending Quorum ({totalSigned}/2 required)</Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          Target Patient: <strong className="text-slate-800">{session.patientId}</strong>
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        Reason: <span className="text-slate-600 font-normal">{session.icuReason}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Attending Doctor: <strong>{session.doctorName}</strong> · Provider: {session.hospitalId}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isUnlocked && (
                        <button
                          onClick={() => setActiveTab('authorized')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                        >
                          <span>Open Unlocked Records</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 Guardians Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                    {/* Guardian 1 */}
                    <div className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                      session.guardian1Signed
                        ? 'border-teal-200 bg-teal-50/60 text-teal-900'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Guardian #1: Chief Medical Officer</span>
                        {session.guardian1Signed ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Institutional Clinical Authority Share</p>
                      <div>
                        {session.guardian1Signed ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-teal-700 font-semibold">
                            ✓ EdDSA Share Signed
                          </span>
                        ) : (
                          <button
                            disabled={signingSession !== null}
                            onClick={() => handleSign(session.id, 1)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            {signingSession?.id === session.id && signingSession?.guardian === 1 ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <KeyRound className="w-3 h-3" />
                            )}
                            Sign as CMO
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Guardian 2 */}
                    <div className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                      session.guardian2Signed
                        ? 'border-teal-200 bg-teal-50/60 text-teal-900'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Guardian #2: Ethics Committee</span>
                        {session.guardian2Signed ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Hospital Legal Oversight Representative</p>
                      <div>
                        {session.guardian2Signed ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-teal-700 font-semibold">
                            ✓ EdDSA Share Signed
                          </span>
                        ) : (
                          <button
                            disabled={signingSession !== null}
                            onClick={() => handleSign(session.id, 2)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            {signingSession?.id === session.id && signingSession?.guardian === 2 ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <KeyRound className="w-3 h-3" />
                            )}
                            Sign as Ethics Committee
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Guardian 3 */}
                    <div className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 ${
                      session.guardian3Signed
                        ? 'border-teal-200 bg-teal-50/60 text-teal-900'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Guardian #3: Nominee / Family</span>
                        {session.guardian3Signed ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Patient Pre-registered Surrogate Signer</p>
                      <div>
                        {session.guardian3Signed ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-teal-700 font-semibold">
                            ✓ EdDSA Share Signed
                          </span>
                        ) : (
                          <button
                            disabled={signingSession !== null}
                            onClick={() => handleSign(session.id, 3)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            {signingSession?.id === session.id && signingSession?.guardian === 3 ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <KeyRound className="w-3 h-3" />
                            )}
                            Sign as Nominee
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Form: Request Emergency Break-Glass */}
      <Card className="p-6 border-slate-200/90 bg-white space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Initiate Emergency Break-Glass Session</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatches on-chain quorum alerts to designated guardians. 2 of 3 guardian signatures required to unlock records.
          </p>
        </div>

        <form onSubmit={handleRequest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Intensivist / Emergency Physician
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Patient ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Emergency Justification & ICU Trauma Condition
            </label>
            <textarea
              rows={3}
              value={icuReason}
              onChange={(e) => setIcuReason(e.target.value)}
              required
              placeholder="Detail patient clinical status, Glasgow Coma Scale score, and justification for emergency access..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This reason will be immutably hashed and recorded on the immutable audit ledger.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Initiating Quorum...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Initiate 2-of-3 Break-Glass Protocol</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
