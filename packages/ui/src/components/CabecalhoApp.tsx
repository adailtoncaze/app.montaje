import {
  Button,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import { IndicadorConexao } from './IndicadorConexao';

const useClasses = makeStyles({
  barra: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minHeight: '56px',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: `calc(${tokens.spacingVerticalS} + env(safe-area-inset-top, 0px))`,
    paddingBottom: tokens.spacingVerticalS,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
  },
  voltar: {
    minWidth: '44px',
    minHeight: '44px',
    marginLeft: '-4px',
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },
    ':hover:active': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
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
    flexShrink: 0,
  },
});

export interface CabecalhoAppProps {
  titulo: string;
  subtitulo?: string;
  /** Conteúdo à esquerda do título (ex.: um botão de menu). */
  inicio?: ReactNode;
  /** Conteúdo à direita (ex.: um botão de ação). */
  fim?: ReactNode;
  /** Quando informado, exibe o botão voltar com área de toque confortável. */
  aoVoltar?: () => void;
  /** Mostra o indicador de conexão (online/sem conexão) à direita. Padrão: true. */
  conexao?: boolean;
  className?: string;
}

/** App bar no estilo da marca (índigo), com área de toque e safe-area. */
export function CabecalhoApp({
  titulo,
  subtitulo,
  inicio,
  fim,
  aoVoltar,
  conexao = true,
  className,
}: CabecalhoAppProps) {
  const c = useClasses();
  return (
    <header className={mergeClasses(c.barra, className)}>
      <div className={c.esquerda}>
        {aoVoltar && (
          <Button
            appearance="subtle"
            className={c.voltar}
            icon={<ArrowLeft24Regular />}
            onClick={aoVoltar}
            aria-label="Voltar"
          />
        )}
        {inicio}
        <div className={c.titulo}>
          <Text weight="semibold" size={500}>
            {titulo}
          </Text>
          {subtitulo && (
            <Text size={200} style={{ opacity: 0.85 }}>
              {subtitulo}
            </Text>
          )}
        </div>
      </div>
      {(conexao || fim) && (
        <div className={c.direita}>
          {conexao && <IndicadorConexao />}
          {fim}
        </div>
      )}
    </header>
  );
}
