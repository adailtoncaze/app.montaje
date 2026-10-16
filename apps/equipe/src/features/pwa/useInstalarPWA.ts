import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/** Evento `beforeinstallprompt` (Chromium) — ainda não tipado no lib.dom. */
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type ResultadoInstalacao = 'aceito' | 'recusado' | 'indisponivel';

/** Plataforma detectada, para orientar o usuário quando não há prompt nativo. */
export type PlataformaInstalacao = 'android' | 'ios' | 'desktop' | 'outro';

export interface InstalacaoPWA {
  /** O app já está aberto no modo instalado (standalone). */
  instalado: boolean;
  /** O navegador ofereceu o prompt nativo (Chrome/Edge desktop e Android). */
  podeInstalar: boolean;
  /** iOS/iPadOS: instalação só pelo menu Compartilhar (sem prompt). */
  precisaCompartilhar: boolean;
  /** No iOS o texto muda (iPhone/iPad). */
  plataforma: PlataformaInstalacao;
  /** Dispara o prompt nativo. Retorna o resultado da escolha do usuário. */
  instalar: () => Promise<ResultadoInstalacao>;
}

// --- Estado no escopo do módulo -------------------------------------------
// O evento `beforeinstallprompt` pode disparar antes do React montar; então
// capturamos e guardamos o evento aqui, e os componentes apenas o observam.
let eventoCapturado: EventoInstalacao | null = null;
const inscritos = new Set<() => void>();
const avisarInscritos = () => inscritos.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Impede o mini-infobar padrão do Chrome; mostramos nosso próprio botão.
    e.preventDefault();
    eventoCapturado = e as EventoInstalacao;
    avisarInscritos();
  });
  window.addEventListener('appinstalled', () => {
    eventoCapturado = null;
    avisarInscritos();
  });
}

function inscrever(cb: () => void): () => void {
  inscritos.add(cb);
  return () => {
    inscritos.delete(cb);
  };
}

function temEventoCapturado(): boolean {
  return eventoCapturado !== null;
}

// --- Utilitários -----------------------------------------------------------

function detectarPlataforma(): PlataformaInstalacao {
  if (typeof navigator === 'undefined') return 'outro';
  const ua = navigator.userAgent;
  const ehIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ehIOS) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/win|mac|linux|cros/i.test(ua)) return 'desktop';
  return 'outro';
}

function estaEmModoInstalado(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const navigatorStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || navigatorStandalone;
}

/**
 * Gerencia a instalação da PWA.
 *
 * - Chromium (Chrome/Edge desktop e Android): captura `beforeinstallprompt` e permite
 *   chamar `instalar()` a partir de um botão.
 * - iOS/iPadOS: não dispara o evento; expõe `precisaCompartilhar` para mostrar instruções.
 */
export function useInstalarPWA(): InstalacaoPWA {
  const podeInstalar = useSyncExternalStore(
    inscrever,
    temEventoCapturado,
    () => false,
  );
  const [instalado, setInstalado] = useState(estaEmModoInstalado);
  const [plataforma, setPlataforma] = useState<PlataformaInstalacao>('outro');

  useEffect(() => {
    setPlataforma(detectarPlataforma());

    const consulta = window.matchMedia?.('(display-mode: standalone)');
    const aoMudarModo = (e: MediaQueryListEvent) => setInstalado(e.matches);
    consulta?.addEventListener?.('change', aoMudarModo);
    return () => consulta?.removeEventListener?.('change', aoMudarModo);
  }, []);

  const instalar = useCallback(async (): Promise<ResultadoInstalacao> => {
    if (!eventoCapturado) return 'indisponivel';
    const evento = eventoCapturado;
    await evento.prompt();
    const escolha = await evento.userChoice;
    eventoCapturado = null;
    avisarInscritos();
    return escolha.outcome === 'accepted' ? 'aceito' : 'recusado';
  }, []);

  return {
    instalado,
    podeInstalar,
    precisaCompartilhar: plataforma === 'ios' && !instalado,
    plataforma,
    instalar,
  };
}
