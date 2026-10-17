import { Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useClasses = makeStyles({
  area: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    border: `1px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
  },
  circulo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    fontSize: '32px',
    lineHeight: '32px',
  },
  textos: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxWidth: '42ch',
  },
  acao: {
    marginTop: tokens.spacingVerticalXS,
  },
});

export interface EstadoVazioProps {
  icone?: ReactNode;
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
  className?: string;
}

/** Estado vazio padronizado (lista sem dados, download pendente, etc.). */
export function EstadoVazio({ icone, titulo, descricao, acao, className }: EstadoVazioProps) {
  const c = useClasses();
  return (
    <div className={[c.area, className].filter(Boolean).join(' ')}>
      {icone && <div className={c.circulo}>{icone}</div>}
      <div className={c.textos}>
        <Text weight="semibold" size={400}>
          {titulo}
        </Text>
        {descricao && (
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {descricao}
          </Text>
        )}
      </div>
      {acao && <div className={c.acao}>{acao}</div>}
    </div>
  );
}
