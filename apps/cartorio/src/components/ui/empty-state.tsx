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
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center',
        className,
      )}
    >
      {icone && <div className="text-muted-foreground [&_svg]:size-8">{icone}</div>}
      <p className="text-base font-semibold text-foreground">{titulo}</p>
      {descricao && <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
