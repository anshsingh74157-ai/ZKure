import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Coins,
  MapPin,
  Calendar,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Award,
  Layers,
  Lock,
  Stethoscope,
  Activity,
  Fingerprint,
  Wallet
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const HospitalProfile: React.FC = () => {
  const { userLinkedId, hospitals } = useArogyaZK();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentHospitalId = userLinkedId || 'HSP-402';

  const hospitalDirectory: Record<
    string,
    {
      name: string;
      nabh: string;
      city: string;
      address: string;
      status: string;
      type: string;
      eddsaPubKey: string;
      walletAddress: string;
      leafIndex: number;
      bondedCollateral: number;
      departments: string[];
      accreditationExpiry: string;
    }
  > = {
    'HSP-402': {
      name: 'Apollo Spectra Hospital',
      nabh: 'NABH-H-2024-8812',
      city: 'Bengaluru, Karnataka',
      address: 'Plot 14, 5th Block, Koramangala, Bengaluru 560095',
      status: 'Verified',
      type: 'Multi-Speciality Surgical Center',
      eddsaPubKey: '0x03a89e14d82b490f84a8c9e120d583b497e2894b8102a94f091c8419b84188f1',
      walletAddress: '0xApolloHsp402B419e782C9012F48c901239A',
      leafIndex: 14,
      bondedCollateral: 500000,
      departments: [
        'Laparoscopic & General Surgery',
        'Diagnostic Imaging & CT',
        'Orthopedics & Joint Replacement',
        'Internal Medicine',
        'Intensive Care Unit (ICU)'
      ],
      accreditationExpiry: '2027-11-30'
    },
    'HSP-219': {
      name: 'Fortis Diagnostics',
      nabh: 'NABH-L-2023-4410',
      city: 'Mumbai, Maharashtra',
      address: 'Mulund Goregaon Link Road, Bhandup West, Mumbai 400078',
      status: 'Verified',
      type: 'Advanced Diagnostic & Pathology Center',
      eddsaPubKey: '0x02bf891c940a831e549d012e84c9103e9182740fa019284e910283c749018271',
      walletAddress: '0xFortisHsp219D9481A0284C819E014819A',
      leafIndex: 7,
      bondedCollateral: 500000,
      departments: [
        'Clinical Biochemistry',
        'Molecular Diagnostics',
        'Histopathology',
        'High-Resolution Imaging'
      ],
      accreditationExpiry: '2026-10-15'
    },
    'HSP-308': {
      name: 'Sankara Eye Centre',
      nabh: 'NABH-E-2022-7719',
      city: 'Bengaluru, Karnataka',
      address: 'Varthur Main Road, Kundalahalli Gate, Bengaluru 560037',
      status: 'Verified',
      type: 'Tertiary Ophthalmology Care',
      eddsaPubKey: '0x01da84910283e91048b9102c8491028e71920384a9102938e910284710293847',
      walletAddress: '0xSankaraHsp308E4819A01928C4819201A',
      leafIndex: 19,
      bondedCollateral: 500000,
      departments: [
        'Cataract & Refractive Surgery',
        'Corneal Transplantation',
        'Vitreoretinal Services',
        'Pediatric Ophthalmology'
      ],
      accreditationExpiry: '2028-04-12'
    },
    'HSP-512': {
      name: 'Max Super Speciality',
      nabh: 'NABH-H-2025-3319',
      city: 'Delhi, NCR',
      address: '1, 2 Press Enclave Marg, Saket, New Delhi 110017',
      status: 'Verified',
      type: 'Super Speciality Tertiary Hospital',
      eddsaPubKey: '0x04e891028374910283e910284710293847102938471029384710293847102938',
      walletAddress: '0xMaxHsp512F4819A01928C4819201A48',
      leafIndex: 22,
      bondedCollateral: 500000,
      departments: [
        'Cardiovascular Sciences',
        'Neurosciences & Spine',
        'Oncology & Bone Marrow',
        'Organ Transplants'
      ],
      accreditationExpiry: '2028-08-20'
    }
  };

  const foundHospital = hospitals.find((h) => h.id === currentHospitalId);
  const currentHospital = hospitalDirectory[currentHospitalId] || {
    name: foundHospital?.name || 'Apollo Spectra Hospital',
    nabh: foundHospital?.nabhRegistration || 'NABH-H-2024-8812',
    city: foundHospital?.city || 'Bengaluru, Karnataka',
    address: `${foundHospital?.name || 'Hospital'}, ${foundHospital?.city || 'India'}`,
    status: foundHospital?.status || 'Verified',
    type: 'Multi-Speciality Hospital',
    eddsaPubKey: '0x03a89e14d82b490f84a8c9e120d583b497e2894b8102a94f091c8419b84188f1',
    walletAddress: foundHospital?.walletAddress || '0xApolloHsp402B419e782C9012F48c901239A',
    leafIndex: 14,
    bondedCollateral: 500000,
    departments: ['General Medicine', 'Emergency Care', 'Inpatient Services'],
    accreditationExpiry: '2028-12-31'
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Provider Profile</h1>
            <Badge variant="teal" dot>NABH Accredited</Badge>
            <Badge variant="navy">{currentHospitalId}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Cryptographic identity, verifiable credentials, and on-chain settlement bond for {currentHospital.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" dot>Attestation Node Active</Badge>
        </div>
      </div>

      {/* Main Accredited Provider Card */}
      <Card className="p-6 border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-8 h-8 text-teal-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{currentHospital.name}</h2>
                <Badge variant="teal">Verified Provider</Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">{currentHospital.type}</p>
              <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> {currentHospital.address}
                </span>
              </div>
            </div>
          </div>

          {/* Bond Metric Pill */}
          <div className="p-3.5 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-white min-w-[200px] shadow-2xs">
            <span className="text-[10px] font-semibold text-teal-800 uppercase tracking-wider block">
              On-Chain Bonded Collateral
            </span>
            <div className="text-xl font-bold text-teal-700 mt-0.5">
              ₹{currentHospital.bondedCollateral.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-teal-700 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Staked in ClaimSettlement.sol
            </div>
          </div>
        </div>

        {/* Accreditation & Compliance Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              NABH Registration No.
            </span>
            <div className="font-mono text-sm font-bold text-slate-900">
              {currentHospital.nabh}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Valid until: {currentHospital.accreditationExpiry}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Merkle Tree Membership
            </span>
            <div className="font-mono text-sm font-bold text-teal-700">
              HospitalRegistry.sol Leaf #{currentHospital.leafIndex}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Inclusion Root: 0x3d91f28b...e4a1 (Depth 16)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Digital Health Compliance
            </span>
            <div className="text-sm font-bold text-slate-800">
              ABDM Milestone 1, 2 & 3
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Zero-Knowledge Vault Gateway v2.4
            </div>
          </div>
        </div>
      </Card>

      {/* Cryptographic Credentials & Key Management */}
      <Card className="p-6 border-slate-200/80 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              Cryptographic Credentials & Key Management
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            BabyJubjub elliptic curve attestation keys used to sign claim digests and establish authenticated vault channels.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Hospital EdDSA BabyJubjub Public Key (x, y)
              </span>
              <span className="font-mono text-slate-800 text-[11px] break-all block mt-0.5">
                {currentHospital.eddsaPubKey}
              </span>
            </div>
            <button
              onClick={() => handleCopy(currentHospital.eddsaPubKey, 'pubkey')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              {copiedKey === 'pubkey' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Smart Contract Settlement Treasury Address
              </span>
              <span className="font-mono text-teal-700 font-semibold text-[11px] break-all block mt-0.5">
                {currentHospital.walletAddress}
              </span>
            </div>
            <button
              onClick={() => handleCopy(currentHospital.walletAddress, 'wallet')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              {copiedKey === 'wallet' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Accredited Departments */}
        <div className="pt-2">
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Accredited Clinical Departments (Covered in ZK Policy Merkle Root):
          </span>
          <div className="flex flex-wrap gap-2">
            {currentHospital.departments.map((dept, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-medium"
              >
                <Stethoscope className="w-3 h-3 text-teal-600" />
                {dept}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
