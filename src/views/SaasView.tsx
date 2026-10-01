import { useMemo } from 'react';
import { Activity, CircleDollarSign, Percent, Users } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Delta } from '../components/ui/Delta';
import { KpiCard } from '../components/ui/KpiCard';
import { ChartLegend } from '../components/charts/ChartPrimitives';
import { TrendChart, type TrendSeriesConfig } from '../components/charts/TrendChart';
import { useAppState, useMoney } from '../hooks/useAppState';
import { buildSaasKpis, buildSaasSeries } from '../lib/selectors';
import { plainNumber } from '../lib/utils';

const COLORS = {
  mrr: '#8b5cf6',
  customers: '#0ea5e9',
  added: '#10b981',
  churned: '#f43f5e',
  churn: '#f59e0b',
  arpu: '#14b8a6',
} as const;

const CHURN_TARGET = 2.5;

export function SaasView() {
  const { dataset, window } = useAppState();
  const money = useMoney();

  const series = useMemo(() => buildSaasSeries(dataset, window), [dataset, window]);
  const kpis = useMemo(() => buildSaasKpis(dataset, window), [dataset, window]);
  const revenueTotal = dataset.revenueSources.reduce((acc, source) => acc + source.value, 0);

  const mrrSeries: TrendSeriesConfig[] = [
    { key: 'mrr', label: 'MRR', color: COLORS.mrr, kind: 'area', format: (v) => money.format(v) },
  ];
  const customersSeries: TrendSeriesConfig[] = [
    { key: 'customers', label: 'Clientes', color: COLORS.customers, kind: 'line' },
  ];
  const churnFlowSeries: TrendSeriesConfig[] = [
    { key: 'newCustomers', label: 'Altas', color: COLORS.added, kind: 'bar' },
    { key: 'churnedCustomers', label: 'Bajas', color: COLORS.churned, kind: 'bar' },
  ];
  const churnSeries: TrendSeriesConfig[] = [
    { key: 'churnRate', label: 'Churn', color: COLORS.churn, kind: 'line', format: (v) => `${v.toFixed(2)} %` },
  ];
  const arpuSeries: TrendSeriesConfig[] = [
    { key: 'arpu', label: 'ARPU', color: COLORS.arpu, kind: 'area', format: (v) => money.format(v, true) },
  ];

  const latest = dataset.saas[dataset.saas.length - 1];

  const xFormat = (value: string | number): string => {
    const date = new Date(value);
    if (window.granularity === 'hour') {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (window.granularity === 'day') {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="MRR"
          value={money.format(kpis.mrr.current)}
          icon={CircleDollarSign}
          tone="violet"
          delta={<Delta value={kpis.mrr.deltaPct} />}
          spark={kpis.mrr.spark}
        />
        <KpiCard
          label="Clientes activos"
          value={plainNumber(kpis.customers.current)}
          icon={Users}
          tone="sky"
          delta={<Delta value={kpis.customers.deltaPct} />}
          spark={kpis.customers.spark}
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
          label="ARPU"
          value={money.format(kpis.arpu.current, true)}
          icon={Activity}
          tone="emerald"
          delta={<Delta value={kpis.arpu.deltaPct} />}
          spark={kpis.arpu.spark}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Ingresos recurrentes"
          description={`Evolución del MRR · ${window.label.toLowerCase()}`}
          actions={
            <ChartLegend items={[{ label: 'MRR', color: COLORS.mrr }]} />
          }
        >
          <TrendChart data={series} xKey="timestamp" series={mrrSeries} height={280} yFormat={(v) => money.compact(v)} yWidth={60} />
        </Card>

        <Card title="Base de clientes" description="Altas netas acumuladas">
          <TrendChart
            data={series}
            xKey="timestamp"
            xFormat={xFormat}
            series={customersSeries}
            height={280}
            yFormat={(v) => plainNumber(Math.round(v))}
            yWidth={44}
          />
        </Card>

        <Card title="Altas y bajas" description="Nuevos clientes frente a bajas">
          <TrendChart
            data={series}
            xKey="timestamp"
            xFormat={xFormat}
            series={churnFlowSeries}
            height={240}
            yFormat={(v) => String(Math.round(v))}
            yWidth={32}
          />
        </Card>

        <Card
          title="Tasa de churn"
          description="Objetivo por debajo del 2,5 %"
          actions={
            <ChartLegend items={[{ label: 'Churn', color: COLORS.churn }, { label: 'Objetivo', color: COLORS.churn, shape: 'dashed' }]} />
          }
        >
          <TrendChart
            data={series}
            xKey="timestamp"
            xFormat={xFormat}
            series={churnSeries}
            height={240}
            yFormat={(v) => `${v.toFixed(1)}%`}
            yWidth={40}
            reference={{ value: CHURN_TARGET, label: `Objetivo ${CHURN_TARGET}%` }}
          />
        </Card>

        <Card title="ARPU" description="Ingreso medio por cliente">
          <TrendChart
            data={series}
            xKey="timestamp"
            xFormat={xFormat}
            series={arpuSeries}
            height={240}
            yFormat={(v) => money.compact(v)}
            yWidth={48}
          />
        </Card>

        <Card
          className="xl:col-span-3"
          title="Fuentes de ingreso"
          description={`Reparto de ${money.format(revenueTotal)} en MRR`}
        >
          <div className="overflow-x-auto scrollbar-slim">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className="text-[11px] text-zinc-500 dark:text-zinc-400">
                <tr className="border-b border-zinc-200/70 dark:border-zinc-800/70">
                  <th scope="col" className="px-1 py-3 font-medium uppercase tracking-wider">Fuente</th>
                  <th scope="col" className="px-1 py-3 text-right font-medium uppercase tracking-wider">MRR</th>
                  <th scope="col" className="px-1 py-3 text-right font-medium uppercase tracking-wider">Peso</th>
                  <th scope="col" className="px-1 py-3 text-right font-medium uppercase tracking-wider">Crecimiento</th>
                </tr>
              </thead>
              <tbody>
                {dataset.revenueSources.map((source) => (
                  <tr
                    key={source.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                  >
                    <td className="py-3 pr-1">
                      <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-200">
                        <span className="size-2.5 rounded-full" style={{ background: source.color }} />
                        {source.label}
                      </span>
                    </td>
                    <td className="px-1 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {money.format(source.value)}
                    </td>
                    <td className="px-1 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {((source.value / (revenueTotal || 1)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-1 py-3 text-right">
                      <Delta value={source.growth} showIcon={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {latest ? (
            <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
              Última lectura: {plainNumber(latest.customers)} clientes · {plainNumber(latest.tickets)} tickets de soporte ·{' '}
              {money.format(latest.mrr)} de MRR.
            </p>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
