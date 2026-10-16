import { Text, makeStyles, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useClasses = makeStyles({
  barra: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minHeight: '56px',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
  },
  esquerda: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  titulo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  direita: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

export interface CabecalhoAppProps {
  titulo: string;
  subtitulo?: string;
  inicio?: ReactNode;
  fim?: ReactNode;
}

/** Barra superior no estilo do Teams (fundo na cor da marca). */
export function CabecalhoApp({ titulo, subtitulo, inicio, fim }: CabecalhoAppProps) {
  const c = useClasses();
  return (
    <header className={c.barra}>
      <div className={c.esquerda}>
        {inicio}
        <div className={c.titulo}>
          <Text weight="semibold" size={400}>
            {titulo}
          </Text>
          {subtitulo && (
            <Text size={200} style={{ opacity: 0.85 }}>
              {subtitulo}
            </Text>
          )}
        </div>
      </div>
      {fim && <div className={c.direita}>{fim}</div>}
    </header>
  );
}
