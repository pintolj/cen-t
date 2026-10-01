import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const VARIANTS: Record<BadgeVariant, string> = {
  neutral:
    'bg-zinc-100 text-zinc-600 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/25',
  danger:
    'bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/25',
  info: 'bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/25',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        VARIANTS[variant],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}
