import type { ReactNode } from 'react';
import type { Tom } from '@/lib/status-ui';
import { cn } from '@/lib/utils';

const TONS: Record<Tom, string> = {
  brand: 'bg-primary-subtle text-primary-subtle-foreground',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-muted text-muted-foreground',
};

export interface MedalhaoProps {
  tom?: Tom;
  className?: string;
  children: ReactNode;
}

/** Círculo de destaque à esquerda de um cartão (número, ícone ou sigla). */
export function Medalhao({ tom = 'neutral', className, children }: MedalhaoProps) {
  return (
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold leading-none',
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}
