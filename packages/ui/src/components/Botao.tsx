import { Button, Spinner, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { MouseEventHandler, ReactElement, ReactNode } from 'react';

export type VarianteBotao = 'primario' | 'secundario' | 'sutil' | 'perigo';

type Aparencia = 'primary' | 'secondary' | 'subtle';

export interface BotaoProps {
  variante?: VarianteBotao;
  carregando?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  className?: string;
  /** Ocupa toda a largura disponível (útil em formulários mobile). */
  larguraTotal?: boolean;
  icon?: ReactElement;
  children?: ReactNode;
  'aria-label'?: string;
}

const useClasses = makeStyles({
  base: {
    minHeight: '48px',
    borderRadius: tokens.borderRadiusLarge,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.01em',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    transitionProperty: 'background-color, box-shadow, border-color, color, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: '2px',
    },
  },
  larguraTotal: {
    width: '100%',
    justifyContent: 'center',
  },
  primario: {
    boxShadow: tokens.shadow4,
    ':hover': { boxShadow: tokens.shadow8 },
    ':hover:active': { boxShadow: tokens.shadow2 },
  },
  perigo: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
      boxShadow: tokens.shadow8,
    },
    ':hover:active': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
      boxShadow: tokens.shadow2,
    },
  },
});

const APARENCIA: Record<VarianteBotao, Aparencia> = {
  primario: 'primary',
  secundario: 'secondary',
  sutil: 'subtle',
  perigo: 'primary',
};

/** Botão do design system (Fluent 2) com estados de carregamento. */
export function Botao({
  variante = 'primario',
  carregando = false,
  disabled,
  type = 'button',
  onClick,
  title,
  className,
  larguraTotal = false,
  icon,
  children,
  'aria-label': ariaLabel,
}: BotaoProps) {
  const c = useClasses();
  return (
    <Button
      type={type}
      appearance={APARENCIA[variante]}
      className={mergeClasses(
        c.base,
        variante === 'primario' && c.primario,
        variante === 'perigo' && c.perigo,
        larguraTotal && c.larguraTotal,
        className,
      )}
      disabled={disabled || carregando}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      icon={carregando ? <Spinner size="tiny" /> : icon}
    >
      {children}
    </Button>
  );
}
