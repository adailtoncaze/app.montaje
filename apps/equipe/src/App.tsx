import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSessao } from '@/features/auth/store';
import { Login } from '@/features/auth/Login';
import { AppShell } from './app/AppShell';
import { MeusLocais } from '@/features/locais/MeusLocais';
import { LocalDetalhe } from '@/features/locais/LocalDetalhe';
import { SecaoDetalhe } from '@/features/secoes/SecaoDetalhe';
import { ChecklistEtapa } from '@/features/secoes/ChecklistEtapa';
import { ResumoEtapa } from '@/features/secoes/ResumoEtapa';
import { Sincronizacao } from '@/features/sync/Sincronizacao';
import { Configuracoes } from '@/features/config/Configuracoes';
import { Manual } from '@/features/ajuda/Manual';
import { ToasterAvisos } from '@/lib/avisos';

function SomenteEtapa1({ children }: { children: ReactNode }) {
  const { etapa } = useParams();
  if (etapa === '2') {
    return <Navigate to="/locais" replace />;
  }
  return <>{children}</>;
}

function Protegido({ children }: { children: ReactNode }) {
  const perfil = useSessao((s) => s.perfil);
  return perfil ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <Protegido>
              <AppShell />
            </Protegido>
          }
        >
          <Route path="/locais" element={<MeusLocais />} />
          <Route path="/locais/:localId" element={<LocalDetalhe />} />
          <Route
            path="/locais/:localId/secoes/:secaoId"
            element={<SecaoDetalhe />}
          />
          <Route
            path="/locais/:localId/secoes/:secaoId/etapa/:etapa"
            element={
              <SomenteEtapa1>
                <ChecklistEtapa />
              </SomenteEtapa1>
            }
          />
          <Route
            path="/locais/:localId/secoes/:secaoId/etapa/:etapa/resumo"
            element={
              <SomenteEtapa1>
                <ResumoEtapa />
              </SomenteEtapa1>
            }
          />
          <Route path="/sincronizacao" element={<Sincronizacao />} />
          <Route path="/config" element={<Configuracoes />} />
          <Route path="/manual" element={<Manual />} />
        </Route>

        <Route path="*" element={<Navigate to="/locais" replace />} />
      </Routes>

      {/* Toaster no topo do app: disponível em todas as rotas, inclusive o Login. */}
      <ToasterAvisos />
    </>
  );
}
