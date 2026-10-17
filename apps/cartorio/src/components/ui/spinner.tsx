import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends ComponentProps<'div'> {
  label?: string;
}

/** Indicador de carregamento centralizado. */
export function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-10 text-muted-foreground',
        className,
      )}
      {...props}
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
