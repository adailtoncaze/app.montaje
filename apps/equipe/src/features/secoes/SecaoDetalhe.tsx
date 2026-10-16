import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import {
  ROTULO_STATUS_ETAPA,
  etapaLiberada,
  motivoBloqueioEtapa2,
  type Etapa,
} from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowLeft24Regular, LockClosed24Regular } from '@fluentui/react-icons';
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

  const voltar = `/locais/${localId}`;

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
