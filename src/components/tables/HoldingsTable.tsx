import { useMoney } from '../../hooks/useAppState';
import type { Holding } from '../../lib/types';
import { cn, formatNumber } from '../../lib/utils';
import { Delta } from '../ui/Delta';

const CLASS_LABEL: Record<Holding['klass'], string> = {
  crypto: 'Cripto',
  equity: 'Renta variable',
  fiat: 'Fiat',
};

function ChangeCell({ value }: { value: number }) {
  return (
    <span className="inline-flex justify-end">
      <Delta value={value} format="percent" showIcon={false} />
    </span>
  );
}

export function HoldingsTable({ holdings, dense = false }: { holdings: readonly Holding[]; dense?: boolean }) {
  const money = useMoney();

  return (
    <div className="overflow-x-auto scrollbar-slim">
      <table className="w-full min-w-[46rem] border-collapse text-left">
        <thead className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <tr className="border-b border-zinc-200/70 dark:border-zinc-800/70">
            <th scope="col" className="px-5 py-3 font-medium uppercase tracking-wider">
              Activo
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-wider">
              Precio
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-wider">
              Cantidad
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-wider">
              Valor
            </th>
            <th scope="col" className="px-5 py-3 font-medium uppercase tracking-wider">
              Asignación
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-wider">
              24 h
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-wider">
              En rango
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr
              key={holding.symbol}
              className={cn(
                'border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40',
                dense ? 'py-1.5' : 'py-2.5',
              )}
            >
              <td className="px-5">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
                    style={{ background: holding.color }}
                  >
                    {holding.symbol.slice(0, 3)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {holding.symbol}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {holding.name} · {CLASS_LABEL[holding.klass]}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-2 text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-200">
                {money.format(holding.price, holding.price < 10)}
              </td>
              <td className="px-5 py-2 text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {formatNumber(holding.quantity, holding.klass === 'fiat' ? 0 : 4)}
              </td>
              <td className="px-5 py-2 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {money.format(holding.value)}
              </td>
              <td className="px-5 py-2">
                <div className="flex min-w-[7rem] items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${holding.allocation}%`, background: holding.color }}
                    />
                  </div>
                  <span className="w-11 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {holding.allocation.toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-2 text-right text-sm">
                <ChangeCell value={holding.change24h} />
              </td>
              <td className="px-5 py-2 text-right text-sm">
                <ChangeCell value={holding.changeRange} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
