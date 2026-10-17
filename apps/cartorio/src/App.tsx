import { Link, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { ClipboardTaskListLtr24Regular, TextBulletListSquare24Regular } from '@fluentui/react-icons';
import { Botao, Cartao } from '@montaje/ui';
import { ROTULO_PAPEL } from '@montaje/core';
import { useSessao } from '@/features/auth/store';
import { Login } from '@/features/auth/Login';
import { Secoes } from '@/features/secoes/Secoes';
import { SecaoDetalhe } from '@/features/secoes/SecaoDetalhe';
import { Layout } from '@/app/Layout';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  cartoes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  conteudoCartao: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
});

function Protegido({ children }: { children: ReactNode }) {
  const perfil = useSessao((s) => s.perfil);
  return perfil ? <>{children}</> : <Navigate to="/login" replace />;
}

function Inicio() {
  const c = useClasses();
  const perfil = useSessao((s) => s.perfil);

  return (
    <div className={c.pagina}>
      <Title2>Início</Title2>
      <Text className={c.rotulo}>
        Olá, {perfil?.nome ?? '—'}
        {perfil ? ` · ${ROTULO_PAPEL[perfil.papel]}` : ''}
      </Text>

      <div className={c.cartoes}>
        <Cartao titulo="Seções e validação">
          <div className={c.conteudoCartao}>
            <Text size={200} className={c.rotulo}>
              Acompanhe as duas etapas, valide evidências e trate as não conformidades.
            </Text>
            <Link to="/secoes" style={{ textDecorationLine: 'none' }}>
              <Botao variante="secundario" icon={<ClipboardTaskListLtr24Regular />}>
                Abrir seções
              </Botao>
            </Link>
          </div>
        </Cartao>

        <Cartao titulo="Auditoria">
          <div className={c.conteudoCartao}>
            <Text size={200} className={c.rotulo}>
              Histórico de validações e alterações de status. Entra no épico de auditoria.
            </Text>
            <Botao
              variante="sutil"
              icon={<TextBulletListSquare24Regular />}
              disabled
            >
              Em breve
            </Botao>
          </div>
        </Cartao>
      </div>
    </div>
  );
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
        <Route path="/secoes" element={<Secoes />} />
        <Route path="/secoes/:secaoId" element={<SecaoDetalhe />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
