import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

export type TomMedalhao = 'marca' | 'neutro' | 'ok' | 'alerta' | 'erro';

const useClasses = makeStyles({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1',
  },
  marca: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  neutro: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  ok: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
  },
  alerta: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground1,
  },
  erro: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
  },
});

export interface MedalhaoProps {
  children: ReactNode;
  tom?: TomMedalhao;
  className?: string;
}

/** Círculo de destaque à esquerda de um cartão (ícone ou número). */
export function Medalhao({ children, tom = 'marca', className }: MedalhaoProps) {
  const c = useClasses();
  return <span className={mergeClasses(c.base, c[tom], className)}>{children}</span>;
}
