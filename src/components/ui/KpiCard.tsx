import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sparkline } from './Sparkline';
import { cn } from '../../lib/utils';

type Tone = 'sky' | 'violet' | 'emerald' | 'amber';

const TONES: Record<Tone, { chip: string; spark: string }> = {
  sky: {
    chip: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    spark: 'text-sky-500',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    spark: 'text-violet-500',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    spark: 'text-emerald-500',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    spark: 'text-amber-500',
  },
};

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: ReactNode;
  deltaCaption?: string;
  spark: readonly number[];
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'sky',
  delta,
  deltaCaption = 'vs. inicio de rango',
  spark,
}: KpiCardProps) {
  const palette = TONES[tone];

  return (
    <article className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card dark:border-zinc-800/80 dark:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
        </div>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', palette.chip)}>
          <Icon className="size-4.5" />
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {delta}
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{deltaCaption}</span>
        </div>
        <Sparkline data={spark} className={cn('w-24 shrink-0', palette.spark)} />
      </div>
    </article>
  );
}
