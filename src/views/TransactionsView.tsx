import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Search, Wallet, X } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { TransactionsTable } from '../components/tables/TransactionsTable';
import { useAppState, useMoney } from '../hooks/useAppState';
import { queryTransactions } from '../lib/selectors';
import type { TransactionStatus, TransactionType, TransactionsQuery } from '../lib/types';
import { cn, plainNumber } from '../lib/utils';

const ROWS_PER_PAGE = 10;

type SortKey = TransactionsQuery['sortKey'];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'trade', label: 'Trades' },
] as const;

const STATUS_OPTIONS: { value: TransactionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'completed', label: 'Completadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'failed', label: 'Fallidas' },
];

function Tile({
  label,
  value,
  sub,
  tone = 'text-zinc-900 dark:text-zinc-50',
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-card dark:border-zinc-800/80 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      </div>
      <p className={cn('mt-1.5 text-xl font-semibold tracking-tight tabular-nums', tone)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</p>
    </div>
  );
}

export function TransactionsView() {
  const { dataset, window, prefs } = useAppState();
  const money = useMoney();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'timestamp',
    dir: 'desc',
  });
  const [page, setPage] = useState(0);

  const query = useMemo<TransactionsQuery>(
    () => ({
      range: window.key,
      search,
      type,
      status,
      sortKey: sort.key,
      sortDir: sort.dir,
    }),
    [window.key, search, type, status, sort],
  );

  const result = useMemo(() => queryTransactions(dataset, window, query), [dataset, window, query]);

  const pageCount = Math.max(1, Math.ceil(result.rows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * ROWS_PER_PAGE;
  const visibleRows = result.rows.slice(start, start + ROWS_PER_PAGE);

  const handleSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      dir: current.key === key && current.dir === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Ingresos"
          value={money.format(result.summary.income)}
          sub={`${plainNumber(result.summary.count)} movimientos filtrados`}
          tone="text-emerald-600 dark:text-emerald-400"
          icon={<ArrowDownLeft className="size-4" />}
        />
        <Tile
          label="Gastos"
          value={money.format(result.summary.expense)}
          sub={`Ticket medio ${money.format(result.summary.avgTicket, true)}`}
          tone="text-rose-600 dark:text-rose-400"
          icon={<ArrowUpRight className="size-4" />}
        />
        <Tile
          label="Flujo neto"
          value={money.format(result.summary.net)}
          sub="Ingresos menos gastos"
          icon={<Wallet className="size-4" />}
        />
        <Tile
          label="Pendientes / Fallidas"
          value={`${plainNumber(result.summary.pending)} / ${plainNumber(result.summary.failed)}`}
          sub="Operaciones no conciliadas"
          tone="text-amber-600 dark:text-amber-400"
          icon={<Clock className="size-4" />}
        />
      </section>

      <Card bodyClassName="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Buscar por concepto, activo, fuente o categoría…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pr-8 pl-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="Buscar movimientos"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <SegmentedControl
          ariaLabel="Filtrar por tipo"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(value) => {
            setType(value);
            setPage(0);
          }}
          size="sm"
        />

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TransactionStatus | 'all');
            setPage(0);
          }}
          className="h-8 shrink-0 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Card>

      <Card
        title="Movimientos"
        description={`${plainNumber(result.total)} resultados · ${window.label.toLowerCase()}`}
        flush
      >
        {visibleRows.length > 0 ? (
          <TransactionsTable
            rows={visibleRows}
            sort={sort}
            onSortChange={handleSort}
            page={safePage}
            pageCount={pageCount}
            total={result.total}
            onPageChange={setPage}
            dense={prefs.density === 'compact'}
          />
        ) : (
          <EmptyState
            className="m-5"
            title="Sin movimientos para estos filtros"
            description="Prueba a ampliar el rango, cambiar el estado o limpiar la búsqueda."
          />
        )}
      </Card>
    </div>
  );
}
