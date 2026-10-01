import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AppPreferences, FinancialDataset, TimeRangeKey, ViewId } from '../lib/types';
import { DEFAULT_SEED, getDataset } from '../lib/mock/generator';
import { resolveRange, type RangeWindow } from '../lib/selectors';
import { formatCompactCurrency, formatCurrency } from '../lib/utils';

const PREFS_KEY = 'cenit-prefs';
const THEME_KEY = 'cenit-theme';

const DEFAULT_PREFS: AppPreferences = {
  theme: 'dark',
  density: 'comfortable',
  hideSmallBalances: false,
  currency: 'USD',
};

function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AppPreferences>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

interface AppStateValue {
  dataset: FinancialDataset;
  seed: number;
  regenerate: (seed?: number) => void;
  view: ViewId;
  setView: (view: ViewId) => void;
  range: TimeRangeKey;
  setRange: (range: TimeRangeKey) => void;
  window: RangeWindow;
  prefs: AppPreferences;
  updatePrefs: (patch: Partial<AppPreferences>) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [view, setView] = useState<ViewId>('overview');
  const [range, setRange] = useState<TimeRangeKey>('30d');
  const [prefs, setPrefs] = useState<AppPreferences>(loadPreferences);

  const dataset = useMemo(() => getDataset(seed), [seed]);
  const window = useMemo(() => resolveRange(range, dataset.endTime), [range, dataset]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, prefs.theme);
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [prefs]);

  const updatePrefs = useCallback((patch: Partial<AppPreferences>) => {
    setPrefs((current) => ({ ...current, ...patch }));
  }, []);

  const regenerate = useCallback((nextSeed?: number) => {
    setSeed(nextSeed ?? Math.floor(Math.random() * 900_000_000) + 100_000_000);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      dataset,
      seed,
      regenerate,
      view,
      setView,
      range,
      setRange,
      window,
      prefs,
      updatePrefs,
    }),
    [dataset, seed, regenerate, view, range, window, prefs, updatePrefs],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState debe usarse dentro de <AppStateProvider>');
  return value;
}

export interface MoneyFormatters {
  format: (value: number, precise?: boolean) => string;
  compact: (value: number) => string;
}

export function useMoney(): MoneyFormatters {
  const { prefs } = useAppState();
  return useMemo(
    () => ({
      format: (value: number, precise = false) => formatCurrency(value, precise, prefs.currency),
      compact: (value: number) => formatCompactCurrency(value, prefs.currency),
    }),
    [prefs.currency],
  );
}
