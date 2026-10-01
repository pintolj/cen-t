import type { ReactNode } from 'react';

export interface ChartTooltipRow {
  dataKey?: string | number;
  name?: string;
  value?: number | string | readonly (number | string)[];
  color?: string;
  fill?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<ChartTooltipRow>;
  title?: string;
  valueFormat?: (value: number, dataKey: string) => string;
}

function renderValue(
  value: ChartTooltipRow['value'],
  dataKey: string,
  valueFormat?: (value: number, dataKey: string) => string,
): string {
  if (typeof value === 'number') return valueFormat ? valueFormat(value, dataKey) : String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'number' ? (valueFormat?.(item, dataKey) ?? String(item)) : item))
      .join(' · ');
  }
  return String(value ?? '');
}

export function ChartTooltip({ active, label, payload, title, valueFormat }: ChartTooltipProps) {
  const rows = (payload ?? []).filter((row) => row.value !== undefined && row.value !== null);
  if (!active || rows.length === 0) return null;

  const heading = title ?? label;

  return (
    <div className="min-w-[10rem] rounded-xl border border-zinc-700/60 bg-zinc-950/92 px-3 py-2 shadow-xl backdrop-blur-sm">
      {heading !== undefined && heading !== '' ? (
        <p className="mb-1.5 text-[11px] font-medium text-zinc-400">{heading}</p>
      ) : null}
      <ul className="space-y-1">
        {rows.map((row, index) => {
          const key = String(row.dataKey ?? index);
          const color = row.color ?? row.fill ?? '#a1a1aa';
          return (
            <li key={key} className="flex items-center justify-between gap-5 text-xs">
              <span className="flex items-center gap-2 text-zinc-300">
                <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="truncate">{row.name ?? key}</span>
              </span>
              <span className="font-medium whitespace-nowrap tabular-nums text-zinc-50">
                {renderValue(row.value, key, valueFormat)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface ChartLegendItem {
  label: string;
  color: string;
  /** 'dashed' para líneas de referencia, 'solid' para áreas/barras. */
  shape?: 'line' | 'bar' | 'dashed';
}

export function ChartLegend({ items, className }: { items: readonly ChartLegendItem[]; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className ?? ''}`}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          {item.shape === 'bar' ? (
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} />
          ) : item.shape === 'dashed' ? (
            <span
              className="h-0 w-4 border-t-2 border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : (
            <span className="h-0.5 w-4 rounded-full" style={{ background: item.color }} />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ChartSurface({ children, height }: { children: ReactNode; height: number }) {
  return (
    <div className="w-full text-zinc-500 dark:text-zinc-400" style={{ height }}>
      {children}
    </div>
  );
}
