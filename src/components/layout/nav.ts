import type { LucideIcon } from 'lucide-react';
import { Activity, ArrowLeftRight, LayoutDashboard, PieChart, Settings } from 'lucide-react';

import type { ViewId } from '../../lib/types';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'overview',
    label: 'Resumen',
    icon: LayoutDashboard,
    description: 'Panorama financiero, SaaS y mercado en un solo lugar',
  },
  {
    id: 'portfolio',
    label: 'Cartera',
    icon: PieChart,
    description: 'Posiciones, asignación y evolución de precios',
  },
  {
    id: 'saas',
    label: 'SaaS',
    icon: Activity,
    description: 'MRR, clientes, churn y fuentes de ingreso',
  },
  {
    id: 'transactions',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    description: 'Ingresos, gastos y operaciones de trading',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: Settings,
    description: 'Preferencias de visualización y datos',
  },
];

export function navItemFor(view: ViewId): NavItem {
  return NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0]!;
}
