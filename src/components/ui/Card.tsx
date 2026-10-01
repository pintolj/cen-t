import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Sin padding interno: útil cuando el cuerpo es una tabla o un gráfico a sangre. */
  flush?: boolean;
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: CardProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined;

  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card',
        'dark:border-zinc-800/80 dark:bg-zinc-900/70',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800/70">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={cn('flex min-w-0 flex-1 flex-col', !flush && 'p-5', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
