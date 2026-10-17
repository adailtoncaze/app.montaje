import type { ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

export interface ItemBreadcrumb {
  rotulo: string;
  to?: string;
}

export interface ListaMigalhasProps {
  itens: ItemBreadcrumb[];
  className?: string;
}

/** Trilha de navegação (breadcrumbs) reutilizável — usada na barra superior e nas páginas. */
export function ListaMigalhas({ itens, className }: ListaMigalhasProps) {
  if (itens.length === 0) return null;
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {itens.map((item, indice) => {
          const ultimo = indice === itens.length - 1;
          return (
            <BreadcrumbItem key={`${item.rotulo}-${indice}`}>
              {item.to && !ultimo ? (
                <BreadcrumbLink to={item.to}>{item.rotulo}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.rotulo}</BreadcrumbPage>
              )}
              {!ultimo && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export interface PageHeaderProps {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página: título, descrição e ações à direita. A trilha de
 * navegação (breadcrumbs) aparece apenas na barra superior do app, para não
 * duplicar o caminho. Empilha no mobile — uma decisão por tela.
 */
export function PageHeader({ titulo, descricao, acoes, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {titulo}
          </h1>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </header>
  );
}
