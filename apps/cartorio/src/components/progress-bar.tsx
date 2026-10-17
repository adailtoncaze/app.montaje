import { Progress } from '@/components/ui/progress';

export interface ProgressoProps {
  concluidos: number;
  total: number;
  rotulo?: string;
}

/** Progresso de itens/seções (ex.: "7 de 12 itens concluídos"). */
export function Progresso({ concluidos, total, rotulo }: ProgressoProps) {
  const fracao = total > 0 ? Math.min(concluidos / total, 1) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <Progress value={fracao * 100} />
      <span className="text-xs text-muted-foreground">
        {rotulo ?? `${concluidos} de ${total} itens concluídos`}
      </span>
    </div>
  );
}
