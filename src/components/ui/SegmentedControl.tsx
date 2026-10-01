import type { LucideIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80',
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {Icon ? <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
