import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icone?: ReactNode;
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  className?: string;
}

/** Estado vazio padronizado (lista sem dados, filtro sem resultado, etc.). */
export function EmptyState({ icone, titulo, descricao, acao, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center',
        className,
      )}
    >
      {icone && (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">
          {icone}
        </span>
      )}
      <p className="text-base font-semibold tracking-tight text-foreground">{titulo}</p>
      {descricao && <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-1">{acao}</div>}
    </div>
  );
}
