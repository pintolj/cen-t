import type {
  AssetDefinition,
  FinancialDataset,
  Holding,
  MarketPoint,
  RevenueSource,
  SaasMetric,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types';
import { createRng } from '../random';

const HOUR = 3_600_000;
const DAY = 86_400_000;
const HISTORY_DAYS = 400;

export const ASSETS: readonly AssetDefinition[] = [
  { symbol: 'BTC', name: 'Bitcoin', klass: 'crypto', color: '#f7931a', basePrice: 64_200, volatility: 0.009, drift: 0.00035 },
  { symbol: 'ETH', name: 'Ethereum', klass: 'crypto', color: '#627eea', basePrice: 3_150, volatility: 0.011, drift: 0.00028 },
  { symbol: 'SOL', name: 'Solana', klass: 'crypto', color: '#14b8a6', basePrice: 148, volatility: 0.014, drift: 0.0004 },
  { symbol: 'SPY', name: 'S&P 500 ETF', klass: 'equity', color: '#0ea5e9', basePrice: 548, volatility: 0.0022, drift: 0.00012 },
] as const;

const QUANTITIES: Readonly<Record<string, number>> = {
  BTC: 5.6,
  ETH: 46,
  SOL: 1_500,
  SPY: 310,
};

const BASE_CASH = 60_000;

/** Escalado de importes para que los flujos del periodo sean realistas. */
const INCOME_SCALE = 0.55;
const EXPENSE_SCALE = 1.4;

const INCOME_CONCEPTS: readonly { concept: string; asset: string; source: string; category: string; min: number; max: number }[] = [
  { concept: 'Suscripción Pro — plan mensual', asset: 'Stripe', source: 'Stripe', category: 'SaaS', min: 49, max: 399 },
  { concept: 'Retainer diseño de producto', asset: 'Acme Corp', source: 'Wise', category: 'Servicios', min: 1_800, max: 6_500 },
  { concept: 'Proyecto freelance — landing page', asset: 'Upwork', source: 'Upwork', category: 'Servicios', min: 600, max: 4_200 },
  { concept: 'Dividendos trimestrales', asset: 'SPY', source: 'Broker', category: 'Inversión', min: 120, max: 780 },
  { concept: 'Royalties plantilla digital', asset: 'Gumroad', source: 'Gumroad', category: 'Producto', min: 85, max: 1_450 },
  { concept: 'Alquiler de habitación', asset: 'Inmobiliaria', source: 'Transferencia', category: 'Ingresos', min: 520, max: 780 },
  { concept: 'Reembolso infraestructura cliente', asset: 'AWS', source: 'Wise', category: 'Reembolsos', min: 140, max: 1_900 },
  { concept: 'Venta de licencias API', asset: 'RapidAPI', source: 'Stripe', category: 'Producto', min: 210, max: 2_600 },
];

const EXPENSE_CONCEPTS: readonly { concept: string; asset: string; source: string; category: string; min: number; max: number }[] = [
  { concept: 'Suscripción cloud compute', asset: 'AWS', source: 'Tarjeta', category: 'Infraestructura', min: 82, max: 1_240 },
  { concept: 'Licencias de diseño', asset: 'Figma', source: 'Tarjeta', category: 'Software', min: 15, max: 180 },
  { concept: 'Suite de productividad', asset: 'Google Workspace', source: 'Tarjeta', category: 'Software', min: 24, max: 96 },
  { concept: 'Alquiler oficina coworking', asset: 'WeWork', source: 'Domiciliación', category: 'Oficina', min: 190, max: 460 },
  { concept: 'Compra supermercado', asset: 'Mercadona', source: 'Tarjeta', category: 'Personal', min: 28, max: 145 },
  { concept: 'Transporte y combustible', asset: 'Renfe', source: 'Tarjeta', category: 'Transporte', min: 9, max: 92 },
  { concept: 'Campaña publicitaria', asset: 'Meta Ads', source: 'Tarjeta', category: 'Marketing', min: 60, max: 2_400 },
  { concept: 'Seguro médico', asset: 'Sanitas', source: 'Domiciliación', category: 'Seguros', min: 74, max: 210 },
  { concept: 'Equipo y periféricos', asset: 'Amazon', source: 'Tarjeta', category: 'Hardware', min: 32, max: 1_180 },
  { concept: 'Comidas y restaurantes', asset: 'Restaurante', source: 'Tarjeta', category: 'Personal', min: 12, max: 96 },
];

const TRADE_ASSETS = ['BTC', 'ETH', 'SOL'] as const;

const TRADE_SIDES = ['Compra en spot', 'Venta en spot', 'Swap DEX', 'Staking recompensa'] as const;

function buildMarket(startTime: number, endTime: number, rng: ReturnType<typeof createRng>): MarketPoint[] {
  const points: MarketPoint[] = [];
  const prices: Record<string, number> = {};
  for (const asset of ASSETS) {
    prices[asset.symbol] = asset.basePrice * rng.range(0.88, 1.06);
  }

  const alignedStart = Math.ceil(startTime / HOUR) * HOUR;

  for (let t = alignedStart; t <= endTime; t += HOUR) {
    for (const asset of ASSETS) {
      const shock = rng.normal(0, 1) * asset.volatility;
      const meanReversion =
        (asset.basePrice - prices[asset.symbol]!) / asset.basePrice * 0.012;
      const overnight = t % DAY < HOUR ? 0.0008 : 0;
      const next = prices[asset.symbol]! * (1 + asset.drift + overnight + shock + meanReversion);
      prices[asset.symbol] = Math.max(next, asset.basePrice * 0.35);
    }

    points.push({
      timestamp: t,
      prices: { ...prices },
    });
  }

  return points;
}

export function priceAt(
  market: readonly MarketPoint[],
  timestamp: number,
  symbol: string,
  fallback: number,
): number {
  let low = 0;
  let high = market.length - 1;
  let best = market[0];
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const point = market[mid]!;
    if (point.timestamp <= timestamp) {
      best = point;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best?.prices[symbol] ?? fallback;
}

function buildTransactions(
  startTime: number,
  endTime: number,
  market: readonly MarketPoint[],
  rng: ReturnType<typeof createRng>,
): Transaction[] {
  const transactions: Transaction[] = [];
  let id = 0;

  for (let day = startTime; day <= endTime; day += DAY) {
    const dailyVolume = rng.int(9, 18);
    for (let i = 0; i < dailyVolume; i++) {
      const timestamp = Math.min(day + Math.floor(rng.range(0, DAY)), endTime);
      const roll = rng.next();
      const status = rng.weightedPick<TransactionStatus>([
        { value: 'completed', weight: 89 },
        { value: 'pending', weight: 8 },
        { value: 'failed', weight: 3 },
      ]);

      if (roll < 0.44) {
        const entry = rng.pick(TRADE_SIDES);
        const symbol = rng.pick(TRADE_ASSETS);
        const unitPrice = priceAt(market, timestamp, symbol, 100);
        const quantity = rng.range(0.004, 0.62) * (symbol === 'BTC' ? 1 : symbol === 'ETH' ? 6 : 40);
        transactions.push({
          id: `tx-${id++}`,
          timestamp,
          concept: `${entry} · ${symbol}`,
          asset: symbol,
          category: entry.includes('Staking') ? 'Rendimientos' : 'Trading',
          type: 'trade' as TransactionType,
          status,
          amount: Math.round(quantity * unitPrice * 100) / 100,
          quantity: Math.round(quantity * 1e6) / 1e6,
          unitPrice: Math.round(unitPrice * 100) / 100,
          source: rng.pick(['Binance', 'Coinbase', 'Kraken', 'Ledger']),
        });
      } else if (roll < 0.72) {
        const entry = rng.pick(INCOME_CONCEPTS);
        transactions.push({
          id: `tx-${id++}`,
          timestamp,
          concept: entry.concept,
          asset: entry.asset,
          category: entry.category,
          type: 'income' as TransactionType,
          status,
          amount: Math.round(rng.range(entry.min, entry.max) * INCOME_SCALE * 100) / 100,
          source: entry.source,
        });
      } else {
        const entry = rng.pick(EXPENSE_CONCEPTS);
        transactions.push({
          id: `tx-${id++}`,
          timestamp,
          concept: entry.concept,
          asset: entry.asset,
          category: entry.category,
          type: 'expense' as TransactionType,
          status,
          amount: Math.round(rng.range(entry.min, entry.max) * EXPENSE_SCALE * 100) / 100,
          source: entry.source,
        });
      }
    }
  }

  transactions.sort((a, b) => b.timestamp - a.timestamp);
  return transactions;
}

function buildSaasMetrics(startTime: number, endTime: number, rng: ReturnType<typeof createRng>): SaasMetric[] {
  const metrics: SaasMetric[] = [];
  let mrr = 41_800;
  let customers = 412;
  let arpu = 101.45;

  for (let day = startTime; day <= endTime; day += DAY) {
    const index = Math.round((day - startTime) / DAY);
    const seasonality = 1 + Math.sin((index / 90) * Math.PI * 2) * 0.004;
    const growth = 1 + 0.0026 + rng.normal(0, 0.0025);
    mrr = Math.max(9_000, mrr * growth * seasonality + (rng.chance(0.07) ? rng.range(600, 2_400) : 0));

    const newCustomers = Math.max(0, Math.round(rng.normal(9, 5) + mrr / 120_000));
    const churnedCustomers = Math.max(0, Math.round(rng.normal(5.2, 3)));
    customers = Math.max(80, customers + newCustomers - churnedCustomers);
    arpu = mrr / customers;

    const churnRate = Math.max(
      0.6,
      4.6 - index * 0.0052 + rng.normal(0, 0.38) + (rng.chance(0.05) ? rng.range(0.6, 1.6) : 0),
    );

    metrics.push({
      timestamp: day,
      mrr: Math.round(mrr * 100) / 100,
      customers,
      newCustomers,
      churnedCustomers,
      churnRate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      tickets: Math.round(rng.normal(34, 9)),
    });
  }

  return metrics;
}

const REVENUE_SOURCE_META: readonly { id: string; label: string; color: string; share: number }[] = [
  { id: 'subscriptions', label: 'Suscripciones', color: '#0ea5e9', share: 0.48 },
  { id: 'services', label: 'Servicios / Retainers', color: '#8b5cf6', share: 0.24 },
  { id: 'marketplace', label: 'Marketplace', color: '#10b981', share: 0.14 },
  { id: 'affiliate', label: 'Afiliados', color: '#f59e0b', share: 0.09 },
  { id: 'other', label: 'Otros', color: '#a1a1aa', share: 0.05 },
];

function buildHoldings(market: readonly MarketPoint[], cashBalance: number): Holding[] {
  const last = market[market.length - 1]!;
  const previous = market[market.length - 25] ?? last;

  const holdings: Holding[] = ASSETS.map((asset) => {
    const price = last.prices[asset.symbol]!;
    const prevPrice = previous.prices[asset.symbol]!;
    const quantity = QUANTITIES[asset.symbol]!;
    return {
      symbol: asset.symbol,
      name: asset.name,
      klass: asset.klass,
      color: asset.color,
      quantity,
      price,
      value: price * quantity,
      allocation: 0,
      change24h: ((price - prevPrice) / prevPrice) * 100,
      changeRange: 0,
    };
  });

  holdings.push({
    symbol: 'USD',
    name: 'Efectivo / Fiat',
    klass: 'fiat',
    color: '#a1a1aa',
    quantity: cashBalance,
    price: 1,
    value: cashBalance,
    allocation: 0,
    change24h: 0,
    changeRange: 0,
  });

  const total = holdings.reduce((acc, holding) => acc + holding.value, 0);
  return holdings.map((holding) => ({
    ...holding,
    allocation: (holding.value / total) * 100,
    value: Math.round(holding.value * 100) / 100,
  }));
}

function buildRevenueSources(mrr: number): RevenueSource[] {
  return REVENUE_SOURCE_META.map((source) => ({
    id: source.id,
    label: source.label,
    color: source.color,
    value: Math.round(mrr * source.share),
    growth: Math.round((createRng(mrr + source.share * 10_000).range(-4.8, 18.6)) * 10) / 10,
  }));
}

function generateDataset(seed: number): FinancialDataset {
  const rng = createRng(seed);
  const endTime = Date.now();
  const startTime = endTime - HISTORY_DAYS * DAY;

  const market = buildMarket(startTime, endTime, rng);
  const transactions = buildTransactions(startTime, endTime, market, rng);
  const saas = buildSaasMetrics(startTime, endTime, rng);

  /** El balance final reconcilia el capital inicial con el flujo neto histórico. */
  let netFlow = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') netFlow += tx.amount;
    else if (tx.type === 'expense') netFlow -= tx.amount;
  }
  const cashBalance = Math.round((BASE_CASH + netFlow) * 100) / 100;

  const holdingsSnapshot = buildHoldings(market, cashBalance);
  const revenueSources = buildRevenueSources(saas[saas.length - 1]!.mrr);

  return {
    seed,
    generatedAt: endTime,
    startTime,
    endTime,
    transactions,
    market,
    saas,
    holdingsSnapshot,
    revenueSources,
    cashBalance,
  };
}

export const DEFAULT_SEED = 20260930;

const datasetCache = new Map<number, FinancialDataset>();

/** Caché por seed: datasets reutilizables y reproucibles en la misma sesión. */
export function getDataset(seed = DEFAULT_SEED): FinancialDataset {
  let dataset = datasetCache.get(seed);
  if (!dataset) {
    dataset = generateDataset(seed);
    datasetCache.set(seed, dataset);
  }
  return dataset;
}

export const DATASET_STATS = {
  historyDays: HISTORY_DAYS,
  hour: HOUR,
  day: DAY,
} as const;
