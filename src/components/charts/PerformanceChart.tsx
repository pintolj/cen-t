import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMoney } from '../../hooks/useAppState';
import type { PerformancePoint } from '../../lib/types';
import { ChartSurface, ChartTooltip } from './ChartPrimitives';

const MRR_COLOR = '#8b5cf6';
const PORTFOLIO_COLOR = '#0ea5e9';

export function PerformanceChart({ data }: { data: readonly PerformancePoint[] }) {
  const money = useMoney();

  return (
    <ChartSurface height={280}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="perf-mrr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MRR_COLOR} stopOpacity={0.32} />
              <stop offset="100%" stopColor={MRR_COLOR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="perf-portfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.32} />
              <stop offset="100%" stopColor={PORTFOLIO_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(113,113,122,0.16)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            minTickGap={30}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) => money.compact(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fontSize: 11 }}
            tickFormatter={(value: number) => money.compact(value)}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: 'rgba(113,113,122,0.35)', strokeDasharray: '3 3' }}
            content={
              <ChartTooltip
                valueFormat={(value) => money.format(value)}
              />
            }
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="portfolioValue"
            name="Cartera"
            stroke={PORTFOLIO_COLOR}
            strokeWidth={2}
            fill="url(#perf-portfolio)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke={MRR_COLOR}
            strokeWidth={2}
            fill="url(#perf-mrr)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartSurface>
  );
}
