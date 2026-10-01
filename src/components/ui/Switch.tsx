import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {label ? (
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</p>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-sky-500' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}
