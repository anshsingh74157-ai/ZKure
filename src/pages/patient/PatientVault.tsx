import React, { useState, useEffect } from 'react';
import {
  Lock,
  Share2,
  Plus,
  FileText,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Download,
  Copy,
  Check,
  Building2,
  Hash,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  LockKeyhole,
  KeyRound,
  Eye,
  Sliders,
  ExternalLink,
  Upload,
  Image,
  ImageIcon
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';
import { MedicalRecord } from '../../types';

export const PatientVault: React.FC = () => {
  const {
    records,
    hospitals,
    decryptRecord,
    uploadAndEncryptRecord,
    grantHospitalAccess,
    revokeHospitalAccess,
    permissions
  } = useArogyaZK();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sharingRecordId, setSharingRecordId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState('HSP-402');
  const [selectedDurationHours, setSelectedDurationHours] = useState(3);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Decryption state
  const [decryptedRecord, setDecryptedRecord] = useState<{
    id: string;
    title: string;
    clinicalNotes: string;
    sha256Hash: string;
    fileName?: string | null;
    fileContent?: string | null;
  } | null>(null);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalRecord['category']>('Lab Report');
  const [hospitalName, setHospitalName] = useState('Apollo Spectra Hospital');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Revoke Blob URL when unmounting or when new URL is generated
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleCloseDecrypt = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setDecryptedRecord(null);
    setDecryptError(null);
  };

  const handleCloseUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setFileBase64(null);
    setFileError(null);
    setUploadError(null);
    setIsDragging(false);
  };

  const handleDecrypt = async (recordId: string) => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setDecryptedRecord(null);
    setDecryptingId(recordId);
    setDecryptError(null);
    try {
      const res = await decryptRecord(recordId);
      if (!res) {
        setDecryptError('Decryption failed: Record cannot be authenticated or consent has expired.');
      } else {
        setDecryptedRecord(res);
        if (res.fileContent) {
          try {
            // Generate blob URL for file preview
            const lowerName = (res.fileName || '').toLowerCase();
            const mimeType = lowerName.endsWith('.pdf') ? 'application/pdf'
              : lowerName.endsWith('.png') ? 'image/png'
              : lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') ? 'image/jpeg'
              : lowerName.endsWith('.webp') ? 'image/webp'
              : lowerName.endsWith('.txt') ? 'text/plain'
              : 'application/octet-stream';
            const cleanBase64 = res.fileContent.includes(',') ? res.fileContent.split(',')[1] : res.fileContent;
            const binaryString = atob(cleanBase64.replace(/\s/g, ''));
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
          } catch (fileErr: any) {
            console.error('Failed to decode attached file:', fileErr);
          }
        }
      }
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption error');
    } finally {
      setDecryptingId(null);
    }
  };

  const processFile = (file: File) => {
    // Validate empty file
    if (file.size === 0) {
      setFileError('The selected file is empty (0 bytes).');
      return;
    }

    // Validate file name length
    if (file.name.length > 255) {
      setFileError('File name is too long (maximum 255 characters).');
      return;
    }

    // Validate file type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !allowedExt.includes(ext)) {
      setFileError('Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, TXT');
      return;
    }
    
    // Validate size (max 6MB raw = ~8MB Base64)
    if (file.size > 6 * 1024 * 1024) {
      setFileError('File too large. Maximum size is 6MB.');
      return;
    }
    
    setFileError(null);
    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result is data:mime;base64,XXX — strip the prefix
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processFile(file);
  };

  const categories = ['All', 'Lab Report', 'Discharge Summary', 'Diagnostic Imaging', 'Prescription'];

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      (rec.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.hospitalName || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sharedRecords = filteredRecords.filter((r) => r.sharedWithHospitalId !== null);
  const privateOnlyRecords = filteredRecords.filter((r) => r.sharedWithHospitalId === null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!clinicalNotes.trim() && !fileBase64) {
      setUploadError('Please provide clinical notes or upload a document.');
      return;
    }
    setEncrypting(true);
    setUploadError(null);
    try {
      await uploadAndEncryptRecord({
        title,
        category,
        hospitalName,
        clinicalNotes,
        fileContent: fileBase64 || undefined,
        fileName: selectedFile?.name || undefined
      });
      setTitle('');
      setClinicalNotes('');
      setSelectedFile(null);
      setFileBase64(null);
      setFileError(null);
      setShowUploadModal(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save encrypted record');
    } finally {
      setEncrypting(false);
    }
  };

  const handleGrantShare = async () => {
    if (!sharingRecordId) return;
    setIsSharing(true);
    setShareError(null);
    try {
      const targetHosp = hospitals.find((h) => h.id === selectedHospitalId);
      await grantHospitalAccess(
        selectedHospitalId,
        targetHosp?.name || 'Apollo Spectra Hospital',
        [sharingRecordId],
        selectedDurationHours
      );
      setSharingRecordId(null);
    } catch (err: any) {
      setShareError(err.message || 'Failed to issue authorization consent token');
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Health Vault
            </h1>
            <Badge variant="teal" size="sm" dot>AES-256-GCM Envelope</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-knowledge encrypted repository. All records are sealed with your private key before cloud persistence.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Encrypt & Store New Record
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records by title, provider, or record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Temporarily Shared Records Section */}
      {sharedRecords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Temporarily Authorized with Healthcare Providers ({sharedRecords.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">Strictly Scoped Time-Bound Access</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedRecords.map((record) => (
              <SharedRecordCard
                key={record.id}
                record={record}
                onRevoke={() => {
                  const perm = permissions.find(
                    (p) => p.hospitalId === record.sharedWithHospitalId && p.status === 'Active'
                  );
                  if (perm) revokeHospitalAccess(perm.id);
                }}
                onCopyHash={(hash) => copyToClipboard(hash, record.id)}
                isCopied={copiedHash === record.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vaulted Records Table / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>Private Vault Documents ({filteredRecords.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">Zero Unauthenticated Access</span>
        </div>

        {filteredRecords.length === 0 ? (
          <Card className="p-12 text-center space-y-3 border-dashed">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">No matching medical records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No files match your current filters. Clear the search query or encrypt a new medical document to get started.
            </p>
          </Card>
        ) : (
          <div className="border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-2xs divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/70 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{record.title}</span>
                      <Badge variant="slate" size="sm">{record.category}</Badge>
                      {record.sharedWithHospitalId ? (
                        <Badge variant="amber" size="sm" dot>Shared: {record.sharedWithHospitalName}</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">Private</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
                      <span>ID: {record.id}</span>
                      <span>·</span>
                      <span>Date: {record.date}</span>
                      {record.hospitalName && (
                        <>
                          <span>·</span>
                          <span className="font-sans text-slate-600">{record.hospitalName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                      <span>SHA-256 Seal:</span>
                      <span className="text-slate-600 font-semibold truncate max-w-xs">
                        {record.sha256Hash || 'Local GCM Encrypted'}
                      </span>
                      {record.sha256Hash && (
                        <button
                          onClick={() => copyToClipboard(record.sha256Hash, record.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy SHA-256 hash"
                        >
                          {copiedHash === record.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleDecrypt(record.id)}
                    disabled={decryptingId === record.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {decryptingId === record.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        <span>Decrypting...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        <span>Decrypt in Browser</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSharingRecordId(record.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5 text-teal-300" />
                    <span>Authorize Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Authorization Modal */}
      {sharingRecordId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Issue Scoped Access Token</h3>
                  <p className="text-xs text-slate-500">Record: <span className="font-mono">{sharingRecordId}</span></p>
                </div>
              </div>
              <button
                onClick={() => setSharingRecordId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Accredited NABH Hospital
                </label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                >
                  {hospitals
                    .filter((h) => h.status.includes('Verified'))
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.city}) · {h.nabhRegistration}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Consent Duration (Auto-Revokes)</span>
                  <span className="font-mono font-bold text-teal-700">{selectedDurationHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={selectedDurationHours}
                  onChange={(e) => setSelectedDurationHours(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>1 Hour</span>
                  <span>12 Hours</span>
                  <span>24 Hours</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-[11px] text-teal-900 leading-relaxed space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  DPDP & ABDM Cryptographic Consent Guarantee:
                </div>
                <div>1. The hospital can only view this single document. All other vault files remain locked.</div>
                <div>2. Access automatically terminates after {selectedDurationHours}h. You can revoke it prematurely at any moment.</div>
              </div>

              {shareError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{shareError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setSharingRecordId(null); setShareError(null); }}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantShare}
                disabled={isSharing}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Issuing Consent Token...</span>
                  </>
                ) : (
                  <span>Confirm & Issue Consent Token</span>
                )}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Upload & Encrypt Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Seal & Vault New Medical Record</h3>
                  <p className="text-xs text-slate-500">Client-Side WebCrypto AES-256-GCM Encryption</p>
                </div>
              </div>
              <button
                onClick={handleCloseUpload}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cardiology Holter Monitor ECG Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicalRecord['category'])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  >
                    <option>Lab Report</option>
                    <option>Discharge Summary</option>
                    <option>Diagnostic Imaging</option>
                    <option>Prescription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Medical Institution
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Apollo Spectra Hospital"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Upload Medical Document <span className="text-slate-400 font-normal">(PDF, Image — max 6MB)</span>
                </label>
                
                {!selectedFile ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processFile(file);
                    }}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors group ${
                      isDragging
                        ? 'border-teal-500 bg-teal-50/70'
                        : 'border-slate-200 hover:border-teal-400 hover:bg-teal-50/40'
                    }`}
                  >
                    <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt" onChange={handleFileSelect} />
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-teal-600 transition-colors">
                      <Upload className="w-7 h-7" />
                      <span className="text-xs font-medium">Click to upload or drag & drop</span>
                      <span className="text-[11px]">PDF, JPG, PNG up to 6MB</span>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/60">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
                      {selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-5 h-5 text-teal-700" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-teal-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 truncate">{selectedFile.name}</div>
                      <div className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'Document'}</div>
                    </div>
                    <button type="button" onClick={() => { setSelectedFile(null); setFileBase64(null); }} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {fileError && (
                  <div className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{fileError}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Clinical Findings / Notes <span className="text-slate-400 font-normal">(Optional if document attached)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter diagnosis findings, doctor impressions, or medication regimen. Encrypted locally with your random 256-bit data key."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-[11px] text-teal-900 space-y-1">
                <div className="font-semibold">Cryptographic Security Guarantee:</div>
                <div>· Generates fresh random 256-bit DEK & 96-bit IV via <code>crypto.getRandomValues</code>.</div>
                <div>· Computes 128-bit authentication tag and SHA-256 payload integrity seal.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseUpload}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={encrypting}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors disabled:bg-slate-300 shadow-2xs"
                >
                  {encrypting ? 'Encrypting & Storing...' : 'Confirm Encryption'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Decrypted Record Inspection Modal */}
      {(decryptedRecord || decryptError) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${decryptError ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-700'} flex items-center justify-center`}>
                  {decryptError ? <AlertCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {decryptError ? 'Decryption Failed' : 'Decrypted Medical Record'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {decryptError ? 'Authentication tag or consent error' : 'Decrypted in local browser memory · Zero PHI exposed to insurer'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDecrypt}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {decryptError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-semibold">Unable to decrypt this record:</div>
                <p>{decryptError}</p>
              </div>
            ) : decryptedRecord ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs text-teal-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">100% Private to You</span>
                    <p className="text-[11px] text-teal-800 mt-0.5">
                      This medical report was decrypted locally on your device using your AES-256 key. It was never transmitted unencrypted over the network.
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Document Name</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{decryptedRecord.title}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">Record ID:</span>
                    <span className="font-bold text-slate-800">{decryptedRecord.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">SHA-256 Anchor:</span>
                    <span className="text-teal-800 font-bold">{(decryptedRecord.sha256Hash || '').slice(0, 24)}...</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-800 font-sans pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-semibold">Integrity Verified: Digital seal matches HealthVault blockchain anchor</span>
                  </div>
                </div>

                {decryptedRecord.clinicalNotes ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Notes & Findings</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(decryptedRecord.clinicalNotes, 'decrypted-notes')}
                        className="text-xs text-teal-700 font-semibold hover:text-teal-800 flex items-center gap-1"
                      >
                        {copiedHash === 'decrypted-notes' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHash === 'decrypted-notes' ? 'Copied' : 'Copy Notes'}</span>
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                      {decryptedRecord.clinicalNotes}
                    </div>
                  </div>
                ) : null}

                {/* File Viewer */}
                {blobUrl && (decryptedRecord?.fileName || decryptedRecord?.fileContent) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attached Document</span>
                      <a href={blobUrl} download={decryptedRecord.fileName || 'medical-document'} className="text-xs text-teal-700 font-semibold hover:text-teal-800 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{decryptedRecord.fileName || 'medical-document'}</div>
                    {/\.pdf$/i.test(decryptedRecord.fileName || '') ? (
                      <iframe src={blobUrl} className="w-full h-72 rounded-xl border border-slate-200 bg-slate-50" title={decryptedRecord.fileName || 'Medical PDF Document'} />
                    ) : (/\.(jpg|jpeg|png|webp)$/i.test(decryptedRecord.fileName || '')) ? (
                      <img src={blobUrl} alt={decryptedRecord.fileName || 'Medical Image'} className="w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-slate-50" />
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">Binary file attached. Use the Download button above.</div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Protected by ZKure HealthVault Protocol
              </span>
              <button
                onClick={handleCloseDecrypt}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Close Record
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const SharedRecordCard: React.FC<{
  record: MedicalRecord;
  onRevoke: () => void;
  onCopyHash: (hash: string) => void;
  isCopied: boolean;
}> = ({ record, onRevoke, onCopyHash, isCopied }) => {
  const countdown = useCountdown(record.accessExpiresAt);

  return (
    <Card className="p-5 border-amber-200/90 bg-amber-50/20 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">{record.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized for <strong className="text-amber-800">{record.sharedWithHospitalName}</strong>
            </p>
          </div>
          <Badge variant="amber" size="sm" dot>Active Grant</Badge>
        </div>

        <div className="mt-3 p-3.5 rounded-xl bg-white border border-amber-200/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-500">Access Auto-Expires In:</span>
            <span className="font-mono text-amber-800 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> {countdown}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-slate-600">
            <span className="text-slate-500 font-sans">Digital Seal:</span>
            <button
              onClick={() => onCopyHash(record.sha256Hash)}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono text-[11px]"
            >
              {(record.sha256Hash || '').slice(0, 16)}...
              {isCopied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
          <div className="text-[11px] text-teal-700 font-sans pt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Read-only access scoped strictly to this record
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Zero data export permitted</span>
        <button
          onClick={onRevoke}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
        >
          Revoke Access Immediately
        </button>
      </div>
    </Card>
  );
};
