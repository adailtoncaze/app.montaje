import {
  Card,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { ChevronRight24Regular } from '@fluentui/react-icons';
import type { ReactNode } from 'react';

const useClasses = makeStyles({
  cartao: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    transitionProperty: 'box-shadow, background-color, transform',
    transitionDuration: '120ms',
  },
  clicavel: {
    cursor: 'pointer',
    ':hover': { boxShadow: tokens.shadow8 },
    ':hover:active': { backgroundColor: tokens.colorSubtleBackgroundHover },
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: '2px',
    },
  },
  topo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
  },
  texto: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flexGrow: 1,
    rowGap: '2px',
  },
  titulo: {
    overflowWrap: 'anywhere',
  },
  descricao: {
    color: tokens.colorNeutralForeground3,
    overflowWrap: 'anywhere',
  },
  acao: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  seta: {
    color: tokens.colorNeutralForeground4,
    flexShrink: 0,
  },
});

export interface CartaoProps {
  /** Visual de destaque à esquerda (ex.: um <Medalhao>). */
  inicio?: ReactNode;
  titulo?: ReactNode;
  descricao?: ReactNode;
  /** Conteúdo à direita do cabeçalho (ex.: um <Selo>). */
  acao?: ReactNode;
  /** Mostra a seta de navegação (padrão: quando `clicavel`). */
  mostrarSeta?: boolean;
  children?: ReactNode;
  className?: string;
  clicavel?: boolean;
  onClick?: () => void;
}

/** Cartão de conteúdo no estilo do Teams (superfície branca, cantos arredondados). */
export function Cartao({
  inicio,
  titulo,
  descricao,
  acao,
  mostrarSeta,
  children,
  className,
  clicavel = false,
  onClick,
}: CartaoProps) {
  const c = useClasses();
  const temCabecalho = Boolean(inicio || titulo || descricao || acao);
  const exibirSeta = mostrarSeta ?? clicavel;

  return (
    <Card
      className={mergeClasses(c.cartao, clicavel && c.clicavel, className)}
      onClick={onClick}
      focusMode={clicavel ? 'tab-exit' : undefined}
    >
      {temCabecalho && (
        <div className={c.topo}>
          {inicio}
          <div className={c.texto}>
            {titulo && (
              <Text weight="semibold" size={400} className={c.titulo}>
                {titulo}
              </Text>
            )}
            {descricao && (
              <Text size={200} className={c.descricao}>
                {descricao}
              </Text>
            )}
          </div>
          {(acao || exibirSeta) && (
            <div className={c.acao}>
              {acao}
              {exibirSeta && <ChevronRight24Regular className={c.seta} />}
            </div>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
