import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import {
  ROTULO_STATUS_ETAPA,
  etapaLiberada,
  motivoBloqueioEtapa2,
  perguntaDeSigilo,
  type Etapa,
} from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  CheckmarkCircle24Regular,
  LockClosed24Regular,
} from '@fluentui/react-icons';
import {
  Aviso,
  BarraProgresso,
  Botao,
  CabecalhoApp,
  EstadoVazio,
  Selo,
  pontoTablet,
} from '@montaje/ui';
import { db } from '@/db/schema';
import { tomStatusEtapa } from '@/lib/status-ui';
import { ItemConfirmacao } from './ItemConfirmacao';
import { ItemFoto } from './ItemFoto';
import { ReferenciaEtapa1 } from './ReferenciaEtapa1';
import { SigiloEtapa } from './SigiloEtapa';

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
  resumo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
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
  bloqueio: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  rodape: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export function ChecklistEtapa() {
  const c = useClasses();
  const { localId = '', secaoId = '', etapa: etapaParam = '1' } = useParams();
  const etapa: Etapa = etapaParam === '2' ? 2 : 1;

  const secao = useLiveQuery(() => db.secoes.get(secaoId), [secaoId]);
  const local = useLiveQuery(
    () => (secao ? db.locais.get(secao.local_id) : undefined),
    [secao?.local_id],
  );
  const itens = useLiveQuery(
    () =>
      db.itens
        .where('secao_id')
        .equals(secaoId)
        .and((i) => i.etapa === etapa)
        .toArray(),
    [secaoId, etapa],
    [],
  );

  const voltar = `/locais/${localId}/secoes/${secaoId}`;
  const resumo = `/locais/${localId}/secoes/${secaoId}/etapa/${etapa}/resumo`;
  const statusEtapa = secao
    ? etapa === 1
      ? secao.status_etapa1
      : secao.status_etapa2
    : 'pendente';
  const somenteLeitura = statusEtapa === 'enviada' || statusEtapa === 'aprovada';
  const ordenados = [...itens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const concluidos = itens.filter((i) => i.status !== 'pendente').length;
  const sigiloItens = ordenados.filter((i) => perguntaDeSigilo(i.nome));
  const demaisItens = ordenados.filter((i) => !perguntaDeSigilo(i.nome));

  const bloqueada = etapa === 2 && secao ? !etapaLiberada(2, secao.status_etapa1) : false;
  const motivo = secao ? motivoBloqueioEtapa2(secao.status_etapa1) : null;

  return (
    <>
      <CabecalhoApp
        titulo={`Etapa ${etapa}`}
        subtitulo={
          secao ? `Seção ${secao.numero}${local ? ` · ${local.nome}` : ''}` : undefined
        }
        inicio={
          <Link to={voltar} aria-label="Voltar" style={{ color: 'inherit' }}>
            <ArrowLeft24Regular />
          </Link>
        }
      />

      <div className={c.pagina}>
        {!secao ? (
          <Text>Carregando checklist…</Text>
        ) : bloqueada ? (
          <>
            <Aviso tom="alerta" titulo="Etapa 2 bloqueada">
              {motivo ?? 'Conclua e envie a Etapa 1 primeiro.'}
            </Aviso>
            <div className={c.bloqueio}>
              <LockClosed24Regular />
              <Text size={200}>A Etapa 2 só é liberada após a aprovação da Etapa 1.</Text>
            </div>
          </>
        ) : (
          <>
            <Aviso tom="alerta" titulo="Não fotografe pessoas">
              Enquadre apenas o ambiente da seção: cartazes, mesa dos mesários e o local da
              urna/cabine. As fotos são obrigatórias e preservam o sigilo do voto.
            </Aviso>

            {etapa === 2 && <ReferenciaEtapa1 secaoId={secaoId} />}

            <div className={c.resumo}>
              <Selo texto={ROTULO_STATUS_ETAPA[statusEtapa]} tom={tomStatusEtapa(statusEtapa)} />
              <BarraProgresso
                concluidos={concluidos}
                total={itens.length}
                rotulo={`${concluidos} de ${itens.length} itens`}
              />
            </div>

            {somenteLeitura && (
              <Aviso tom="info" titulo="Etapa enviada ao cartório">
                A edição fica bloqueada enquanto o cartório não devolver a etapa para correção.
              </Aviso>
            )}

            {ordenados.length === 0 ? (
              <EstadoVazio
                titulo="Checklist ainda não baixado"
                descricao="Os itens desta etapa não estão no aparelho. Use 'Baixar dados do dia' em Ajustes."
              />
            ) : (
              <>
                <SigiloEtapa
                  itens={sigiloItens}
                  secaoId={secaoId}
                  somenteLeitura={somenteLeitura}
                />

                {demaisItens.length > 0 && (
                  <div className={c.lista}>
                    {demaisItens.map((item) =>
                      item.tipo === 'foto' ? (
                        <ItemFoto
                          key={item.id}
                          item={item}
                          secaoId={secaoId}
                          somenteLeitura={somenteLeitura}
                        />
                      ) : (
                        <ItemConfirmacao
                          key={item.id}
                          item={item}
                          secaoId={secaoId}
                          somenteLeitura={somenteLeitura}
                        />
                      ),
                    )}
                  </div>
                )}
              </>
            )}

            <div className={c.rodape}>
              <Link to={resumo} style={{ textDecoration: 'none' }}>
                <Botao variante="primario" icon={<CheckmarkCircle24Regular />}>
                  Revisar e enviar
                </Botao>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
