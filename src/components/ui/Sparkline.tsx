import { useId, useMemo } from 'react';

import { cn } from '../../lib/utils';

interface SparklineProps {
  data: readonly number[];
  className?: string;
  strokeWidth?: number;
  showArea?: boolean;
}

function buildPaths(data: readonly number[]): { line: string; area: string } | null {
  if (data.length < 2) return null;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of data) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min || Math.abs(max) || 1;
  const stepX = 100 / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = 30 - ((value - min) / span) * 26;
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L100,32 L0,32 Z`;

  return { line, area };
}

export function Sparkline({ data, className, strokeWidth = 1.6, showArea = true }: SparklineProps) {
  const rawId = useId();
  const gradientId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const paths = useMemo(() => buildPaths(data), [data]);

  if (!paths) return null;

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('h-8 w-full overflow-visible', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea ? <path d={paths.area} fill={`url(#${gradientId})`} /> : null}
      <path
        d={paths.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
