import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';
import { pontoTablet } from '../tema/breakpoints';

const useClasses = makeStyles({
  conteudo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '760px',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
    paddingTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalXXL,
    [`@media ${pontoTablet}`]: {
      gap: tokens.spacingVerticalL,
      paddingTop: tokens.spacingVerticalL,
      paddingLeft: tokens.spacingHorizontalXXL,
      paddingRight: tokens.spacingHorizontalXXL,
    },
  },
  estreita: {
    maxWidth: '520px',
  },
});

export interface ConteudoPaginaProps {
  children: ReactNode;
  /** Largura confortável: `normal` (760px) ou `estreita` (520px, formulários). */
  largura?: 'normal' | 'estreita';
  className?: string;
}

/** Wrapper de conteúdo de página com padding responsivo e largura confortável. */
export function ConteudoPagina({ children, largura = 'normal', className }: ConteudoPaginaProps) {
  const c = useClasses();
  return (
    <div
      className={mergeClasses(c.conteudo, largura === 'estreita' && c.estreita, className)}
    >
      {children}
    </div>
  );
}
