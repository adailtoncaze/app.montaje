import { FluentProvider, type Theme } from '@fluentui/react-components';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { temaClaro, temaEscuro } from './temas';

/** Preferência de tema: explícita (claro/escuro) ou seguindo o sistema. */
export type Tema = 'claro' | 'escuro' | 'sistema';

/** Chave usada para persistir a preferência (também lida pelo anti-flash do index.html). */
export const CHAVE_TEMA = 'montaje.equipe.tema';

const COR_BARRA_CLARA = '#4f46e5';
const COR_BARRA_ESCURA = '#100e25';

export interface TemaContexto {
  /** Preferência escolhida pelo usuário (pode ser `sistema`). */
  tema: Tema;
  /** Tema efetivamente aplicado: `true` quando o resultado é escuro. */
  temaEscuro: boolean;
  /** Define a preferência e persiste em `localStorage`. */
  definirTema: (tema: Tema) => void;
  /** Alterna entre claro e escuro com base no tema efetivo atual. */
  alternarTema: () => void;
}

const TemaCtx = createContext<TemaContexto>({
  tema: 'sistema',
  temaEscuro: false,
  definirTema: () => {},
  alternarTema: () => {},
});

/** Acessa e altera o tema do design system do MontaJE. */
export function useTema(): TemaContexto {
  return useContext(TemaCtx);
}

function lerPreferencia(padrao: Tema): Tema {
  try {
    const bruto = localStorage.getItem(CHAVE_TEMA);
    if (bruto === 'claro' || bruto === 'escuro' || bruto === 'sistema') return bruto;
  } catch {
    /* armazenamento indisponível — segue o padrão */
  }
  return padrao;
}

function sistemaEscuro(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Atualiza `<meta name="theme-color">` e o atributo de tema do `<html>`. */
function aplicarAoSistema(escuro: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
  document.documentElement.style.colorScheme = escuro ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', escuro ? COR_BARRA_ESCURA : COR_BARRA_CLARA);
}

export interface ProvedorMontajeProps {
  /** Preferência inicial quando ainda não há nada salvo (padrão: `sistema`). */
  temaInicial?: Tema;
  children: ReactNode;
}

/**
 * Provedor do design system MontaJE (Fluent 2) com identidade índigo, tipografia
 * Inter e suporte real a claro/escuro/sistema.
 *
 * A preferência é persistida em `localStorage['montaje.equipe.tema']` e o modo
 * `sistema` acompanha `prefers-color-scheme` em tempo real.
 */
export function ProvedorMontaje({ temaInicial = 'sistema', children }: ProvedorMontajeProps) {
  const [tema, setTema] = useState<Tema>(() => lerPreferencia(temaInicial));
  const [escuroDoSistema, setEscuroDoSistema] = useState<boolean>(() => sistemaEscuro());

  // Acompanha o SO quando a preferência é "sistema".
  useEffect(() => {
    if (tema !== 'sistema' || typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const ouvir = (evento: MediaQueryListEvent) => setEscuroDoSistema(evento.matches);
    setEscuroDoSistema(media.matches);
    media.addEventListener('change', ouvir);
    return () => media.removeEventListener('change', ouvir);
  }, [tema]);

  const temaEscuroAtivo = tema === 'escuro' || (tema === 'sistema' && escuroDoSistema);

  // Mantém o documento (meta theme-color, color-scheme e atributo do <html>)
  // coerente com o tema aplicado — inclusive após o primeiro paint.
  useEffect(() => {
    aplicarAoSistema(temaEscuroAtivo);
  }, [temaEscuroAtivo]);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      /* armazenamento indisponível — aplica só nesta sessão */
    }
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const efetivoEscuro =
        atual === 'escuro' || (atual === 'sistema' && sistemaEscuro());
      const proximo: Tema = efetivoEscuro ? 'claro' : 'escuro';
      try {
        localStorage.setItem(CHAVE_TEMA, proximo);
      } catch {
        /* armazenamento indisponível */
      }
      return proximo;
    });
  }, []);

  const valor = useMemo<TemaContexto>(
    () => ({ tema, temaEscuro: temaEscuroAtivo, definirTema, alternarTema }),
    [tema, temaEscuroAtivo, definirTema, alternarTema],
  );

  const theme: Theme = temaEscuroAtivo ? temaEscuro : temaClaro;

  return (
    <TemaCtx.Provider value={valor}>
      <FluentProvider
        theme={theme}
        style={{
          minHeight: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          colorScheme: temaEscuroAtivo ? 'dark' : 'light',
          backgroundColor: 'var(--colorNeutralBackground2)',
          color: 'var(--colorNeutralForeground1)',
          fontFamily: 'var(--fontFamilyBase)',
        }}
      >
        {children}
      </FluentProvider>
    </TemaCtx.Provider>
  );
}
