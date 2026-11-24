import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  AlertCircle,
  Wallet,
  FileCheck2,
  MapPin,
  Loader2,
  KeyRound,
  ExternalLink,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HospitalEntity } from '../../types';
import { approveHospitalInDB, createHospitalApi, fetchHospitalsFromDB } from '../../services/api';

export const AdminHospitals: React.FC = () => {
  const { hospitals, approveHospitalEntity, refreshHospitals } = useArogyaZK();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospNabh, setNewHospNabh] = useState('');
  const [newHospCity, setNewHospCity] = useState('');
  const [newHospWallet, setNewHospWallet] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const filteredHospitals = hospitals.filter((h) => {
    return (
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.id.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.nabhRegistration.toLowerCase().includes(search.toLowerCase())
    );
  });

  const verifiedCount = hospitals.filter((h) => h.status === 'Locally Verified' || h.status === 'Verified').length;
  const pendingCount = hospitals.filter((h) => h.status === 'Pending Approval').length;

  const handleEnrollHospital = async (hospId: string) => {
    setEnrollingId(hospId);
    try {
      await approveHospitalEntity(hospId);
    } catch (err) {
      console.error('Approval failed', err);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim() || !newHospNabh.trim() || !newHospCity.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createHospitalApi({
        name: newHospName.trim(),
        nabhRegistration: newHospNabh.trim(),
        city: newHospCity.trim(),
        walletAddress: newHospWallet.trim() || undefined
      });
      if (res.error) {
        setFeedbackMsg({ text: res.error, error: true });
      } else {
        await refreshHospitals();
        setFeedbackMsg({ text: `Provider ${newHospName} enrolled into SMT-16 review queue.` });
        setShowAddModal(false);
        setNewHospName('');
        setNewHospNabh('');
        setNewHospCity('');
        setNewHospWallet('');
      }
    } catch {
      setFeedbackMsg({ text: 'Failed to enroll provider', error: true });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Approvals & Registry</h1>
            <Badge variant="teal" dot>Consortium Accredited</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Verify NABH accreditation credentials, enroll provider EdDSA BabyJubjub signing keys, and commit provider nodes into the Depth-16 sparse Merkle tree.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Enroll New Provider
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
          feedbackMsg.error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-teal-200 bg-teal-50 text-teal-800'
        }`}>
          {feedbackMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-teal-200/80 bg-gradient-to-br from-teal-50/50 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Accredited Providers</div>
          <div className="text-2xl font-bold tracking-tight text-teal-600 mt-1">{verifiedCount}</div>
          <div className="text-[11px] text-teal-700 mt-0.5">Enrolled on HospitalRegistry.sol</div>
        </Card>

        <Card className="p-4 border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Pending Review</div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">NABH verification in progress</div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">SMT Accumulator Root</div>
          <div className="text-xs font-mono font-bold text-slate-900 mt-2 truncate" title="0x3d91f28b2489c091e84a1029384756201948201a4b82">
            0x3d91f28b...e4a1
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Depth-16 Poseidon SMT Root</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3.5 flex items-center gap-2.5 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by hospital name, NABH registration, city, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent placeholder-slate-400 text-slate-800"
        />
      </Card>

      {/* Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHospitals.map((hosp, idx) => (
          <Card key={hosp.id} className="p-5 flex flex-col justify-between space-y-4 border-slate-200/80 hover:border-teal-300 transition-all shadow-xs">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Building2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {hosp.city}
                    </p>
                  </div>
                </div>
                <Badge variant={hosp.status === 'Locally Verified' || hosp.status === 'Verified' ? 'teal' : 'amber'} dot>
                  {hosp.status}
                </Badge>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-sans">Provider Identifier:</span>
                  <span className="font-semibold text-slate-800">{hosp.id}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-sans">NABH Accreditation:</span>
                  <span className="text-slate-700 font-medium">{hosp.nabhRegistration}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400 font-sans">Whitelisted Wallet:</span>
                  <span className="text-teal-700 font-semibold">{hosp.walletAddress.slice(0, 18)}...</span>
                </div>
                <div className="flex justify-between font-mono pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 font-sans">SMT Leaf Index:</span>
                  <span className="text-slate-900 font-bold">Leaf #{idx + 1} (Depth 16)</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {hosp.status === 'Pending Approval' ? (
                <button
                  onClick={() => handleEnrollHospital(hosp.id)}
                  disabled={enrollingId === hosp.id}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {enrollingId === hosp.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Committing to Merkle Tree...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Approve & Commit to On-Chain SMT
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full flex items-center justify-between text-xs text-slate-500">
                  <span className="text-teal-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600" /> Merkle Anchor Validated
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Bonded: ₹5,00,000</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register Healthcare Provider</h3>
                <p className="text-xs text-slate-500">Add hospital node to the accredited Merkle tree</p>
              </div>
            </div>

            <form onSubmit={handleRegisterHospital} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Manipal Hospitals"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">NABH Registration No.</label>
                <input
                  type="text"
                  required
                  placeholder="NABH-H-2026-XXXX"
                  value={newHospNabh}
                  onChange={(e) => setNewHospNabh(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Treasury Wallet</label>
                  <input
                    type="text"
                    required
                    placeholder="0x..."
                    value={newHospWallet}
                    onChange={(e) => setNewHospWallet(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 outline-none font-mono focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
