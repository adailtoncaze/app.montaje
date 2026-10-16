import {
  FluentProvider,
  teamsDarkTheme,
  teamsLightTheme,
  type Theme,
} from '@fluentui/react-components';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Tema = 'claro' | 'escuro';

interface TemaContexto {
  tema: Tema;
  alternar: () => void;
}

const TemaCtx = createContext<TemaContexto>({ tema: 'claro', alternar: () => {} });

/** Acessa/alterna o tema do design system do Teams. */
export function useTema(): TemaContexto {
  return useContext(TemaCtx);
}

export interface ProvedorMontajeProps {
  temaInicial?: Tema;
  children: ReactNode;
}

/**
 * Provedor do design system (Fluent 2 / Microsoft Teams).
 * Aplica o tema oficial do Teams e disponibiliza os tokens (`tokens`) para
 * todos os componentes do app e do painel.
 */
export function ProvedorMontaje({ temaInicial = 'claro', children }: ProvedorMontajeProps) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  const valor = useMemo<TemaContexto>(
    () => ({ tema, alternar: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')) }),
    [tema],
  );

  const theme: Theme = tema === 'escuro' ? teamsDarkTheme : teamsLightTheme;

  return (
    <TemaCtx.Provider value={valor}>
      <FluentProvider
        theme={theme}
        style={{
          minHeight: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--colorNeutralBackground3)',
          color: 'var(--colorNeutralForeground1)',
          fontFamily: 'var(--fontFamilyBase)',
        }}
      >
        {children}
      </FluentProvider>
    </TemaCtx.Provider>
  );
}
