import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  LogOut,
  Building2,
  FileCheck2,
  ShieldAlert,
  Lock,
  ChevronRight,
  Cpu,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { Badge } from '../ui/Badge';

export const Topbar: React.FC = () => {
  const { role, logout, backendConnected, userEmail, userLinkedId } = useArogyaZK();
  const [copied, setCopied] = useState(false);

  const getRoleDetails = () => {
    switch (role) {
      case 'patient':
        return {
          title: 'Patient Health Vault',
          subtitle: 'Client-Side AES-256-GCM',
          variant: 'emerald' as const,
          icon: Lock
        };
      case 'hospital':
        return {
          title: 'Clinical Attestation Console',
          subtitle: 'NABH Consortium Node',
          variant: 'blue' as const,
          icon: Building2
        };
      case 'insurer':
        return {
          title: 'Adjudication & Settlement',
          subtitle: 'Groth16 SNARK Engine',
          variant: 'purple' as const,
          icon: FileCheck2
        };
      case 'admin':
        return {
          title: 'Consortium Governance',
          subtitle: 'L2 Subnet Rollup',
          variant: 'amber' as const,
          icon: ShieldAlert
        };
      default:
        return {
          title: 'Consortium Portal',
          subtitle: 'Zero-Knowledge Health',
          variant: 'slate' as const,
          icon: ShieldCheck
        };
    }
  };

  const currentRole = getRoleDetails();
  const RoleIcon = currentRole.icon;

  const handleCopyId = () => {
    if (!userLinkedId) return;
    navigator.clipboard.writeText(userLinkedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(15,23,42,0.02)] select-none">
      {/* Context Breadcrumb & Architecture Telemetry */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <div className="flex items-center gap-2 text-slate-900 font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            <span className="font-bold tracking-tight">ZKure</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-800 text-xs truncate">
              {currentRole.title}
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              · {currentRole.subtitle}
            </span>
          </div>
        </div>

        {/* Cryptographic Architecture Telemetry */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-600">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] font-medium text-slate-700">
              {backendConnected ? 'SQLite (WAL)' : 'Syncing'}
            </span>
            <span className="text-slate-300">·</span>
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px] font-medium text-slate-700">
              Groth16 (BN254)
            </span>
            <span className="text-slate-300">·</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-medium text-slate-700">
              Poseidon SMT-16
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Badge, User DID & Sign Out */}
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={currentRole.variant} size="sm" dot>
          <RoleIcon className="w-3 h-3 mr-0.5" />
          <span className="capitalize">{role}</span>
        </Badge>

        {userLinkedId && (
          <button
            onClick={handleCopyId}
            title="Click to copy ID"
            className="hidden sm:flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            <span>{userLinkedId}</span>
            {copied ? (
              <Check className="w-3 h-3 text-teal-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </button>
        )}

        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
