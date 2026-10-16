import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Perfil } from '@montaje/core';

interface SessaoState {
  perfil: Perfil | null;
  definirPerfil: (p: Perfil | null) => void;
}

export const useSessao = create<SessaoState>()(
  persist(
    (set) => ({
      perfil: null,
      definirPerfil: (perfil) => set({ perfil }),
    }),
    { name: 'montaje.cartorio.perfil' },
  ),
);
