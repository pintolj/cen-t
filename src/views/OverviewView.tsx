import { useMemo } from 'react';
import { ArrowRight, CircleDollarSign, Percent, PieChart, Wallet } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Delta } from '../components/ui/Delta';
import { KpiCard } from '../components/ui/KpiCard';
import { AllocationDonut } from '../components/charts/AllocationDonut';
import { ChartLegend } from '../components/charts/ChartPrimitives';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { TrendChart, type TrendSeriesConfig } from '../components/charts/TrendChart';
import { TransactionsTable } from '../components/tables/TransactionsTable';
import { useAppState, useMoney } from '../hooks/useAppState';
import {
  buildAllocation,
  buildCashflow,
  buildKpis,
  buildPerformance,
  buildRangeSummary,
  queryTransactions,
} from '../lib/selectors';
import type { TransactionsQuery } from '../lib/types';
import { cn, plainNumber } from '../lib/utils';

const COLORS = {
  income: '#10b981',
  expense: '#f43f5e',
  net: '#0ea5e9',
  mrr: '#8b5cf6',
  portfolio: '#0ea5e9',
} as const;

const RECENT_QUERY: TransactionsQuery = {
  range: '30d',
  search: '',
  type: 'all',
  status: 'all',
  sortKey: 'timestamp',
  sortDir: 'desc',
};

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={cn('font-medium tabular-nums', tone ?? 'text-zinc-900 dark:text-zinc-100')}>
        {value}
      </span>
    </div>
  );
}

export function OverviewView() {
  const { dataset, window, setView } = useAppState();
  const money = useMoney();

  const kpis = useMemo(() => buildKpis(dataset, window), [dataset, window]);
  const cashflow = useMemo(() => buildCashflow(dataset, window), [dataset, window]);
  const performance = useMemo(() => buildPerformance(dataset, window), [dataset, window]);
  const allocation = useMemo(() => buildAllocation(dataset), [dataset]);
  const summary = useMemo(() => buildRangeSummary(dataset, window), [dataset, window]);
  const recent = useMemo(
    () => queryTransactions(dataset, window, RECENT_QUERY).rows.slice(0, 6),
    [dataset, window],
  );

  const portfolioTotal = allocation.reduce((acc, slice) => acc + slice.value, 0);

  const cashflowSeries: TrendSeriesConfig[] = [
    { key: 'income', label: 'Ingresos', color: COLORS.income, kind: 'bar', format: (v) => money.format(v) },
    { key: 'expense', label: 'Gastos', color: COLORS.expense, kind: 'bar', format: (v) => money.format(v) },
    { key: 'net', label: 'Neto', color: COLORS.net, kind: 'line', format: (v) => money.format(v) },
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Balance disponible"
          value={money.format(kpis.balance.current)}
          icon={Wallet}
          tone="sky"
          delta={<Delta value={kpis.balance.delta} format="currency" />}
          spark={kpis.balance.spark}
        />
        <KpiCard
          label="MRR"
          value={money.format(kpis.mrr.current)}
          icon={CircleDollarSign}
          tone="violet"
          delta={<Delta value={kpis.mrr.deltaPct} />}
          spark={kpis.mrr.spark}
        />
        <KpiCard
          label="Churn mensual"
          value={`${kpis.churn.current.toFixed(2)}%`}
          icon={Percent}
          tone="amber"
          delta={<Delta value={kpis.churn.delta} format="pp" invert />}
          spark={kpis.churn.spark}
        />
        <KpiCard
          label="Rendimiento cartera"
          value={money.format(kpis.portfolioPerf.current)}
          icon={PieChart}
          tone="emerald"
          delta={<Delta value={kpis.portfolioPerf.deltaPct} />}
          spark={kpis.portfolioPerf.spark}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Flujo de caja"
          description={`Ingresos y gastos · ${window.label.toLowerCase()}`}
          actions={
            <ChartLegend
              items={[
                { label: 'Ingresos', color: COLORS.income, shape: 'bar' },
                { label: 'Gastos', color: COLORS.expense, shape: 'bar' },
                { label: 'Neto', color: COLORS.net },
              ]}
            />
          }
        >
          <TrendChart data={cashflow} xKey="label" series={cashflowSeries} yFormat={(v) => money.compact(v)} />
        </Card>

        <Card title="Asignación" description="Distribución del patrimonio">
          <AllocationDonut
            slices={allocation}
            centerValue={money.compact(portfolioTotal)}
            centerLabel="Patrimonio"
          />
        </Card>

        <Card
          className="xl:col-span-2"
          title="Rendimiento comparado"
          description="Evolución del MRR frente al valor de la cartera"
          actions={
            <ChartLegend
              items={[
                { label: 'MRR', color: COLORS.mrr },
                { label: 'Cartera', color: COLORS.portfolio },
              ]}
            />
          }
        >
          <PerformanceChart data={performance} />
        </Card>

        <Card title="Fuentes de ingreso" description="Reparto del MRR actual">
          <ul className="space-y-4">
            {dataset.revenueSources.map((source) => (
              <li key={source.id} className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: source.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{source.label}</p>
                    <span className="text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {money.format(source.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (source.value / (dataset.revenueSources[0]?.value || 1)) * 100)}%`,
                          background: source.color,
                        }}
                      />
                    </div>
                    <Delta value={source.growth} showIcon={false} className="w-14 justify-end" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          className="xl:col-span-2"
          title="Últimos movimientos"
          description="Seis operaciones más recientes del rango"
          actions={
            <button
              type="button"
              onClick={() => setView('transactions')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-600 transition hover:bg-sky-500/10 dark:text-sky-400"
            >
              Ver todos
              <ArrowRight className="size-3.5" />
            </button>
          }
          flush
        >
          <TransactionsTable rows={recent} dense />
        </Card>

        <Card title="Resumen del rango" description={window.label}>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            <StatRow label="Ingresos" value={money.format(summary.transactions.income)} tone="text-emerald-600 dark:text-emerald-400" />
            <StatRow label="Gastos" value={money.format(summary.transactions.expense)} tone="text-rose-600 dark:text-rose-400" />
            <StatRow label="Flujo neto" value={money.format(summary.transactions.net)} />
            <StatRow label="Movimientos" value={plainNumber(summary.transactions.count)} />
            <StatRow label="Operaciones trade" value={plainNumber(summary.trades)} />
            <StatRow label="Ticket medio" value={money.format(summary.transactions.avgTicket, true)} />
            <StatRow label="Categoría dominante" value={summary.topCategory?.label ?? '—'} />
            <StatRow label="Días activos" value={`${plainNumber(summary.activeDays)} días`} />
          </div>
          <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
            Flujo neto acumulado de {money.format(summary.transactions.net, true)} en el periodo.
          </p>
        </Card>
      </section>
    </div>
  );
}
