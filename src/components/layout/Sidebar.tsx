import React, { useState } from 'react';
import {
  LayoutDashboard,
  Lock,
  FileCheck2,
  FilePlus2,
  KeyRound,
  History,
  ShieldAlert,
  Settings,
  Users,
  FolderCheck,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Scale,
  Receipt,
  Activity,
  Blocks,
  Shield,
  ChevronDown,
  LogOut,
  Zap,
  Check,
  Cpu
} from 'lucide-react';
import { useArogyaZK } from '../../context/ArogyaZKContext';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  getBadge?: (ctx: ReturnType<typeof useArogyaZK>) => number | string | undefined;
}

const ROLE_MENUS: Record<Exclude<UserRole, 'public'>, NavItem[]> = {
  patient: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'vault',
      label: 'My Health Vault',
      icon: Lock,
      getBadge: (ctx) => {
        const patientId = ctx.patientProfile?.id || 'PAT-9041';
        const count = ctx.records.filter((r) => !r.patientId || r.patientId === patientId).length;
        return count > 0 ? count : undefined;
      }
    },
    {
      id: 'policies',
      label: 'Insurance Policies',
      icon: FileCheck2,
      getBadge: (ctx) => (ctx.patientProfile?.policyNumber ? 1 : undefined)
    },
    { id: 'submit-claim', label: 'Submit Direct Claim', icon: FilePlus2 },
    {
      id: 'permissions',
      label: 'Access Permissions',
      icon: KeyRound,
      getBadge: (ctx) => {
        const patientId = ctx.patientProfile?.id || 'PAT-9041';
        const active = ctx.permissions.filter((p) => (!p.patientId || p.patientId === patientId) && p.status === 'Active' && p.expiresAt > Date.now()).length;
        return active > 0 ? active : undefined;
      }
    },
    {
      id: 'history',
      label: 'Claim History',
      icon: History,
      getBadge: (ctx) => {
        const patientId = ctx.patientProfile?.id || 'PAT-9041';
        const count = ctx.claims.filter((c) => c.patientId === patientId).length;
        return count > 0 ? count : undefined;
      }
    },
    {
      id: 'audit',
      label: 'Privacy Audit Log',
      icon: ShieldAlert,
      getBadge: (ctx) => (ctx.auditLogs.length > 0 ? ctx.auditLogs.length : undefined)
    },
    { id: 'settings', label: 'Account Settings', icon: Settings }
  ],
  hospital: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    {
      id: 'authorized',
      label: 'Authorized Records',
      icon: FolderCheck,
      getBadge: (ctx) => {
        const hospId = ctx.userLinkedId || 'HSP-402';
        const hasBreakGlass = ctx.breakGlassSessions.some((s) => (s.hospitalId === hospId || !s.hospitalId) && s.status === 'Active_Unlocked' && s.expiresAt > Date.now());
        const active = ctx.permissions.filter((p) => p.hospitalId === hospId && p.status === 'Active' && p.expiresAt > Date.now()).length;
        return active > 0 ? active : hasBreakGlass ? 1 : undefined;
      }
    },
    { id: 'create-claim', label: 'Attest & Create Claim', icon: FilePlus2 },
    { id: 'verification', label: 'Clinical Verification', icon: CheckCircle2 },
    {
      id: 'break-glass',
      label: 'Emergency Break-Glass',
      icon: ShieldAlert,
      getBadge: (ctx) => {
        const hospId = ctx.userLinkedId || 'HSP-402';
        const active = ctx.breakGlassSessions.filter((s) => (s.hospitalId === hospId || !s.hospitalId) && s.status === 'Active_Unlocked' && s.expiresAt > Date.now()).length;
        return active > 0 ? active : undefined;
      }
    },
    {
      id: 'submitted',
      label: 'Submitted Claims',
      icon: History,
      getBadge: (ctx) => {
        const hospitalId = ctx.userLinkedId || 'HSP-402';
        const count = ctx.claims.filter((c) => c.hospitalId === hospitalId).length;
        return count > 0 ? count : undefined;
      }
    },
    { id: 'profile', label: 'Hospital Profile', icon: Building2 }
  ],
  insurer: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'incoming',
      label: 'Incoming Claims',
      icon: FilePlus2,
      getBadge: (ctx) => {
        const insurerId = ctx.userLinkedId || 'Star Shield Health Assurance';
        const pending = ctx.claims.filter(
          (c) =>
            c.status === 'Pending' &&
            (c.insurerName.toLowerCase() === insurerId.toLowerCase() ||
              c.insurerName.toLowerCase().includes(insurerId.toLowerCase()))
        ).length;
        return pending > 0 ? pending : undefined;
      }
    },
    {
      id: 'zk-verify',
      label: 'ZK Verification Studio',
      icon: ShieldCheck,
      getBadge: (ctx) => {
        const insurerId = ctx.userLinkedId || 'Star Shield Health Assurance';
        const pending = ctx.claims.filter(
          (c) =>
            c.status === 'Pending' &&
            (c.insurerName.toLowerCase() === insurerId.toLowerCase() ||
              c.insurerName.toLowerCase().includes(insurerId.toLowerCase()))
        ).length;
        return pending > 0 ? pending : undefined;
      }
    },
    {
      id: 'approved',
      label: 'Approved Claims',
      icon: CheckCircle2,
      getBadge: (ctx) => {
        const insurerId = ctx.userLinkedId || 'Star Shield Health Assurance';
        const approved = ctx.claims.filter(
          (c) =>
            (c.status === 'Approved' || c.status === 'Settled') &&
            (c.insurerName.toLowerCase() === insurerId.toLowerCase() ||
              c.insurerName.toLowerCase().includes(insurerId.toLowerCase()))
        ).length;
        return approved > 0 ? approved : undefined;
      }
    },
    {
      id: 'settlements',
      label: 'Settlement History',
      icon: Receipt,
      getBadge: (ctx) => {
        const insurerId = ctx.userLinkedId || 'Star Shield Health Assurance';
        const settled = ctx.claims.filter(
          (c) =>
            c.status === 'Settled' &&
            (c.insurerName.toLowerCase() === insurerId.toLowerCase() ||
              c.insurerName.toLowerCase().includes(insurerId.toLowerCase()))
        ).length;
        return settled > 0 ? settled : undefined;
      }
    },
    { id: 'risk', label: 'Risk Monitoring', icon: Scale },
    {
      id: 'audit',
      label: 'Consortium Audit',
      icon: ShieldAlert,
      getBadge: (ctx) => (ctx.auditLogs.length > 0 ? ctx.auditLogs.length : undefined)
    }
  ],
  admin: [
    { id: 'overview', label: 'Governance Overview', icon: LayoutDashboard },
    {
      id: 'hospitals',
      label: 'Provider Accreditation',
      icon: Building2,
      getBadge: (ctx) => {
        const pending = ctx.hospitals.filter((h) => h.status.toLowerCase().includes('pending')).length;
        return pending > 0 ? pending : undefined;
      }
    },
    { id: 'contracts', label: 'Smart Contract Status', icon: Activity },
    { id: 'explorer', label: 'Rollup Explorer', icon: Blocks },
    {
      id: 'audit',
      label: 'Immutable Audit Ledger',
      icon: ShieldAlert,
      getBadge: (ctx) => (ctx.auditLogs.length > 0 ? ctx.auditLogs.length : undefined)
    }
  ]
};

const WORKSPACES: Array<{
  role: Exclude<UserRole, 'public'>;
  label: string;
  badge: string;
  subtitle: string;
  dotColor: string;
}> = [
  {
    role: 'patient',
    label: 'Patient Health Vault',
    badge: 'Self-Sovereign',
    subtitle: 'Client-Side AES-256-GCM',
    dotColor: 'bg-emerald-400'
  },
  {
    role: 'hospital',
    label: 'Provider Console',
    badge: 'NABH Node',
    subtitle: 'EdDSA Clinical Enclave',
    dotColor: 'bg-blue-400'
  },
  {
    role: 'insurer',
    label: 'Adjudication Center',
    badge: 'Zero-Knowledge',
    subtitle: 'Groth16 Pairing Verifier',
    dotColor: 'bg-purple-400'
  },
  {
    role: 'admin',
    label: 'Network Governance',
    badge: 'Consortium Root',
    subtitle: 'Rollup & SMT-16 Ledger',
    dotColor: 'bg-amber-400'
  }
];

export const Sidebar: React.FC = () => {
  const ctx = useArogyaZK();
  const { role, activeTab, setActiveTab, setRole, userLinkedId, userEmail, logout } = ctx;
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  if (role === 'public') return null;

  const items = ROLE_MENUS[role];
  const activeWorkspace = WORKSPACES.find((w) => w.role === role) || WORKSPACES[0];

  const handleSwitchWorkspace = (newRole: Exclude<UserRole, 'public'>) => {
    setRole(newRole);
    setActiveTab('overview');
    setIsWorkspaceMenuOpen(false);
  };

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-slate-800/70 flex flex-col justify-between shrink-0 min-h-screen select-none text-slate-300">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div
          onClick={() => setActiveTab('overview')}
          className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs">
              ZK
            </div>
            <div>
              <div className="font-bold text-white tracking-tight leading-none text-base flex items-center gap-1.5">
                ZKure
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1 tracking-wider uppercase flex items-center gap-1">
                Zero-Knowledge Privacy
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Switcher Trigger */}
        <div className="p-3 relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all text-left flex items-center justify-between group"
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${activeWorkspace.dotColor}`} />
                <span>{activeWorkspace.badge}</span>
              </div>
              <div className="text-xs font-semibold text-white tracking-tight truncate mt-0.5">
                {activeWorkspace.label}
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform ${
                isWorkspaceMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Interactive Workspace Dropdown Menu */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 p-1.5 bg-[#0F1422] border border-slate-700/80 rounded-xl shadow-xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Workspace
              </div>
              {WORKSPACES.map((w) => {
                const isSelected = w.role === role;
                return (
                  <button
                    key={w.role}
                    onClick={() => handleSwitchWorkspace(w.role)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-teal-500/15 text-white font-medium border border-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${w.dotColor}`} />
                        <span className="font-semibold">{w.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-3">{w.subtitle}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* User Linked ID Chip */}
          {userLinkedId && (
            <div className="mt-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">DID:</span>
              <span
                title={userLinkedId}
                className="font-mono text-[10px] text-teal-300 font-semibold truncate max-w-[140px]"
              >
                {userLinkedId}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-1 space-y-1 overflow-y-auto flex-1">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Console Navigation
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const badge = item.getBadge ? item.getBadge(ctx) : undefined;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  active
                    ? 'bg-white/[0.08] text-white shadow-xs border-l-2 border-teal-400 pl-2.5'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md tabular-nums transition-colors ${
                      active
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-white/5 text-slate-400 group-hover:text-slate-300 border border-white/5'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Telemetry */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/90 text-xs flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <div className="text-[11px] font-medium text-slate-200 truncate">
              {userEmail || 'Active Session'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              BN254 Pairing Active
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out of current workspace"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
