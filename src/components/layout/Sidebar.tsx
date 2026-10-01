import { Moon, RefreshCw, Sun } from 'lucide-react';

import { CenitMark } from '../brand/CenitMark';
import { NAV_ITEMS } from './nav';
import { useAppState } from '../../hooks/useAppState';
import { cn, plainNumber, relativeTime } from '../../lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { view, setView, seed, dataset, prefs, updatePrefs, regenerate } = useAppState();
  const isDark = prefs.theme === 'dark';

  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-6 border-r border-zinc-200 bg-white px-4 py-5',
        'dark:border-zinc-900 dark:bg-zinc-950',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-1">
        <CenitMark className="size-9 shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cénit
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Panel analítico</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-slim">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
          Panel
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                onNavigate?.();
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
                active
                  ? 'bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/25 dark:text-sky-300'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
              )}
            >
              <Icon
                className={cn(
                  'size-4.5 shrink-0',
                  active
                    ? 'text-sky-500 dark:text-sky-400'
                    : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500',
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Semilla #{seed}
            </p>
            <button
              type="button"
              onClick={() => regenerate()}
              className="grid size-6 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Regenerar dataset"
              title="Regenerar dataset"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {plainNumber(dataset.transactions.length)} movimientos ·{' '}
            {relativeTime(dataset.generatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => updatePrefs({ theme: isDark ? 'light' : 'dark' })}
          className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <span className="flex items-center gap-2.5">
            {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {isDark ? 'Modo oscuro' : 'Modo claro'}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Cambiar</span>
        </button>
      </div>
    </aside>
  );
}
