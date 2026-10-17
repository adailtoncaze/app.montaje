import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSessao } from '@/features/auth/store';
import { Login } from '@/features/auth/Login';
import { Layout } from '@/app/Layout';
import { Inicio } from '@/features/inicio/Inicio';
import { Locais } from '@/features/locais/Locais';
import { LocalDetalhe } from '@/features/locais/LocalDetalhe';
import { Equipes } from '@/features/equipes/Equipes';
import { Cronograma } from '@/features/cronograma/Cronograma';
import { SecaoDetalhe } from '@/features/secoes/SecaoDetalhe';

function Protegido({ children }: { children: ReactNode }) {
  const perfil = useSessao((s) => s.perfil);
  return perfil ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <Protegido>
            <Layout />
          </Protegido>
        }
      >
        <Route path="/" element={<Inicio />} />
        <Route path="/locais" element={<Locais />} />
        <Route path="/locais/:localId" element={<LocalDetalhe />} />
        <Route path="/locais/:localId/secoes/:secaoId" element={<SecaoDetalhe />} />
        <Route path="/equipes" element={<Equipes />} />
        <Route path="/cronograma" element={<Cronograma />} />
        {/* Rota antiga: mantém compatibilidade com links já compartilhados. */}
        <Route path="/secoes" element={<Navigate to="/locais" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
