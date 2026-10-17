import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface ProgressoProps {
  concluidos: number;
  total: number;
  rotulo?: string;
  tamanho?: 'sm' | 'md';
  className?: string;
}

/** Progresso de itens/seções (ex.: "7 de 12 itens concluídos"). */
export function Progresso({ concluidos, total, rotulo, tamanho = 'md', className }: ProgressoProps) {
  const fracao = total > 0 ? Math.min(concluidos / total, 1) : 0;
  const porcentagem = Math.round(fracao * 100);
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Progress value={fracao * 100} className={tamanho === 'sm' ? 'h-1.5' : 'h-2'} />
      <span className="text-xs tabular-nums text-muted-foreground">
        {rotulo ?? `${concluidos} de ${total} itens concluídos`}
        {!rotulo && ` (${porcentagem}%)`}
      </span>
    </div>
  );
}
