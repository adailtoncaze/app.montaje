import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Tons do cartão de estatística (nomes legados do painel + reforços). */
export type TomStat = 'neutro' | 'marca' | 'erro' | 'sucesso' | 'alerta';

const VALOR_POR_TOM: Record<TomStat, string> = {
  neutro: 'text-foreground',
  marca: 'text-primary-subtle-foreground',
  erro: 'text-danger',
  sucesso: 'text-success',
  alerta: 'text-warning',
};

const TILE_POR_TOM: Record<TomStat, string> = {
  neutro: 'bg-muted text-muted-foreground',
  marca: 'bg-primary-subtle text-primary-subtle-foreground',
  erro: 'bg-danger-bg text-danger',
  sucesso: 'bg-success-bg text-success',
  alerta: 'bg-warning-bg text-warning',
};

export interface StatCardProps extends ComponentProps<'div'> {
  valor: ReactNode;
  rotulo: string;
  tom?: TomStat;
  icone?: ComponentType<{ className?: string }>;
  descricao?: ReactNode;
  carregando?: boolean;
}

/**
 * Cartão de contador usado nos resumos (Início, Locais, Local).
 * O estado `carregando` troca o valor por um esqueleto.
 */
export function StatCard({
  valor,
  rotulo,
  tom = 'neutro',
  icone: Icone,
  descricao,
  carregando = false,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn('gap-2 p-5', className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{rotulo}</span>
        {Icone && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              TILE_POR_TOM[tom],
            )}
          >
            <Icone className="size-4" />
          </span>
        )}
      </div>

      {carregando ? (
        <Skeleton className="h-8 w-20 rounded-lg" />
      ) : (
        <span
          className={cn(
            'text-3xl font-semibold leading-none tracking-tight tabular-nums',
            VALOR_POR_TOM[tom],
          )}
        >
          {valor}
        </span>
      )}

      {descricao &&
        (carregando ? (
          <Skeleton className="h-4 w-28 rounded-md" />
        ) : (
          <span className="text-xs text-muted-foreground">{descricao}</span>
        ))}
    </Card>
  );
}
