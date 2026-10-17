import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ROTULO_STATUS_ETAPA,
  etapaLiberada,
  motivoBloqueioEtapa2,
  type Etapa,
} from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowSync24Regular,
  LockClosed24Regular,
} from '@fluentui/react-icons';
import {
  Aviso,
  Botao,
  CabecalhoApp,
  Cartao,
  Medalhao,
  Selo,
  BarraProgresso,
  pontoTablet,
} from '@montaje/ui';
import { db } from '@/db/schema';
import { tomStatusEtapa } from '@/lib/status-ui';
import { baixarAlteracoes } from '@/features/sync/download';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      padding: tokens.spacingVerticalL,
      gap: tokens.spacingVerticalL,
    },
  },
  lista: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: tokens.spacingHorizontalL,
    },
  },
  conteudoCartao: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  bloqueado: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  acao: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
});

function CartaoEtapa({
  etapa,
  status,
  bloqueada,
  motivo,
  href,
  concluidos,
  total,
}: {
  etapa: Etapa;
  status: Parameters<typeof tomStatusEtapa>[0];
  bloqueada: boolean;
  motivo: string | null;
  href: string;
  concluidos: number;
  total: number;
}) {
  const c = useClasses();
  const descricao =
    etapa === 1
      ? 'Layout, cartazes e definição da posição da urna (fotos 1 a 3).'
      : 'Instalação da urna e verificação do sigilo do voto (foto 4).';

  return (
    <Cartao
      inicio={
        <Medalhao tom={bloqueada ? 'neutro' : 'marca'}>
          {bloqueada ? <LockClosed24Regular /> : etapa}
        </Medalhao>
      }
      titulo={`Etapa ${etapa}`}
      descricao={descricao}
      acao={<Selo texto={ROTULO_STATUS_ETAPA[status]} tom={tomStatusEtapa(status)} />}
    >
      <div className={c.conteudoCartao}>
        {total > 0 && <BarraProgresso concluidos={concluidos} total={total} />}

        {bloqueada ? (
          <span className={c.bloqueado}>
            <LockClosed24Regular />
            <Text size={200}>{motivo ?? 'Etapa bloqueada.'}</Text>
          </span>
        ) : (
          <Link to={href} style={{ textDecorationLine: 'none' }} className={c.acao}>
            <Botao variante="secundario">Abrir checklist</Botao>
          </Link>
        )}
      </div>
    </Cartao>
  );
}

export function SecaoDetalhe() {
  const c = useClasses();
  const { localId = '', secaoId = '' } = useParams();
  const secao = useLiveQuery(() => db.secoes.get(secaoId), [secaoId]);
  const local = useLiveQuery(
    () => (secao ? db.locais.get(secao.local_id) : undefined),
    [secao?.local_id],
  );
  const itens = useLiveQuery(
    () => db.itens.where('secao_id').equals(secaoId).toArray(),
    [secaoId],
    [],
  );
  const validacoes = useLiveQuery(
    () => db.validacoes.where('secao_id').equals(secaoId).toArray(),
    [secaoId],
    [],
  );
  const [verificando, setVerificando] = useState(false);
  const [avisoCheck, setAvisoCheck] = useState<string | null>(null);

  const voltar = `/locais/${localId}`;

  async function verificarCartorio() {
    setAvisoCheck(null);
    setVerificando(true);
    try {
      const n = await baixarAlteracoes();
      setAvisoCheck(
        n > 0
          ? 'Status atualizado pelo cartório.'
          : 'Nenhuma novidade do cartório até agora.',
      );
    } catch {
      setAvisoCheck('Não foi possível verificar agora. Confira a conexão e tente de novo.');
    } finally {
      setVerificando(false);
    }
  }

  if (!secao) {
    return (
      <>
        <CabecalhoApp
          titulo="Seção"
          inicio={
            <Link to={voltar} aria-label="Voltar">
              <ArrowLeft24Regular />
            </Link>
          }
        />
        <div className={c.pagina}>
          <Text>Carregando seção…</Text>
        </div>
      </>
    );
  }

  const etapa2Liberada = etapaLiberada(2, secao.status_etapa1);
  const bloqueio2 = motivoBloqueioEtapa2(secao.status_etapa1);

  const conta = (etapa: Etapa) => {
    const daEtapa = itens.filter((i) => i.etapa === etapa);
    return {
      concluidos: daEtapa.filter((i) => i.status !== 'pendente').length,
      total: daEtapa.length,
    };
  };
  const e1 = conta(1);
  const e2 = conta(2);

  // Última devolução do cartório por etapa (motivo da correção a ser feita em campo).
  // Só aparece enquanto a etapa está realmente devolvida — some ao reenviar/aprovar.
  const correcaoDe = (etapa: Etapa) =>
    validacoes
      .filter((v) => v.etapa === etapa && v.status === 'correcao_solicitada')
      .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  const statusDaEtapa = (etapa: Etapa) =>
    etapa === 1 ? secao.status_etapa1 : secao.status_etapa2;
  const correcao1 =
    statusDaEtapa(1) === 'correcao_solicitada' ? correcaoDe(1) : undefined;
  const correcao2 =
    statusDaEtapa(2) === 'correcao_solicitada' ? correcaoDe(2) : undefined;
  const nomeItem = (id: string | null) => itens.find((i) => i.id === id)?.nome ?? null;

  return (
    <>
      <CabecalhoApp
        titulo={`Seção ${secao.numero}`}
        subtitulo={local?.nome}
        inicio={
          <Link to={voltar} aria-label="Voltar" style={{ color: 'inherit' }}>
            <ArrowLeft24Regular />
          </Link>
        }
      />

      <div className={c.pagina}>
        {!secao.conforme && (
          <Aviso tom="alerta" titulo="Seção não conforme no sigilo do voto">
            Esta seção foi marcada como não conforme. O cartório precisa tratar antes da
            votação.
          </Aviso>
        )}

        {[
          { etapa: 1 as Etapa, correcao: correcao1 },
          { etapa: 2 as Etapa, correcao: correcao2 },
        ].map(({ etapa, correcao }) =>
          correcao ? (
            <Aviso
              key={etapa}
              tom="erro"
              titulo={`Etapa ${etapa} devolvida para correção`}
            >
              {nomeItem(correcao.item_devolvido) && (
                <Text size={200} weight="semibold" block>
                  Item: {nomeItem(correcao.item_devolvido)}
                </Text>
              )}
              {correcao.comentario && (
                <Text size={200} block>
                  {correcao.comentario}
                </Text>
              )}
              <Text size={200} block>
                Corrija e envie novamente pela Etapa {etapa}. A equipe ainda está no local.
              </Text>
            </Aviso>
          ) : null,
        )}

        <div className={c.acao}>
          <Botao
            variante="secundario"
            icon={<ArrowSync24Regular />}
            carregando={verificando}
            disabled={verificando}
            onClick={verificarCartorio}
          >
            Verificar status no cartório
          </Botao>
        </div>

        {avisoCheck && (
          <Aviso tom="info" titulo="Cartório">
            {avisoCheck}
          </Aviso>
        )}

        <div className={c.lista}>
          <CartaoEtapa
            etapa={1}
            status={secao.status_etapa1}
            bloqueada={false}
            motivo={null}
            href={`/locais/${localId}/secoes/${secao.id}/etapa/1`}
            concluidos={e1.concluidos}
            total={e1.total}
          />

          <CartaoEtapa
            etapa={2}
            status={secao.status_etapa2}
            bloqueada={!etapa2Liberada}
            motivo={bloqueio2}
            href={`/locais/${localId}/secoes/${secao.id}/etapa/2`}
            concluidos={e2.concluidos}
            total={e2.total}
          />
        </div>
      </div>
    </>
  );
}
