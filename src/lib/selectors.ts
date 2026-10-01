import type {
  AllocationSlice,
  CashflowPoint,
  FinancialDataset,
  Granularity,
  Holding,
  KpiSummary,
  KpiTrend,
  PerformancePoint,
  SaasMetric,
  TimeRange,
  TimeRangeKey,
  Transaction,
  TransactionsQuery,
  TransactionSummary,
} from './types';
import { lowerBound } from './random';
import { priceAt } from './mock/generator';

const DAY_MS = 86_400_000;

export const TIME_RANGES: readonly TimeRange[] = [
  { key: 'today', label: 'Hoy', shortLabel: 'Hoy' },
  { key: '7d', label: 'Últimos 7 días', shortLabel: '7 días' },
  { key: '30d', label: 'Últimos 30 días', shortLabel: '30 días' },
  { key: '1y', label: 'Últimos 12 meses', shortLabel: '1 año' },
  { key: 'ytd', label: 'Año en curso', shortLabel: 'YTD' },
] as const;

export interface RangeWindow {
  key: TimeRangeKey;
  label: string;
  start: number;
  end: number;
  granularity: Granularity;
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfYear(timestamp: number): number {
  const date = new Date(timestamp);
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function resolveRange(key: TimeRangeKey, end: number): RangeWindow {
  const today = startOfDay(end);
  switch (key) {
    case 'today':
      return { key, label: 'Hoy', start: today, end, granularity: 'hour' };
    case '7d':
      return { key, label: 'Últimos 7 días', start: today - 6 * DAY_MS, end, granularity: 'day' };
    case '30d':
      return { key, label: 'Últimos 30 días', start: today - 29 * DAY_MS, end, granularity: 'day' };
    case '1y':
      return { key, label: 'Últimos 12 meses', start: end - 365 * DAY_MS, end, granularity: 'week' };
    case 'ytd':
      return { key, label: 'Año en curso', start: startOfYear(end), end, granularity: 'week' };
  }
}

/** Ventana inmediatamente anterior de la misma duración (comparativas). */
export function previousWindow(window: RangeWindow): RangeWindow {
  const span = window.end - window.start;
  return { ...window, start: window.start - span, end: window.start };
}

export function bucketStart(timestamp: number, granularity: Granularity): number {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  switch (granularity) {
    case 'hour':
      date.setMinutes(0, 0, 0);
      return date.getTime();
    case 'day':
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    case 'week': {
      date.setHours(0, 0, 0, 0);
      const offset = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - offset);
      return date.getTime();
    }
    case 'month':
      date.setHours(0, 0, 0, 0);
      date.setDate(1);
      return date.getTime();
  }
}

export function nextBucket(timestamp: number, granularity: Granularity): number {
  const date = new Date(timestamp);
  switch (granularity) {
    case 'hour':
      date.setHours(date.getHours() + 1);
      break;
    case 'day':
      date.setDate(date.getDate() + 1);
      break;
    case 'week':
      date.setDate(date.getDate() + 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.getTime();
}

export function bucketLabel(timestamp: number, granularity: Granularity): string {
  const date = new Date(timestamp);
  switch (granularity) {
    case 'hour':
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    case 'day':
    case 'week':
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    case 'month':
      return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  }
}

/** Itera todos los buckets de la ventana sin acumular error de huso horario. */
export function* eachBucket(window: RangeWindow): Generator<number> {
  let cursor = bucketStart(window.start, window.granularity);
  while (cursor <= window.end) {
    yield cursor;
    cursor = nextBucket(cursor, window.granularity);
  }
}

/** Remuestreo equiespaciado que conserva siempre el último elemento. */
export function sample<T>(items: readonly T[], max: number): T[] {
  if (items.length <= max) return items.slice();
  const step = Math.ceil(items.length / max);
  const output: T[] = [];
  for (let index = 0; index < items.length; index += step) {
    output.push(items[index]!);
  }
  const last = items[items.length - 1]!;
  if (output[output.length - 1] !== last) output.push(last);
  return output;
}

/** Recorte O(log n) sobre series ordenadas ascendentemente por timestamp. */
export function sliceWindow<T extends { timestamp: number }>(
  items: readonly T[],
  window: RangeWindow,
): T[] {
  const from = lowerBound(items, window.start);
  const to = lowerBound(items, window.end + 1);
  return items.slice(from, to);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function toTrend(current: number, previous: number, spark: readonly number[]): KpiTrend {
  const delta = current - previous;
  const deltaPct = previous === 0 ? 0 : (delta / Math.abs(previous)) * 100;
  return {
    current: round2(current),
    previous: round2(previous),
    delta: round2(delta),
    deltaPct: round2(deltaPct),
    spark: spark.length > 1 ? spark.slice() : [previous, current],
  };
}

function metricAt(series: readonly SaasMetric[], timestamp: number): SaasMetric | null {
  const index = lowerBound(series, timestamp);
  if (index === 0) return series[0] ?? null;
  const exact = series[index];
  if (exact && exact.timestamp === timestamp) return exact;
  return series[index - 1] ?? series[0] ?? null;
}

export function mrrAt(dataset: FinancialDataset, timestamp: number): number {
  return metricAt(dataset.saas, timestamp)?.mrr ?? 0;
}

export function churnAt(dataset: FinancialDataset, timestamp: number): number {
  return metricAt(dataset.saas, timestamp)?.churnRate ?? 0;
}

export function portfolioValueAt(dataset: FinancialDataset, timestamp: number): number {
  let total = 0;
  for (const holding of dataset.holdingsSnapshot) {
    total += holding.quantity * priceAt(dataset.market, timestamp, holding.symbol, holding.price);
  }
  return total;
}

export function buildCashflow(dataset: FinancialDataset, window: RangeWindow): CashflowPoint[] {
  const buckets = new Map<number, { income: number; expense: number; count: number }>();

  for (const tx of dataset.transactions) {
    if (tx.timestamp < window.start || tx.timestamp > window.end) continue;
    if (tx.type === 'trade') continue;
    const key = bucketStart(tx.timestamp, window.granularity);
    let entry = buckets.get(key);
    if (!entry) {
      entry = { income: 0, expense: 0, count: 0 };
      buckets.set(key, entry);
    }
    if (tx.type === 'income') entry.income += tx.amount;
    else entry.expense += tx.amount;
    entry.count += 1;
  }

  const points: CashflowPoint[] = [];
  for (const timestamp of eachBucket(window)) {
    const entry = buckets.get(timestamp) ?? { income: 0, expense: 0, count: 0 };
    const income = round2(entry.income);
    const expense = round2(entry.expense);
    points.push({
      timestamp,
      label: bucketLabel(timestamp, window.granularity),
      income,
      expense,
      net: round2(income - expense),
      count: entry.count,
    });
  }
  return points;
}

export function buildPerformance(
  dataset: FinancialDataset,
  window: RangeWindow,
): PerformancePoint[] {
  const points: PerformancePoint[] = [];
  for (const timestamp of eachBucket(window)) {
    points.push({
      timestamp,
      label: bucketLabel(timestamp, window.granularity),
      mrr: round2(mrrAt(dataset, timestamp)),
      portfolioValue: round2(portfolioValueAt(dataset, timestamp)),
    });
  }
  return points;
}

export function buildKpis(dataset: FinancialDataset, window: RangeWindow): KpiSummary {
  const performance = buildPerformance(dataset, window);
  const cashflow = buildCashflow(dataset, window);

  const latest = dataset.saas[dataset.saas.length - 1];
  const currentMrr = latest?.mrr ?? 0;
  const previousMrr = mrrAt(dataset, window.start);
  const currentChurn = latest?.churnRate ?? 0;
  const previousChurn = churnAt(dataset, window.start);

  const currentPortfolio = portfolioValueAt(dataset, window.end);
  const previousPortfolio = portfolioValueAt(dataset, window.start);

  let net = 0;
  for (const point of cashflow) net += point.net;
  const currentBalance = dataset.cashBalance;
  const previousBalance = currentBalance - net;
  const balanceSpark: number[] = [];
  let running = previousBalance;
  for (const point of cashflow) {
    running += point.net;
    balanceSpark.push(Math.round(running));
  }

  return {
    balance: toTrend(currentBalance, previousBalance, sample(balanceSpark, 26)),
    mrr: toTrend(currentMrr, previousMrr, sample(performance.map((point) => point.mrr), 26)),
    churn: toTrend(
      currentChurn,
      previousChurn,
      sample(
        performance.map((point) => churnAt(dataset, point.timestamp)),
        26,
      ),
    ),
    portfolioPerf: toTrend(
      currentPortfolio,
      previousPortfolio,
      sample(
        performance.map((point) => point.portfolioValue),
        26,
      ),
    ),
  };
}

export function buildAllocation(dataset: FinancialDataset): AllocationSlice[] {
  return [...dataset.holdingsSnapshot]
    .sort((a, b) => b.value - a.value)
    .map((holding) => ({
      id: holding.symbol,
      label: holding.name,
      value: holding.value,
      percentage: holding.allocation,
      color: holding.color,
    }));
}

export function buildHoldings(dataset: FinancialDataset, window: RangeWindow): Holding[] {
  return dataset.holdingsSnapshot.map((holding) => {
    const startPrice = priceAt(dataset.market, window.start, holding.symbol, holding.price);
    const changeRange = startPrice > 0 ? ((holding.price - startPrice) / startPrice) * 100 : 0;
    return { ...holding, changeRange: round2(changeRange) };
  });
}

export interface PortfolioStats {
  totalValue: number;
  change24h: number;
  changeRange: number;
  startValue: number;
  best: Holding | null;
  worst: Holding | null;
  classBreakdown: { label: string; percentage: number; color: string }[];
}

export function buildPortfolioStats(
  dataset: FinancialDataset,
  window: RangeWindow,
  holdings: readonly Holding[],
): PortfolioStats {
  const totalValue = holdings.reduce((acc, holding) => acc + holding.value, 0);
  const startValue = holdings.reduce(
    (acc, holding) =>
      acc + holding.quantity * priceAt(dataset.market, window.start, holding.symbol, holding.price),
    0,
  );

  const change24h =
    totalValue > 0
      ? holdings.reduce((acc, holding) => acc + holding.value * holding.change24h, 0) / totalValue
      : 0;

  let best: Holding | null = null;
  let worst: Holding | null = null;
  for (const holding of holdings) {
    if (holding.klass === 'fiat') continue;
    if (!best || holding.changeRange > best.changeRange) best = holding;
    if (!worst || holding.changeRange < worst.changeRange) worst = holding;
  }

  const classColors: Record<string, string> = {
    crypto: '#8b5cf6',
    equity: '#0ea5e9',
    fiat: '#a1a1aa',
  };
  const classNames: Record<string, string> = {
    crypto: 'Cripto',
    equity: 'Renta variable',
    fiat: 'Efectivo',
  };

  const buckets = new Map<string, number>();
  for (const holding of holdings) {
    buckets.set(holding.klass, (buckets.get(holding.klass) ?? 0) + holding.value);
  }
  const classBreakdown = [...buckets.entries()]
    .map(([klass, value]) => ({
      label: classNames[klass] ?? klass,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: classColors[klass] ?? '#a1a1aa',
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    totalValue: round2(totalValue),
    change24h: round2(change24h),
    changeRange: startValue > 0 ? round2(((totalValue - startValue) / startValue) * 100) : 0,
    startValue: round2(startValue),
    best,
    worst,
    classBreakdown,
  };
}

export interface TransactionQueryResult {
  rows: Transaction[];
  summary: TransactionSummary;
  total: number;
}

function summarize(rows: readonly Transaction[]): TransactionSummary {
  let income = 0;
  let expense = 0;
  let pending = 0;
  let failed = 0;
  let volume = 0;

  for (const tx of rows) {
    volume += tx.amount;
    if (tx.status === 'pending') pending += 1;
    else if (tx.status === 'failed') failed += 1;
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
  }

  return {
    income: round2(income),
    expense: round2(expense),
    net: round2(income - expense),
    count: rows.length,
    pending,
    failed,
    avgTicket: rows.length > 0 ? round2(volume / rows.length) : 0,
  };
}

export function queryTransactions(
  dataset: FinancialDataset,
  window: RangeWindow,
  query: TransactionsQuery,
): TransactionQueryResult {
  const term = query.search.trim().toLowerCase();
  const rows = dataset.transactions.filter((tx) => {
    if (tx.timestamp < window.start || tx.timestamp > window.end) return false;
    if (query.type !== 'all' && tx.type !== query.type) return false;
    if (query.status !== 'all' && tx.status !== query.status) return false;
    if (!term) return true;
    return (
      tx.concept.toLowerCase().includes(term) ||
      tx.asset.toLowerCase().includes(term) ||
      tx.source.toLowerCase().includes(term) ||
      tx.category.toLowerCase().includes(term)
    );
  });

  const direction = query.sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    switch (query.sortKey) {
      case 'amount':
        return (a.amount - b.amount) * direction;
      case 'asset':
        return a.asset.localeCompare(b.asset) * direction;
      default:
        return (a.timestamp - b.timestamp) * direction;
    }
  });

  return { rows, summary: summarize(rows), total: rows.length };
}

export function buildSaasSeries(dataset: FinancialDataset, window: RangeWindow): SaasMetric[] {
  return sample(sliceWindow(dataset.saas, window), 200);
}

export interface SaasKpis {
  mrr: KpiTrend;
  churn: KpiTrend;
  arpu: KpiTrend;
  customers: KpiTrend;
}

export function buildSaasKpis(dataset: FinancialDataset, window: RangeWindow): SaasKpis {
  const series = buildSaasSeries(dataset, window);
  const latest = dataset.saas[dataset.saas.length - 1];
  const start = metricAt(dataset.saas, window.start) ?? latest;

  return {
    mrr: toTrend(latest?.mrr ?? 0, start?.mrr ?? 0, sample(series.map((point) => point.mrr), 26)),
    churn: toTrend(
      latest?.churnRate ?? 0,
      start?.churnRate ?? 0,
      sample(series.map((point) => point.churnRate), 26),
    ),
    arpu: toTrend(latest?.arpu ?? 0, start?.arpu ?? 0, sample(series.map((point) => point.arpu), 26)),
    customers: toTrend(
      latest?.customers ?? 0,
      start?.customers ?? 0,
      sample(series.map((point) => point.customers), 26),
    ),
  };
}

export interface AssetPoint {
  timestamp: number;
  price: number;
  index: number;
}

export interface AssetSeries {
  symbol: string;
  points: AssetPoint[];
  changePct: number;
}

export function buildAssetSeries(
  dataset: FinancialDataset,
  window: RangeWindow,
  symbol: string,
): AssetSeries | null {
  const market = sliceWindow(dataset.market, window);
  if (market.length === 0) return null;

  const fallback =
    dataset.holdingsSnapshot.find((holding) => holding.symbol === symbol)?.price ??
    market[0]!.prices[symbol] ??
    0;

  const points: AssetPoint[] = [];
  for (const point of sample(market, 260)) {
    const price = point.prices[symbol] ?? fallback;
    points.push({ timestamp: point.timestamp, price, index: 0 });
  }

  const base = points[0]!.price || 1;
  for (const point of points) point.index = (point.price / base) * 100;

  const first = points[0]!.price;
  const last = points[points.length - 1]!.price;
  return {
    symbol,
    points,
    changePct: first > 0 ? round2(((last - first) / first) * 100) : 0,
  };
}

export interface RangeSummary {
  transactions: TransactionSummary;
  trades: number;
  activeDays: number;
  topCategory: { label: string; value: number } | null;
}

export function buildRangeSummary(
  dataset: FinancialDataset,
  window: RangeWindow,
): RangeSummary {
  const rows: Transaction[] = [];
  const categories = new Map<string, number>();
  const activeDays = new Set<number>();
  let trades = 0;

  for (const tx of dataset.transactions) {
    if (tx.timestamp < window.start || tx.timestamp > window.end) continue;
    rows.push(tx);
    activeDays.add(startOfDay(tx.timestamp));
    if (tx.type === 'trade') trades += 1;
    if (tx.type !== 'trade') {
      categories.set(tx.category, (categories.get(tx.category) ?? 0) + tx.amount);
    }
  }

  let topCategory: { label: string; value: number } | null = null;
  for (const [label, value] of categories) {
    if (!topCategory || value > topCategory.value) topCategory = { label, value: round2(value) };
  }

  return { transactions: summarize(rows), trades, activeDays: activeDays.size, topCategory };
}
