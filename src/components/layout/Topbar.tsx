import { Menu, Moon, Sun } from 'lucide-react';

import { navItemFor } from './nav';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useAppState } from '../../hooks/useAppState';
import { TIME_RANGES } from '../../lib/selectors';
import type { TimeRangeKey } from '../../lib/types';

const RANGE_OPTIONS = TIME_RANGES.map((range) => ({
  value: range.key,
  label: range.shortLabel,
}));

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { view, range, setRange, prefs, updatePrefs } = useAppState();
  const meta = navItemFor(view);
  const isDark = prefs.theme === 'dark';

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-950/85">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 lg:hidden dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          aria-label="Abrir navegación"
        >
          <Menu className="size-4.5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {meta.label}
          </h1>
          <p className="hidden truncate text-xs text-zinc-500 sm:block dark:text-zinc-400">
            {meta.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as TimeRangeKey)}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 sm:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="Rango de tiempo"
          >
            {TIME_RANGES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.shortLabel}
              </option>
            ))}
          </select>

          <div className="hidden sm:block">
            <SegmentedControl
              ariaLabel="Rango de tiempo"
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              size="sm"
            />
          </div>

          <button
            type="button"
            onClick={() => updatePrefs({ theme: isDark ? 'light' : 'dark' })}
            className="grid size-8 place-items-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 lg:hidden dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            aria-label="Cambiar tema"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
