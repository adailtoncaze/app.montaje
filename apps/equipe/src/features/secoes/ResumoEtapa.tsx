import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ROTULO_STATUS_ETAPA, type Etapa } from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import {
  Aviso,
  BarraProgresso,
  Botao,
  CabecalhoApp,
  Cartao,
  EstadoVazio,
  Selo,
  pontoTablet,
} from '@montaje/ui';
import { db } from '@/db/schema';
import { enviarEtapa } from '@/db/repo';
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
  resumo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
  },
  acoes: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

export function ResumoEtapa() {
  const c = useClasses();
  const { localId = '', secaoId = '', etapa: etapaParam = '1' } = useParams();
  const etapa: Etapa = etapaParam === '2' ? 2 : 1;

  const [enviando, setEnviando] = useState(false);
  const [enviadoAgora, setEnviadoAgora] = useState(false);

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
  const comFoto = useLiveQuery(
    () => db.evidencias.orderBy('item_id').uniqueKeys(),
    [],
    [] as string[],
  );
  const validacoes = useLiveQuery(
    () => db.validacoes.where('secao_id').equals(secaoId).toArray(),
    [secaoId],
    [],
  );

  const checklist = `/locais/${localId}/secoes/${secaoId}/etapa/${etapa}`;

  const ordenados = [...itens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const pendencias = ordenados.filter((i) =>
    i.tipo === 'foto' ? !comFoto.includes(i.id) : i.resposta === null,
  );
  const concluidos = itens.length - pendencias.length;

  const statusAtual = secao
    ? etapa === 1
      ? secao.status_etapa1
      : secao.status_etapa2
    : 'pendente';
  const jaEnviada = statusAtual === 'enviada' || statusAtual === 'aprovada';
  const podeEnviar = Boolean(secao) && itens.length > 0 && !jaEnviada && pendencias.length === 0;

  const correcao = [...validacoes]
    .filter((v) => v.etapa === etapa && v.status === 'correcao_solicitada')
    .sort((a, b) => b.data.localeCompare(a.data))[0];

  async function enviar() {
    setEnviando(true);
    try {
      await enviarEtapa(secaoId, etapa);
      setEnviadoAgora(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabecalhoApp
        titulo={`Resumo da Etapa ${etapa}`}
        subtitulo={secao ? `Seção ${secao.numero}${local ? ` · ${local.nome}` : ''}` : undefined}
        inicio={
          <Link to={checklist} aria-label="Voltar ao checklist" style={{ color: 'inherit' }}>
            <ArrowLeft24Regular />
          </Link>
        }
      />

      <div className={c.pagina}>
        {!secao ? (
          <Text>Carregando resumo…</Text>
        ) : (
          <>
            {(enviadoAgora || jaEnviada) && (
              <Aviso tom="sucesso" titulo="Etapa enviada">
                {statusAtual === 'aprovada'
                  ? 'Etapa aprovada pelo cartório.'
                  : 'Aguardando validação do cartório.'}
              </Aviso>
            )}

            {correcao && !jaEnviada && (
              <Aviso tom="erro" titulo="Correção solicitada pelo cartório">
                {correcao.comentario ?? 'Corrija os itens indicados e reenvie a etapa.'}
              </Aviso>
            )}

            <div className={c.resumo}>
              <Selo texto={ROTULO_STATUS_ETAPA[statusAtual]} tom={tomStatusEtapa(statusAtual)} />
              <BarraProgresso
                concluidos={concluidos}
                total={itens.length}
                rotulo={`${concluidos} de ${itens.length} itens`}
              />
            </div>

            {itens.length === 0 ? (
              <EstadoVazio
                titulo="Checklist ainda não baixado"
                descricao="Os itens desta etapa não estão no aparelho. Use 'Baixar dados do dia' em Ajustes."
              />
            ) : pendencias.length > 0 ? (
              <Cartao
                titulo={`${pendencias.length} item(ns) pendente(s)`}
                descricao="Conclua os itens abaixo para liberar o envio."
              >
                <ul className={c.lista}>
                  {pendencias.map((p) => (
                    <li key={p.id}>
                      <Text size={200}>
                        {p.tipo === 'foto' ? 'Foto: ' : 'Confirmação: '}
                        {p.nome}
                      </Text>
                    </li>
                  ))}
                </ul>
              </Cartao>
            ) : (
              <Aviso tom="sucesso" titulo="Tudo preenchido">
                Todos os itens desta etapa estão concluídos.
              </Aviso>
            )}

            <div className={c.acoes}>
              <Link to={checklist} style={{ textDecoration: 'none' }}>
                <Botao variante="secundario" icon={<ArrowLeft24Regular />}>
                  Revisar checklist
                </Botao>
              </Link>

              {jaEnviada ? (
                <Botao variante="primario" disabled icon={<CheckmarkCircle24Regular />}>
                  Etapa enviada
                </Botao>
              ) : (
                <Botao
                  variante="primario"
                  icon={<CheckmarkCircle24Regular />}
                  carregando={enviando}
                  disabled={!podeEnviar}
                  onClick={enviar}
                >
                  Enviar etapa
                </Botao>
              )}
            </div>

            {!jaEnviada && pendencias.length > 0 && (
              <div className={c.acoes}>
                <Dismiss24Regular />
                <Text size={200}>O envio fica bloqueado enquanto houver pendências.</Text>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
