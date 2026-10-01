import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartSurface, ChartTooltip } from './ChartPrimitives';

export interface TrendSeriesConfig {
  key: string;
  label: string;
  color: string;
  kind?: 'area' | 'line' | 'bar';
  format?: (value: number) => string;
}

interface TrendChartProps<T> {
  data: readonly T[];
  xKey: string;
  series: readonly TrendSeriesConfig[];
  height?: number;
  yFormat?: (value: number) => string;
  xFormat?: (value: string | number) => string;
  yWidth?: number;
  yDomain?: readonly [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax'];
  reference?: { value: number; label: string; color?: string };
}

export function TrendChart<T>({
  data,
  xKey,
  series,
  height = 260,
  yFormat,
  xFormat,
  yWidth = 56,
  yDomain,
  reference,
}: TrendChartProps<T>) {
  const valueFormat = (value: number, dataKey: string): string => {
    const match = series.find((item) => item.key === dataKey);
    if (match?.format) return match.format(value);
    return yFormat ? yFormat(value) : String(value);
  };

  return (
    <ChartSurface height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="rgba(113,113,122,0.16)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            minTickGap={30}
            interval="preserveStartEnd"
            {...(xFormat ? { tickFormatter: xFormat } : {})}
            dy={6}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={yWidth}
            tick={{ fontSize: 11 }}
            {...(yFormat ? { tickFormatter: yFormat } : {})}
            domain={yDomain ?? ['auto', 'auto']}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: 'rgba(113,113,122,0.35)', strokeDasharray: '3 3' }}
            content={<ChartTooltip valueFormat={valueFormat} />}
          />
          {reference ? (
            <ReferenceLine
              yAxisId="left"
              y={reference.value}
              stroke={reference.color ?? '#f59e0b'}
              strokeDasharray="4 4"
              label={{
                value: reference.label,
                position: 'insideTopRight',
                fontSize: 10,
                fill: reference.color ?? '#f59e0b',
              }}
            />
          ) : null}
          {series.map((item) => {
            if (item.kind === 'bar') {
              return (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  fillOpacity={0.85}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                  isAnimationActive={false}
                />
              );
            }
            if (item.kind === 'area') {
              return (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2}
                  fill={item.color}
                  fillOpacity={0.14}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              );
            }
            return (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartSurface>
  );
}
