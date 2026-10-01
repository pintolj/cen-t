import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useMoney } from '../../hooks/useAppState';
import type { AllocationSlice } from '../../lib/types';
import { ChartSurface, ChartTooltip } from './ChartPrimitives';

interface AllocationDonutProps {
  slices: readonly AllocationSlice[];
  centerValue: string;
  centerLabel: string;
  height?: number;
}

export function AllocationDonut({ slices, centerValue, centerLabel, height = 240 }: AllocationDonutProps) {
  const money = useMoney();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto w-full max-w-[13rem] shrink-0" style={{ height }}>
        <ChartSurface height={height}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                isAnimationActive={false}
                content={<ChartTooltip valueFormat={(value) => money.format(value)} />}
              />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="70%"
                outerRadius="100%"
                paddingAngle={2}
                cornerRadius={4}
                stroke="none"
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.id} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartSurface>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {centerValue}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.id}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {slice.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 pl-4.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>{money.format(slice.value, true)}</span>
              <div className="mr-0 h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${slice.percentage}%`, background: slice.color }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
