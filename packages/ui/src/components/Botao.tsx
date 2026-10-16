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
  icon?: ReactElement;
  children?: ReactNode;
  'aria-label'?: string;
}

const useClasses = makeStyles({
  base: {
    minHeight: '48px',
    borderRadius: tokens.borderRadiusLarge,
    fontWeight: tokens.fontWeightSemibold,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  perigo: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
    },
    ':hover:active': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
});

const APARENCIA: Record<VarianteBotao, Aparencia> = {
  primario: 'primary',
  secundario: 'secondary',
  sutil: 'subtle',
  perigo: 'primary',
};

/** Botão do design system (Fluent 2 / Teams) com estados de carregamento. */
export function Botao({
  variante = 'primario',
  carregando = false,
  disabled,
  type = 'button',
  onClick,
  title,
  className,
  icon,
  children,
  'aria-label': ariaLabel,
}: BotaoProps) {
  const c = useClasses();
  return (
    <Button
      type={type}
      appearance={APARENCIA[variante]}
      className={mergeClasses(c.base, variante === 'perigo' && c.perigo, className)}
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
