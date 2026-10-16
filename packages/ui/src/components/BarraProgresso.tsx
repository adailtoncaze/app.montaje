import { ProgressBar, Text, makeStyles, tokens } from '@fluentui/react-components';

const useClasses = makeStyles({
  area: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
});

export interface BarraProgressoProps {
  concluidos: number;
  total: number;
  rotulo?: string;
}

/** Progresso de itens (ex.: "7 de 12 itens concluídos") — RF-E07. */
export function BarraProgresso({ concluidos, total, rotulo }: BarraProgressoProps) {
  const c = useClasses();
  const fracao = total > 0 ? Math.min(concluidos / total, 1) : 0;
  return (
    <div className={c.area}>
      <ProgressBar value={fracao} max={1} thickness="large" />
      <Text size={200}>
        {rotulo ?? `${concluidos} de ${total} itens concluídos`}
      </Text>
    </div>
  );
}
