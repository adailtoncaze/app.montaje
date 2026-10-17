import { Link, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import {
  ClipboardTaskListLtr24Regular,
  Location24Regular,
  TextBulletListSquare24Regular,
} from '@fluentui/react-icons';
import { Botao, Cartao, Medalhao } from '@montaje/ui';
import { ROTULO_PAPEL } from '@montaje/core';
import { useSessao } from '@/features/auth/store';
import { useLocais } from '@/lib/dados';
import { Login } from '@/features/auth/Login';
import { Locais } from '@/features/locais/Locais';
import { LocalDetalhe } from '@/features/locais/LocalDetalhe';
import { SecaoDetalhe } from '@/features/secoes/SecaoDetalhe';
import { Layout } from '@/app/Layout';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  cartoes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  contador: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
  },
  numero: {
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: tokens.fontWeightBold,
  },
  destaque: {
    color: tokens.colorBrandForeground1,
  },
  alerta: {
    color: tokens.colorPaletteRedForeground1,
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
  const { data } = useLocais();

  const locais = data ?? [];
  const totais = locais.reduce(
    (acc, local) => ({
      secoes: acc.secoes + local.totalSecoes,
      aguardando: acc.aguardando + local.aguardando,
      naoConformes: acc.naoConformes + local.naoConformes,
    }),
    { secoes: 0, aguardando: 0, naoConformes: 0 },
  );

  return (
    <div className={c.pagina}>
      <div>
        <Title2>Início</Title2>
        <Text className={c.rotulo}>
          Olá, {perfil?.nome ?? '—'}
          {perfil ? ` · ${ROTULO_PAPEL[perfil.papel]}` : ''}
        </Text>
      </div>

      <div className={c.resumo}>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{locais.length}</Text>
          <Text size={200}>Local(is)</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{totais.secoes}</Text>
          <Text size={200}>Seções</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${c.destaque}`}>{totais.aguardando}</Text>
          <Text size={200}>Aguardando validação</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${totais.naoConformes > 0 ? c.alerta : ''}`}>
            {totais.naoConformes}
          </Text>
          <Text size={200}>Sigilo não conforme</Text>
        </Cartao>
      </div>

      <div className={c.cartoes}>
        <Cartao
          inicio={
            <Medalhao tom="marca">
              <Location24Regular />
            </Medalhao>
          }
          titulo="Locais de votação"
          descricao="Navegue por local, veja as seções e valide as evidências."
          acao={
            <Link to="/locais" style={{ textDecorationLine: 'none' }}>
              <Botao variante="primario" icon={<ClipboardTaskListLtr24Regular />}>
                Abrir locais
              </Botao>
            </Link>
          }
        />

        <Cartao titulo="Auditoria" acao={<Text size={200} className={c.rotulo}>Em breve</Text>}>
          <div className={c.conteudoCartao}>
            <Text size={200} className={c.rotulo}>
              Histórico de validações e alterações de status. Entra no épico de auditoria.
            </Text>
            <Botao variante="sutil" icon={<TextBulletListSquare24Regular />} disabled>
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
        <Route path="/locais" element={<Locais />} />
        <Route path="/locais/:localId" element={<LocalDetalhe />} />
        <Route path="/locais/:localId/secoes/:secaoId" element={<SecaoDetalhe />} />
        {/* Rota antiga: mantém compatibilidade com links já compartilhados. */}
        <Route path="/secoes" element={<Navigate to="/locais" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
