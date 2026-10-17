import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

export type TomMedalhao = 'marca' | 'neutro' | 'ok' | 'alerta' | 'erro';

export type TamanhoMedalhao = 'medio' | 'grande';

const useClasses = makeStyles({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '50%',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1',
    border: '1px solid transparent',
  },
  medio: {
    width: '44px',
    height: '44px',
  },
  grande: {
    width: '56px',
    height: '56px',
    fontSize: tokens.fontSizeBase500,
  },
  marca: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  neutro: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  // Verde sem borda: visual mais leve e elegante.
  ok: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
  },
  alerta: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  erro: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
  },
});

export interface MedalhaoProps {
  children: ReactNode;
  tom?: TomMedalhao;
  /** Tamanho do círculo: 44px (padrão) ou 56px para destaques maiores. */
  tamanho?: TamanhoMedalhao;
  className?: string;
}

/** Círculo de destaque à esquerda de um cartão (ícone ou número). */
export function Medalhao({ children, tom = 'marca', tamanho = 'medio', className }: MedalhaoProps) {
  const c = useClasses();
  return (
    <span className={mergeClasses(c.base, c[tamanho], c[tom], className)}>{children}</span>
  );
}
