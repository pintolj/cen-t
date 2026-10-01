import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center',
        'dark:border-zinc-700/70',
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
