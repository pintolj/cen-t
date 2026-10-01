import type { ReactNode } from 'react';

import { AppShell } from './components/layout/AppShell';
import { AppStateProvider, useAppState } from './hooks/useAppState';
import { OverviewView } from './views/OverviewView';
import { PortfolioView } from './views/PortfolioView';
import { SaasView } from './views/SaasView';
import { SettingsView } from './views/SettingsView';
import { TransactionsView } from './views/TransactionsView';

function RoutedView() {
  const { view } = useAppState();

  let content: ReactNode;
  switch (view) {
    case 'portfolio':
      content = <PortfolioView />;
      break;
    case 'saas':
      content = <SaasView />;
      break;
    case 'transactions':
      content = <TransactionsView />;
      break;
    case 'settings':
      content = <SettingsView />;
      break;
    default:
      content = <OverviewView />;
  }

  return <div key={view} className="animate-fade-in">{content}</div>;
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell>
        <RoutedView />
      </AppShell>
    </AppStateProvider>
  );
}
