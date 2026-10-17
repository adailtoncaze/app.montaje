import { ProgressBar, Text, makeStyles, tokens } from '@fluentui/react-components';

const useClasses = makeStyles({
  area: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  rotulo: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  detalhe: {
    color: tokens.colorNeutralForeground3,
  },
  percentual: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
  },
});

export interface BarraProgressoProps {
  concluidos: number;
  total: number;
  rotulo?: string;
  /** Exibe o percentual à direita do rótulo (padrão: true). */
  mostrarPercentual?: boolean;
}

/** Progresso de itens (ex.: "7 de 12 itens concluídos") — RF-E07. */
export function BarraProgresso({
  concluidos,
  total,
  rotulo,
  mostrarPercentual = true,
}: BarraProgressoProps) {
  const c = useClasses();
  const fracao = total > 0 ? Math.min(Math.max(concluidos / total, 0), 1) : 0;
  const percentual = Math.round(fracao * 100);
  return (
    <div className={c.area}>
      <div className={c.rotulo}>
        <Text size={200} className={c.detalhe}>
          {rotulo ?? `${concluidos} de ${total} itens concluídos`}
        </Text>
        {mostrarPercentual && (
          <Text size={200} className={c.percentual}>
            {percentual}%
          </Text>
        )}
      </div>
      <ProgressBar value={fracao} max={1} thickness="large" />
    </div>
  );
}
