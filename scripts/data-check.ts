import { getDataset } from '../src/lib/mock/generator';
import {
  buildAllocation,
  buildAssetSeries,
  buildCashflow,
  buildKpis,
  buildPerformance,
  buildPortfolioStats,
  buildHoldings,
  buildRangeSummary,
  buildSaasKpis,
  buildSaasSeries,
  queryTransactions,
  resolveRange,
  TIME_RANGES,
} from '../src/lib/selectors';
import type { TimeRangeKey } from '../src/lib/types';

const dataset = getDataset();
let failures = 0;

const check = (label: string, condition: boolean, detail = '') => {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const finite = (value: number) => Number.isFinite(value);

console.log('── Dataset ──');
check('transacciones', dataset.transactions.length > 1000, String(dataset.transactions.length));
check('puntos de mercado', dataset.market.length > 5000, String(dataset.market.length));
check('series saas', dataset.saas.length > 300, String(dataset.saas.length));
check('balance positivo', dataset.cashBalance > 0, String(dataset.cashBalance));
check(
  'transacciones ordenadas desc',
  dataset.transactions.every((tx, index, all) => index === 0 || all[index - 1]!.timestamp >= tx.timestamp),
);
check(
  'precios finitos',
  dataset.market.every((point) => Object.values(point.prices).every((price) => finite(price) && price > 0)),
);
check(
  'importes positivos',
  dataset.transactions.every((tx) => finite(tx.amount) && tx.amount > 0),
);

const allocation = buildAllocation(dataset);
const allocationTotal = allocation.reduce((acc, slice) => acc + slice.percentage, 0);
check('asignación suma ≈ 100%', Math.abs(allocationTotal - 100) < 0.5, allocationTotal.toFixed(3));

for (const range of TIME_RANGES) {
  const key: TimeRangeKey = range.key;
  const window = resolveRange(key, dataset.endTime);
  console.log(`── Rango ${key} (${window.granularity}) ──`);

  const kpis = buildKpis(dataset, window);
  check('balance finito', finite(kpis.balance.current) && kpis.balance.current > 0);
  check('mrr finito y > 0', finite(kpis.mrr.current) && kpis.mrr.current > 0, String(kpis.mrr.current));
  check('churn en rango plausible', kpis.churn.current > 0 && kpis.churn.current < 20, String(kpis.churn.current));
  check('cartera finita y > 0', finite(kpis.portfolioPerf.current) && kpis.portfolioPerf.current > 0, String(kpis.portfolioPerf.current));
  check('sparklines con 2+ puntos', Object.values(kpis).every((trend) => trend.spark.length >= 2));
  check(
    'sparks finitas',
    Object.values(kpis).every((trend) => trend.spark.every(finite)),
  );

  const cashflow = buildCashflow(dataset, window);
  check('cashflow con puntos', cashflow.length > 0, String(cashflow.length));
  check(
    'cashflow finito',
    cashflow.every((point) => finite(point.income) && finite(point.expense) && finite(point.net)),
  );

  const performance = buildPerformance(dataset, window);
  check('performance finita', performance.every((point) => finite(point.mrr) && finite(point.portfolioValue)));
  check(
    'performance decreciente en el tiempo',
    performance.every((point, index, all) => index === 0 || all[index - 1]!.timestamp < point.timestamp),
  );

  const holdings = buildHoldings(dataset, window);
  const stats = buildPortfolioStats(dataset, window, holdings);
  check('estadísticas de cartera finitas', finite(stats.totalValue) && finite(stats.changeRange) && finite(stats.change24h));
  check('pesos de clase ≈ 100%', Math.abs(stats.classBreakdown.reduce((acc, item) => acc + item.percentage, 0) - 100) < 0.5);

  const query = {
    range: key,
    search: '',
    type: 'all' as const,
    status: 'all' as const,
    sortKey: 'timestamp' as const,
    sortDir: 'desc' as const,
  };
  const result = queryTransactions(dataset, window, query);
  check('consulta con filas', result.rows.length > 0, String(result.rows.length));
  check('resumen finito', finite(result.summary.income) && finite(result.summary.expense) && finite(result.summary.net));

  const summary = buildRangeSummary(dataset, window);
  check('resumen de rango finito', finite(summary.transactions.income) && finite(summary.transactions.avgTicket));

  const saasSeries = buildSaasSeries(dataset, window);
  check('serie saas no vacía', saasSeries.length > 0, String(saasSeries.length));
  const saasKpis = buildSaasKpis(dataset, window);
  check('kpi saas finitos', finite(saasKpis.mrr.current) && finite(saasKpis.arpu.current) && finite(saasKpis.customers.current));

  const asset = buildAssetSeries(dataset, window, 'BTC');
  check('serie de activo', asset !== null && asset.points.length > 0 && finite(asset.changePct), String(asset?.points.length));
}

console.log('── Muestras ──');
const window30 = resolveRange('30d', dataset.endTime);
const kpis30 = buildKpis(dataset, window30);
const holdings30 = buildHoldings(dataset, window30);
const stats30 = buildPortfolioStats(dataset, window30, holdings30);
console.log('  balance      ', kpis30.balance.current, '(Δ', kpis30.balance.deltaPct + '%)');
console.log('  mrr          ', kpis30.mrr.current, '(Δ', kpis30.mrr.deltaPct + '%)');
console.log('  churn        ', kpis30.churn.current + '%', '(Δ', kpis30.churn.delta + 'pp)');
console.log('  cartera      ', kpis30.portfolioPerf.current, '(Δ', kpis30.portfolioPerf.deltaPct + '%)');
console.log('  valor total  ', stats30.totalValue, '(24h', stats30.change24h + '%, rango', stats30.changeRange + '%)');
console.log('  posiciones   ', holdings30.map((holding) => `${holding.symbol} ${holding.allocation.toFixed(1)}%`).join(' · '));
console.log('  tx en 30d    ', queryTransactions(dataset, window30, {
  range: '30d',
  search: '',
  type: 'all',
  status: 'all',
  sortKey: 'timestamp',
  sortDir: 'desc',
}).total);

if (failures > 0) {
  console.error(`\n${failures} comprobaciones fallidas`);
  process.exit(1);
}
console.log('\nDATA OK');
