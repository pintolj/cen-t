import type { ReactNode } from 'react';

import { renderToString } from 'react-dom/server';

import { AppShell } from '../src/components/layout/AppShell';
import { AppStateProvider } from '../src/hooks/useAppState';
import App from '../src/App';
import { OverviewView } from '../src/views/OverviewView';
import { PortfolioView } from '../src/views/PortfolioView';
import { SaasView } from '../src/views/SaasView';
import { SettingsView } from '../src/views/SettingsView';
import { TransactionsView } from '../src/views/TransactionsView';

const wrap = (node: ReactNode) => (
  <AppStateProvider>
    <AppShell>{node}</AppShell>
  </AppStateProvider>
);

const cases: { name: string; node: ReactNode }[] = [
  { name: 'App (overview por defecto)', node: <App /> },
  { name: 'Overview', node: wrap(<OverviewView />) },
  { name: 'Portfolio', node: wrap(<PortfolioView />) },
  { name: 'Saas', node: wrap(<SaasView />) },
  { name: 'Transactions', node: wrap(<TransactionsView />) },
  { name: 'Settings', node: wrap(<SettingsView />) },
];

let failed = false;

const BROKEN = [/NaN/, /Infinity/, />undefined</, />\s*null\s*</];

const MARKERS: Record<string, string[]> = {
  'App (overview por defecto)': ['Cénit', 'Balance disponible', 'Flujo de caja', 'Rendimiento comparado', 'Últimos movimientos'],
  Overview: ['MRR', 'Asignación', 'Fuentes de ingreso', 'Resumen del rango'],
  Portfolio: ['Valor de cartera', 'Posiciones', 'Asignación por clase'],
  Saas: ['Altas y bajas', 'Tasa de churn', 'ARPU'],
  Transactions: ['Ingresos', 'Flujo neto', 'Buscar por concepto'],
  Settings: ['Apariencia', 'Semilla activa', 'Privacidad'],
};


for (const testCase of cases) {
  const started = Date.now();
  try {
    const html = renderToString(testCase.node);
    const ms = Date.now() - started;
    if (html.length < 2000) {
      console.error(`FAIL  ${testCase.name}: salida sospechosa (${html.length} bytes)`);
      failed = true;
      continue;
    }
    const broken = BROKEN.find((pattern) => pattern.test(html));
    if (broken) {
      const match = broken.exec(html);
      const index = match?.index ?? 0;
      console.error(
        `FAIL  ${testCase.name}: contiene "${broken.source}" → …${html.slice(Math.max(0, index - 120), index + 80)}…`,
      );
      failed = true;
      continue;
    }
    const missing = (MARKERS[testCase.name] ?? []).filter((marker) => !html.includes(marker));
    if (missing.length > 0) {
      console.error(`FAIL  ${testCase.name}: no renderiza ${missing.join(', ')}`);
      failed = true;
      continue;
    }
    console.log(`OK    ${testCase.name}: ${html.length} bytes · ${ms}ms`);
  } catch (error) {
    console.error(`FAIL  ${testCase.name}:`, error);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
