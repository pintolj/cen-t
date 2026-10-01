import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';

import { useMoney } from '../../hooks/useAppState';
import { cn, formatPercent } from '../../lib/utils';

export type DeltaFormat = 'percent' | 'pp' | 'currency' | 'number';

interface DeltaProps {
  value: number;
  format?: DeltaFormat;
  /** true cuando subir es malo (p. ej. churn). */
  invert?: boolean;
  decimals?: number;
  showIcon?: boolean;
  className?: string;
}

const TONES = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-rose-600 dark:text-rose-400',
  flat: 'text-zinc-500 dark:text-zinc-400',
} as const;

const ICONS: Record<'up' | 'down' | 'flat', LucideIcon> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
};

export function Delta({
  value,
  format = 'percent',
  invert = false,
  decimals = 2,
  showIcon = true,
  className,
}: DeltaProps) {
  const money = useMoney();
  const flat = Math.abs(value) < 1e-9;
  const positive = value > 0;
  const tone: 'up' | 'down' | 'flat' = flat ? 'flat' : (invert ? !positive : positive) ? 'up' : 'down';
  const Icon = ICONS[tone];
  const sign = positive ? '+' : '';

  let text: string;
  switch (format) {
    case 'pp':
      text = `${sign}${value.toFixed(decimals)} pp`;
      break;
    case 'currency':
      text = `${sign}${money.format(value)}`;
      break;
    case 'number':
      text = `${sign}${value.toFixed(decimals)}`;
      break;
    default:
      text = formatPercent(value, decimals);
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        TONES[tone],
        className,
      )}
    >
      {showIcon ? <Icon className="size-3.5" /> : null}
      {text}
    </span>
  );
}
