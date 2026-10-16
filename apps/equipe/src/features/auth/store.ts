import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Perfil } from '@montaje/core';

interface SessaoState {
  perfil: Perfil | null;
  definirPerfil: (p: Perfil | null) => void;
}

/**
 * Sessao do usuario persistida no aparelho (RF-E02).
 * A sessao do Supabase (token) fica no storageKey 'montaje.sessao'.
 */
export const useSessao = create<SessaoState>()(
  persist(
    (set) => ({
      perfil: null,
      definirPerfil: (perfil) => set({ perfil }),
    }),
    { name: 'montaje.sessao.perfil' },
  ),
);
