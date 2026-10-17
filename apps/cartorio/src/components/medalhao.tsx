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

const TAMANHOS = {
  sm: 'size-8 text-xs [&_svg]:size-4',
  md: 'size-11 text-base [&_svg]:size-5',
  lg: 'size-14 text-lg [&_svg]:size-6',
} as const;

export interface MedalhaoProps {
  tom?: Tom;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
  children: ReactNode;
}

/** Círculo de destaque à esquerda de um cartão (número, ícone ou sigla). */
export function Medalhao({ tom = 'neutral', tamanho = 'md', className, children }: MedalhaoProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold leading-none',
        TONS[tom],
        TAMANHOS[tamanho],
        className,
      )}
    >
      {children}
    </span>
  );
}
