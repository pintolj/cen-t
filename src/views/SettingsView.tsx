import { useCallback, type ReactNode } from 'react';
import { Database, Info, Moon, RefreshCw, Sun, UserRound } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Switch } from '../components/ui/Switch';
import { useAppState } from '../hooks/useAppState';
import { DEFAULT_SEED, DATASET_STATS } from '../lib/mock/generator';
import type { AppPreferences } from '../lib/types';
import { plainNumber } from '../lib/utils';

function SettingRow({
  label,
  description,
  control,
  icon,
}: {
  label: string;
  description: string;
  control: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/50">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export function SettingsView() {
  const { prefs, updatePrefs, seed, regenerate, dataset } = useAppState();

  const setTheme = useCallback(
    (value: 'light' | 'dark') => updatePrefs({ theme: value }),
    [updatePrefs],
  );
  const setDensity = useCallback(
    (value: AppPreferences['density']) => updatePrefs({ density: value }),
    [updatePrefs],
  );
  const setCurrency = useCallback(
    (value: AppPreferences['currency']) => updatePrefs({ currency: value }),
    [updatePrefs],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card
        title="Apariencia"
        description="Cómo se muestra el panel en este dispositivo"
        bodyClassName="px-5 pb-2"
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          <SettingRow
            label="Tema"
            description="El modo oscuro se aplica de forma inmediata."
            icon={prefs.theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            control={
              <SegmentedControl
                ariaLabel="Tema"
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Oscuro' },
                ]}
                value={prefs.theme}
                onChange={setTheme}
                size="sm"
              />
            }
          />
          <SettingRow
            label="Densidad"
            description="Compacto reduce el alto de las filas de las tablas."
            icon={<Database className="size-4" />}
            control={
              <SegmentedControl
                ariaLabel="Densidad"
                options={[
                  { value: 'comfortable', label: 'Cómodo' },
                  { value: 'compact', label: 'Compacto' },
                ]}
                value={prefs.density}
                onChange={setDensity}
                size="sm"
              />
            }
          />
        </div>
      </Card>

      <Card
        title="Preferencias"
        description="Formato numérico y filtros por defecto"
        bodyClassName="px-5 pb-2"
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          <SettingRow
            label="Moneda"
            description="Conversión de referencia fija a partir del USD."
            icon={<Info className="size-4" />}
            control={
              <SegmentedControl
                ariaLabel="Moneda"
                options={[
                  { value: 'USD', label: 'USD $' },
                  { value: 'EUR', label: 'EUR €' },
                ]}
                value={prefs.currency}
                onChange={setCurrency}
                size="sm"
              />
            }
          />
          <SettingRow
            label="Ocultar saldos pequeños"
            description="Filtra posiciones con menos del 1 % del patrimonio en la cartera."
            icon={<UserRound className="size-4" />}
            control={
              <Switch
                checked={prefs.hideSmallBalances}
                onChange={(checked) => updatePrefs({ hideSmallBalances: checked })}
                label="Filtro activo"
              />
            }
          />
        </div>
      </Card>

      <Card
        title="Datos simulados"
        description="Dataset determinista generado localmente en tu navegador"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => regenerate()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600"
            >
              <RefreshCw className="size-3.5" />
              Nueva semilla
            </button>
            <button
              type="button"
              onClick={() => regenerate(DEFAULT_SEED)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Restaurar
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Semilla activa" value={`#${plainNumber(seed)}`} />
          <StatTile label="Movimientos" value={plainNumber(dataset.transactions.length)} />
          <StatTile label="Puntos de mercado" value={plainNumber(dataset.market.length)} />
          <StatTile label="Series SaaS" value={plainNumber(dataset.saas.length)} />
          <StatTile label="Histórico" value={`${DATASET_STATS.historyDays} días`} />
          <StatTile
            label="Generado"
            value={new Date(dataset.generatedAt).toLocaleString('es-ES', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>
        <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
          Cambiar la semilla regenera precios, movimientos y métricas con valores distintos pero
          siempre reproducibles para esa semilla.
        </p>
      </Card>

      <Card title="Acerca de" description="Cénit · Panel analítico" bodyClassName="px-5 pb-2">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
          <SettingRow
            label="Stack"
            description="React 19 · Vite 7 · TypeScript 5.9 · Tailwind CSS 4 · Recharts 3"
            icon={<Info className="size-4" />}
            control={<span className="text-xs text-zinc-400">v1.0.0</span>}
          />
          <SettingRow
            label="Alcance"
            description="Cripto, renta variable, finanzas personales y métricas SaaS en un panel unificado."
            icon={<Database className="size-4" />}
            control={<span className="text-xs text-zinc-400">Demo</span>}
          />
          <SettingRow
            label="Privacidad"
            description="Todo se genera y calcula localmente: no hay conexiones a servicios externos."
            icon={<UserRound className="size-4" />}
            control={<span className="text-xs text-emerald-500">Sin red</span>}
          />
        </div>
      </Card>
    </div>
  );
}
