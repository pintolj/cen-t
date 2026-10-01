import { useId } from 'react';

interface CenitMarkProps {
  className?: string;
  title?: string;
}

/** Marca de Cénit: un gráfico ascendente que alcanza el punto cénit. */
export function CenitMark({ className, title = 'Cénit' }: CenitMarkProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const bgId = `cenit-bg-${id}`;
  const peakId = `cenit-peak-${id}`;

  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#111827" />
          <stop offset="1" stopColor="#1f2937" />
        </linearGradient>
        <linearGradient id={peakId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${bgId})`} />
      <path
        d="M7 23.5 L13.5 14 L18 18.5 L24.5 9.5"
        fill="none"
        stroke={`url(#${peakId})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="9.5" r="3.4" fill="#fbbf24" />
    </svg>
  );
}
