import { useMemo, useState } from 'react';
import { Activity, Layers, Trophy } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Delta } from '../components/ui/Delta';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/ui/KpiCard';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { AssetPriceChart } from '../components/charts/AssetPriceChart';
import { HoldingsTable } from '../components/tables/HoldingsTable';
import { useAppState, useMoney } from '../hooks/useAppState';
import { ASSETS } from '../lib/mock/generator';
import {
  buildAssetSeries,
  buildHoldings,
  buildKpis,
  buildPortfolioStats,
} from '../lib/selectors';
import { formatPercent, plainNumber } from '../lib/utils';

const ASSET_OPTIONS = ASSETS.map((asset) => ({ value: asset.symbol, label: asset.symbol }));

export function PortfolioView() {
  const { dataset, window, prefs } = useAppState();
  const money = useMoney();
  const [symbol, setSymbol] = useState(ASSETS[0]!.symbol);

  const holdings = useMemo(() => buildHoldings(dataset, window), [dataset, window]);
  const stats = useMemo(
    () => buildPortfolioStats(dataset, window, holdings),
    [dataset, window, holdings],
  );
  const kpis = useMemo(() => buildKpis(dataset, window), [dataset, window]);
  const assetSeries = useMemo(() => buildAssetSeries(dataset, window, symbol), [dataset, window, symbol]);

  const visibleHoldings = prefs.hideSmallBalances
    ? holdings.filter((holding) => holding.allocation >= 1)
    : holdings;

  const bestSpark = useMemo(
    () => (stats.best ? buildAssetSeries(dataset, window, stats.best.symbol) : null),
    [dataset, window, stats.best],
  );
  const worstSpark = useMemo(
    () => (stats.worst ? buildAssetSeries(dataset, window, stats.worst.symbol) : null),
    [dataset, window, stats.worst],
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Valor de cartera"
          value={money.format(stats.totalValue)}
          icon={Layers}
          tone="sky"
          delta={<Delta value={stats.change24h} />}
          deltaCaption="vs. hace 24 h"
          spark={kpis.portfolioPerf.spark}
        />
        <KpiCard
          label="Cambio en el rango"
          value={formatPercent(stats.changeRange)}
          icon={Activity}
          tone="emerald"
          delta={<Delta value={stats.changeRange} />}
          deltaCaption={window.label.toLowerCase()}
          spark={kpis.portfolioPerf.spark}
        />
        <KpiCard
          label="Mejor posición"
          value={stats.best ? formatPercent(stats.best.changeRange) : '—'}
          icon={Trophy}
          tone="violet"
          delta={
            <Delta
              value={stats.best?.changeRange ?? 0}
              showIcon={false}
              className="text-zinc-500 dark:text-zinc-400"
            />
          }
          deltaCaption={stats.best ? stats.best.name : 'Sin datos'}
          spark={bestSpark?.points.map((point) => point.price) ?? kpis.portfolioPerf.spark}
        />
        <KpiCard
          label="Peor posición"
          value={stats.worst ? formatPercent(stats.worst.changeRange) : '—'}
          icon={Trophy}
          tone="amber"
          delta={
            <Delta
              value={stats.worst?.changeRange ?? 0}
              showIcon={false}
              className="text-zinc-500 dark:text-zinc-400"
            />
          }
          deltaCaption={stats.worst ? stats.worst.name : 'Sin datos'}
          spark={worstSpark?.points.map((point) => point.price) ?? kpis.portfolioPerf.spark}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={`Precio · ${symbol}`}
          description={
            assetSeries
              ? `${assetSeries.points.length} puntos · ${formatPercent(assetSeries.changePct)} en ${window.label.toLowerCase()}`
              : 'Sin datos en el rango'
          }
          actions={<SegmentedControl options={ASSET_OPTIONS} value={symbol} onChange={setSymbol} size="sm" ariaLabel="Activo" />}
        >
          {assetSeries ? (
            <AssetPriceChart series={assetSeries} />
          ) : (
            <EmptyState title="Sin serie de precios" description="No hay datos de mercado en este rango." />
          )}
        </Card>

        <Card title="Asignación por clase" description="Peso relativo del patrimonio">
          <ul className="space-y-4">
            {stats.classBreakdown.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, background: item.color }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800/70">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Efectivo</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {money.format(dataset.cashBalance)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Valor de compra (rango)</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {money.format(stats.startValue)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-zinc-500 dark:text-zinc-400">Posiciones visibles</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {plainNumber(visibleHoldings.length)} / {plainNumber(holdings.length)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          className="xl:col-span-3"
          title="Posiciones"
          description={
            prefs.hideSmallBalances
              ? 'Ocultando posiciones con peso inferior al 1 %'
              : 'Valor, asignación y variación de cada activo'
          }
          flush
        >
          {visibleHoldings.length > 0 ? (
            <HoldingsTable holdings={visibleHoldings} dense={prefs.density === 'compact'} />
          ) : (
            <EmptyState
              title="No hay posiciones visibles"
              description="Desactiva el filtro de saldos pequeños en Ajustes para verlas todas."
              className="m-5"
            />
          )}
        </Card>
      </section>
    </div>
  );
}
