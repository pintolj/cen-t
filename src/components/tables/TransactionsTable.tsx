import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';

import { Badge, type BadgeVariant } from '../ui/Badge';
import { useMoney } from '../../hooks/useAppState';
import type { Transaction, TransactionsQuery } from '../../lib/types';
import { cn, formatDateTime, formatNumber, relativeTime } from '../../lib/utils';

const STATUS_META: Record<Transaction['status'], { label: string; variant: BadgeVariant }> = {
  completed: { label: 'Completada', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  failed: { label: 'Fallida', variant: 'danger' },
};

const TYPE_META: Record<
  Transaction['type'],
  { label: string; icon: typeof ArrowDownLeft; className: string }
> = {
  income: {
    label: 'Ingreso',
    icon: ArrowDownLeft,
    className:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  expense: {
    label: 'Gasto',
    icon: ArrowUpRight,
    className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  },
  trade: {
    label: 'Trade',
    icon: ArrowLeftRight,
    className: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
};

type SortKey = TransactionsQuery['sortKey'];

interface TransactionsTableProps {
  rows: readonly Transaction[];
  sort?: { key: SortKey; dir: 'asc' | 'desc' };
  onSortChange?: (key: SortKey) => void;
  page?: number;
  pageCount?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  dense?: boolean;
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  sort?: { key: SortKey; dir: 'asc' | 'desc' } | undefined;
  onSortChange?: ((key: SortKey) => void) | undefined;
  align?: 'left' | 'right';
}) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort?.dir === 'asc' ? ChevronUp : ChevronDown) : null;

  return (
    <th
      scope="col"
      className={cn('px-5 py-3 font-medium', align === 'right' && 'text-right')}
    >
      {onSortChange ? (
        <button
          type="button"
          onClick={() => onSortChange(sortKey)}
          className={cn(
            'inline-flex items-center gap-1 uppercase tracking-wider transition hover:text-zinc-800 dark:hover:text-zinc-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
            active ? 'text-zinc-700 dark:text-zinc-200' : '',
            align === 'right' && 'flex-row-reverse',
          )}
        >
          {label}
          {Icon ? <Icon className="size-3" /> : null}
        </button>
      ) : (
        <span className="uppercase tracking-wider">{label}</span>
      )}
    </th>
  );
}

export function TransactionsTable({
  rows,
  sort,
  onSortChange,
  page = 0,
  pageCount = 1,
  total,
  onPageChange,
  dense = false,
}: TransactionsTableProps) {
  const money = useMoney();

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead className="bg-zinc-50/70 text-[11px] text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400">
            <tr className="border-b border-zinc-200/70 dark:border-zinc-800/70">
              <th scope="col" className="px-5 py-3 font-medium uppercase tracking-wider">
                Concepto
              </th>
              <th scope="col" className="px-5 py-3 font-medium uppercase tracking-wider">
                Categoría
              </th>
              <SortHeader
                label="Fecha"
                sortKey="timestamp"
                sort={sort}
                onSortChange={onSortChange}
              />
              <th scope="col" className="px-5 py-3 font-medium uppercase tracking-wider">
                Estado
              </th>
              <SortHeader
                label="Importe"
                sortKey="amount"
                sort={sort}
                onSortChange={onSortChange}
                align="right"
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => {
              const type = TYPE_META[tx.type];
              const status = STATUS_META[tx.status];
              const Icon = type.icon;
              const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '';
              const amountClass =
                tx.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : tx.type === 'expense'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-zinc-800 dark:text-zinc-100';

              return (
                <tr
                  key={tx.id}
                  className={cn(
                    'border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40',
                    dense ? 'py-1.5' : 'py-2.5',
                  )}
                >
                  <td className="px-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-lg',
                          type.className,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[15rem] truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {tx.concept}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {tx.asset} · {tx.source}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-2">
                    <Badge>{tx.category}</Badge>
                  </td>
                  <td className="px-5 py-2 text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    <span className="block">{formatDateTime(tx.timestamp)}</span>
                    <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                      {relativeTime(tx.timestamp)}
                    </span>
                  </td>
                  <td className="px-5 py-2">
                    <Badge variant={status.variant} dot>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-2 text-right whitespace-nowrap">
                    <span className={cn('block text-sm font-semibold tabular-nums', amountClass)}>
                      {sign}
                      {money.format(tx.amount, true)}
                    </span>
                    {tx.type === 'trade' && tx.quantity !== undefined ? (
                      <span className="block text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                        {formatNumber(tx.quantity, 6)} × {money.format(tx.unitPrice ?? 0, true)}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && onPageChange ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/70 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-400">
          <span>
            Página {page + 1} de {pageCount}
            {total !== undefined ? ` · ${total} movimientos` : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="grid size-7 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition enabled:hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:enabled:hover:bg-zinc-800"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount - 1}
              className="grid size-7 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition enabled:hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:enabled:hover:bg-zinc-800"
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
