import type { ComponentProps, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps extends ComponentProps<'div'> {
  valor: ReactNode;
  rotulo: string;
  tom?: 'neutro' | 'marca' | 'erro';
}

/** Cartão de contador usado nos resumos (Início, Locais, Local). */
export function StatCard({ valor, rotulo, tom = 'neutro', className, ...props }: StatCardProps) {
  return (
    <Card className={cn('gap-1 p-4', className)} {...props}>
      <span
        className={cn(
          'text-2xl font-bold leading-8',
          tom === 'marca' && 'text-primary',
          tom === 'erro' && 'text-danger',
        )}
      >
        {valor}
      </span>
      <span className="text-xs text-muted-foreground">{rotulo}</span>
    </Card>
  );
}
