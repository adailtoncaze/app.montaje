import {
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  type BadgeProps,
} from '@fluentui/react-components';
import type { ReactElement } from 'react';

export type TomSelo = 'ok' | 'alerta' | 'erro' | 'neutro' | 'marca';

const COR: Record<TomSelo, NonNullable<BadgeProps['color']>> = {
  ok: 'success',
  alerta: 'warning',
  erro: 'danger',
  neutro: 'informative',
  marca: 'brand',
};

const BORDA: Record<TomSelo, string> = {
  // Verde sem borda: visual mais leve e elegante.
  ok: 'transparent',
  alerta: tokens.colorPaletteYellowBorder2,
  erro: tokens.colorPaletteRedBorder2,
  neutro: tokens.colorNeutralStroke2,
  marca: tokens.colorBrandStroke2,
};

const useClasses = makeStyles({
  base: {
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.01em',
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusMedium,
  },
});

export interface SeloProps {
  texto: string;
  tom?: TomSelo;
  /** Ícone opcional à esquerda do texto. */
  icone?: ReactElement;
  className?: string;
}

/** Etiqueta de status com fundo suave e borda por token de estado. */
export function Selo({ texto, tom = 'neutro', icone, className }: SeloProps) {
  const c = useClasses();
  return (
    <Badge
      appearance="tint"
      color={COR[tom]}
      size="medium"
      icon={icone}
      className={mergeClasses(c.base, className)}
      style={{ border: `1px solid ${BORDA[tom]}` }}
    >
      {texto}
    </Badge>
  );
}
