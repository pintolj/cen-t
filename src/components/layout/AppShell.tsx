import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block lg:w-64">
        <Sidebar className="h-full" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <Sidebar className="h-full" onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              aria-label="Cerrar navegación"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
