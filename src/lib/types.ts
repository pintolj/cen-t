export type TimeRangeKey = 'today' | '7d' | '30d' | '1y' | 'ytd';

export type Granularity = 'hour' | 'day' | 'week' | 'month';

export type TransactionType = 'income' | 'expense' | 'trade';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export type AssetClass = 'crypto' | 'equity' | 'fiat';

export type ViewId = 'overview' | 'portfolio' | 'saas' | 'transactions' | 'settings';

export interface TimeRange {
  key: TimeRangeKey;
  label: string;
  shortLabel: string;
}

export interface Transaction {
  id: string;
  timestamp: number;
  concept: string;
  /** Activo (BTC, ETH…) o servicio (AWS, Stripe…) implicado en la operación. */
  asset: string;
  category: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Importe en USD. Siempre positivo; el signo lo aporta `type`. */
  amount: number;
  /** Sólo para `trade`: cantidad de unidad negociada. */
  quantity?: number;
  /** Sólo para `trade`: precio unitario en USD. */
  unitPrice?: number;
  /** Canal / proveedor donde ocurrió la operación. */
  source: string;
}

export interface MarketPoint {
  timestamp: number;
  prices: Readonly<Record<string, number>>;
}

export interface AssetDefinition {
  symbol: string;
  name: string;
  klass: AssetClass;
  color: string;
  basePrice: number;
  volatility: number;
  drift: number;
}

export interface Holding {
  symbol: string;
  name: string;
  klass: AssetClass;
  color: string;
  quantity: number;
  price: number;
  value: number;
  allocation: number;
  change24h: number;
  changeRange: number;
}

export interface SaasMetric {
  timestamp: number;
  mrr: number;
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  arpu: number;
  tickets: number;
}

export interface RevenueSource {
  id: string;
  label: string;
  value: number;
  color: string;
  growth: number;
}

export interface FinancialDataset {
  seed: number;
  generatedAt: number;
  startTime: number;
  endTime: number;
  transactions: Transaction[];
  market: MarketPoint[];
  saas: SaasMetric[];
  holdingsSnapshot: Holding[];
  revenueSources: RevenueSource[];
  cashBalance: number;
}

export interface PerformancePoint {
  timestamp: number;
  label: string;
  mrr: number;
  portfolioValue: number;
}

export interface KpiTrend {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number;
  spark: number[];
}

export interface KpiSummary {
  balance: KpiTrend;
  mrr: KpiTrend;
  churn: KpiTrend;
  portfolioPerf: KpiTrend;
}

export interface CashflowPoint {
  timestamp: number;
  label: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface AllocationSlice {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
  pending: number;
  failed: number;
  avgTicket: number;
}

export interface TransactionsQuery {
  range: TimeRangeKey;
  search: string;
  type: TransactionType | 'all';
  status: TransactionStatus | 'all';
  sortKey: 'timestamp' | 'amount' | 'asset';
  sortDir: 'asc' | 'desc';
}

export interface AppPreferences {
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  hideSmallBalances: boolean;
  currency: 'USD' | 'EUR';
}
