import React from 'react';

export interface BadgeProps {
  variant?: 'teal' | 'navy' | 'amber' | 'rose' | 'slate' | 'emerald' | 'blue' | 'indigo' | 'purple' | 'zinc';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
  children
}) => {
  const styles: Record<NonNullable<BadgeProps['variant']>, { badge: string; dot: string }> = {
    teal: {
      badge: 'bg-teal-50 text-teal-800 ring-teal-600/20 border-teal-200',
      dot: 'bg-teal-500'
    },
    emerald: {
      badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    navy: {
      badge: 'bg-slate-900 text-slate-100 ring-slate-800 border-slate-700',
      dot: 'bg-teal-400'
    },
    blue: {
      badge: 'bg-blue-50 text-blue-800 ring-blue-600/20 border-blue-200',
      dot: 'bg-blue-500'
    },
    indigo: {
      badge: 'bg-indigo-50 text-indigo-800 ring-indigo-600/20 border-indigo-200',
      dot: 'bg-indigo-500'
    },
    purple: {
      badge: 'bg-purple-50 text-purple-800 ring-purple-600/20 border-purple-200',
      dot: 'bg-purple-500'
    },
    amber: {
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/20 border-amber-200',
      dot: 'bg-amber-500'
    },
    rose: {
      badge: 'bg-rose-50 text-rose-800 ring-rose-600/20 border-rose-200',
      dot: 'bg-rose-500'
    },
    slate: {
      badge: 'bg-slate-100/90 text-slate-700 ring-slate-500/10 border-slate-200',
      dot: 'bg-slate-400'
    },
    zinc: {
      badge: 'bg-zinc-100 text-zinc-800 ring-zinc-500/10 border-zinc-200',
      dot: 'bg-zinc-500'
    }
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 font-medium',
    md: 'px-2.5 py-0.5 text-xs gap-1.5 font-medium'
  };

  const current = styles[variant] || styles.slate;

  return (
    <span
      className={`inline-flex items-center rounded-md border ring-1 ring-inset font-sans tracking-tight transition-colors ${current.badge} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${current.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
};
