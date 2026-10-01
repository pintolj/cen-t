import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type CurrencyCode = 'USD' | 'EUR';

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Tipo de cambio fijo de referencia (base USD). */
export const FX: Readonly<Record<CurrencyCode, number>> = { USD: 1, EUR: 0.92 };

function getCurrencyFormatter(currency: CurrencyCode, precise: boolean): Intl.NumberFormat {
  const key = `${currency}|${precise ? 'precise' : 'compact'}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: precise ? 2 : 0,
      maximumFractionDigits: precise ? 2 : 0,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter;
}

export function convertCurrency(value: number, currency: CurrencyCode): number {
  return value * FX[currency];
}

export function formatCurrency(
  value: number,
  precise = false,
  currency: CurrencyCode = 'USD',
): string {
  return getCurrencyFormatter(currency, precise).format(convertCurrency(value, currency));
}

export function formatCompactCurrency(value: number, currency: CurrencyCode = 'USD'): string {
  const converted = convertCurrency(value, currency);
  const sign = converted < 0 ? '-' : '';
  const symbol = currency === 'USD' ? '$' : '€';
  return `${sign}${symbol}${compactFormatter.format(Math.abs(converted))}`;
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function plainNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(timestamp: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  return `hace ${Math.round(months / 12)} a`;
}
