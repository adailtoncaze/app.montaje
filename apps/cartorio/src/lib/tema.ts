import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ModoTema = 'claro' | 'escuro' | 'sistema';

export interface EstadoTema {
  tema: ModoTema;
  definirTema: (tema: ModoTema) => void;
}

const CHAVE_TEMA = 'montaje.cartorio.tema';

function atualizarMetaCor(tema: ModoTema) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  if (tema === 'escuro') {
    meta.setAttribute('content', '#0b1220');
    return;
  }
  if (tema === 'claro') {
    meta.setAttribute('content', '#4f46e5');
    return;
  }
  // sistema: verifica preferência atual
  const escuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  meta.setAttribute('content', escuro ? '#0b1220' : '#4f46e5');
}

export function aplicarTema(tema: ModoTema) {
  const html = document.documentElement;
  const escuro =
    tema === 'escuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (escuro) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  atualizarMetaCor(tema);
}

export const useTemaStore = create<EstadoTema>()(
  persist(
    (set) => ({
      tema: 'sistema',
      definirTema: (tema) => {
        aplicarTema(tema);
        set({ tema });
      },
    }),
    {
      name: CHAVE_TEMA,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { CHAVE_TEMA };
