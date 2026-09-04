import { cn } from '@/lib/utils';

export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none tabular-nums',
        'bg-red-500/15 text-red-600 dark:text-red-400',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
