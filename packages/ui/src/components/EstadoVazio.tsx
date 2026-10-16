import { Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useClasses = makeStyles({
  area: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
  },
  icone: {
    fontSize: '32px',
    lineHeight: '32px',
  },
});

export interface EstadoVazioProps {
  icone?: ReactNode;
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
}

/** Estado vazio padronizado (lista sem dados, download pendente, etc.). */
export function EstadoVazio({ icone, titulo, descricao, acao }: EstadoVazioProps) {
  const c = useClasses();
  return (
    <div className={c.area}>
      {icone && <div className={c.icone}>{icone}</div>}
      <Text weight="semibold" size={400}>
        {titulo}
      </Text>
      {descricao && <Text size={300}>{descricao}</Text>}
      {acao}
    </div>
  );
}
