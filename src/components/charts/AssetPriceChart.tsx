import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMoney } from '../../hooks/useAppState';
import type { AssetSeries } from '../../lib/selectors';
import { ChartSurface, ChartTooltip } from './ChartPrimitives';

interface AssetPriceChartProps {
  series: AssetSeries;
  height?: number;
}

export function AssetPriceChart({ series, height = 300 }: AssetPriceChartProps) {
  const money = useMoney();
  const gradientId = `asset-${series.symbol.toLowerCase()}`;

  return (
    <ChartSurface height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series.points} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(113,113,122,0.16)" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            minTickGap={40}
            interval="preserveStartEnd"
            dy={6}
            tickFormatter={(value: number) =>
              new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={62}
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => money.compact(value)}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: 'rgba(113,113,122,0.35)', strokeDasharray: '3 3' }}
            content={
              <ChartTooltip
                valueFormat={(value) => money.format(value, true)}
                title={series.symbol}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="price"
            name={series.symbol}
            stroke="#0ea5e9"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartSurface>
  );
}
