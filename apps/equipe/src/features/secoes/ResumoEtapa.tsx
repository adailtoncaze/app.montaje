import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROTULO_STATUS_ETAPA, perguntaDeSigilo, type Etapa } from '@montaje/core';
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
  ConteudoPagina,
  DialogoConfirmacao,
  EsqueletoLista,
  EstadoVazio,
  Selo,
  pontoTablet,
} from '@montaje/ui';
import { db } from '@/db/schema';
import { enviarEtapa } from '@/db/repo';
import { tomStatusEtapa } from '@/lib/status-ui';
import { useAvisos } from '@/lib/avisos';

const useClasses = makeStyles({
  resumo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  contadores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    },
  },
  contador: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  numero: {
    fontSize: '24px',
    lineHeight: '28px',
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  numeroOk: {
    color: tokens.colorPaletteGreenForeground1,
  },
  numeroAlerta: {
    color: tokens.colorPaletteYellowForeground1,
  },
  numeroErro: {
    color: tokens.colorPaletteRedForeground1,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
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
  bloqueio: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorPaletteRedForeground1,
  },
});

function Contador({
  valor,
  rotulo,
  tom,
}: {
  valor: number | string;
  rotulo: string;
  tom?: 'ok' | 'alerta' | 'erro';
}) {
  const c = useClasses();
  const cor =
    tom === 'ok' ? c.numeroOk : tom === 'alerta' ? c.numeroAlerta : tom === 'erro' ? c.numeroErro : '';
  return (
    <Cartao className={c.contador}>
      <Text className={`${c.numero} ${cor}`}>{valor}</Text>
      <Text size={200} className={c.rotulo}>
        {rotulo}
      </Text>
    </Cartao>
  );
}

export function ResumoEtapa() {
  const c = useClasses();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const { localId = '', secaoId = '', etapa: etapaParam = '1' } = useParams();
  const etapa: Etapa = etapaParam === '2' ? 2 : 1;

  const [enviando, setEnviando] = useState(false);
  const [enviadoAgora, setEnviadoAgora] = useState(false);
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);

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
  const desvios = useLiveQuery(
    async () => {
      const ids = (await db.itens.where('secao_id').equals(secaoId).toArray()).map((i) => i.id);
      if (ids.length === 0) return [];
      return db.desvios.where('item_id').anyOf(ids).toArray();
    },
    [secaoId],
    [],
  );

  const checklist = `/locais/${localId}/secoes/${secaoId}/etapa/${etapa}`;

  const ordenados = [...itens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const pendencias = ordenados.filter((i) =>
    i.tipo === 'foto' ? !comFoto.includes(i.id) : i.resposta === null,
  );
  const concluidos = itens.length - pendencias.length;

  const fotosTotal = itens.filter((i) => i.tipo === 'foto').length;
  const fotosEnviadas = itens.filter((i) => i.tipo === 'foto' && comFoto.includes(i.id)).length;
  const naoConformes = itens.filter((i) => i.resposta === false).length;

  // APP-21 — sigilo do voto: qualquer "nao" exige desvio registrado para liberar o envio.
  const desvioItemIds = new Set(desvios.map((d) => d.item_id));
  const sigiloItens = ordenados.filter((i) => perguntaDeSigilo(i.nome));
  const sigiloComprometido = sigiloItens.some((i) => i.resposta === false);
  const sigiloSemDesvio = sigiloItens.filter(
    (i) => i.resposta === false && !desvioItemIds.has(i.id),
  );
  const bloqueioSigilo = etapa === 2 && sigiloSemDesvio.length > 0;

  const statusAtual = secao
    ? etapa === 1
      ? secao.status_etapa1
      : secao.status_etapa2
    : 'pendente';
  const jaEnviada = statusAtual === 'enviada' || statusAtual === 'aprovada';
  const podeEnviar =
    Boolean(secao) && itens.length > 0 && !jaEnviada && pendencias.length === 0 && !bloqueioSigilo;

  const correcao = [...validacoes]
    .filter((v) => v.etapa === etapa && v.status === 'correcao_solicitada')
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  const itemDevolvido = correcao?.item_devolvido
    ? itens.find((i) => i.id === correcao.item_devolvido)?.nome ?? null
    : null;

  async function enviar() {
    setEnviando(true);
    try {
      await enviarEtapa(secaoId, etapa);
      setEnviadoAgora(true);
      setConfirmarEnvio(false);
      avisos.sucesso('Etapa enviada', 'Os registros serão sincronizados com o cartório.');
    } catch {
      avisos.erro('Não foi possível enviar', 'Confira a conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabecalhoApp
        titulo={`Resumo da Etapa ${etapa}`}
        subtitulo={secao ? `Seção ${secao.numero}${local ? ` · ${local.nome}` : ''}` : undefined}
        aoVoltar={() => navigate(checklist)}
      />

      <ConteudoPagina>
        {!secao ? (
          <EsqueletoLista itens={2} />
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
                {itemDevolvido && (
                  <Text size={200} weight="semibold" block>
                    Item a corrigir: {itemDevolvido}
                  </Text>
                )}
                <Text size={200} block>
                  {correcao.comentario ?? 'Corrija os itens indicados e reenvie a etapa.'}
                </Text>
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
            ) : (
              <>
                <div className={c.contadores}>
                  <Contador
                    valor={`${concluidos}/${itens.length}`}
                    rotulo="Itens concluídos"
                    tom={concluidos === itens.length ? 'ok' : undefined}
                  />
                  <Contador
                    valor={fotosTotal > 0 ? `${fotosEnviadas}/${fotosTotal}` : '—'}
                    rotulo="Fotos"
                    tom={fotosTotal > 0 && fotosEnviadas === fotosTotal ? 'ok' : undefined}
                  />
                  <Contador
                    valor={pendencias.length}
                    rotulo="Pendências"
                    tom={pendencias.length > 0 ? 'alerta' : 'ok'}
                  />
                  <Contador
                    valor={naoConformes}
                    rotulo="Não conformes"
                    tom={naoConformes > 0 ? 'erro' : 'ok'}
                  />
                </div>

                {pendencias.length > 0 ? (
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
              </>
            )}

            {etapa === 2 && sigiloItens.length > 0 && (
              <Cartao
                titulo="Sigilo do voto"
                descricao="Perguntas eliminatórias da Etapa 2 (regra 1)."
                acao={
                  <Selo
                    texto={sigiloComprometido ? 'Comprometido' : 'Preservado'}
                    tom={sigiloComprometido ? 'erro' : 'ok'}
                  />
                }
              >
                {sigiloSemDesvio.length > 0 ? (
                  <>
                    <Text size={200}>
                      Registre o desvio das perguntas abaixo no checklist para liberar o envio:
                    </Text>
                    <ul className={c.lista}>
                      {sigiloSemDesvio.map((s) => (
                        <li key={s.id}>
                          <Text size={200}>{s.nome}</Text>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : sigiloComprometido ? (
                  <Text size={200}>
                    O sigilo foi comprometido e o desvio foi registrado. A etapa será enviada como
                    não conforme para análise do cartório.
                  </Text>
                ) : (
                  <Text size={200}>Nenhuma pergunta de sigilo foi respondida como “Não”.</Text>
                )}
              </Cartao>
            )}

            <div className={c.acoes}>
              <Botao
                variante="secundario"
                icon={<ArrowLeft24Regular />}
                onClick={() => navigate(checklist)}
              >
                Revisar checklist
              </Botao>

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
                  onClick={() => setConfirmarEnvio(true)}
                >
                  Enviar etapa
                </Botao>
              )}
            </div>

            {!jaEnviada && pendencias.length > 0 && (
              <div className={c.bloqueio}>
                <Dismiss24Regular />
                <Text size={200}>O envio fica bloqueado enquanto houver pendências.</Text>
              </div>
            )}

            {!jaEnviada && bloqueioSigilo && (
              <div className={c.bloqueio}>
                <Dismiss24Regular />
                <Text size={200}>
                  O envio fica bloqueado enquanto o desvio do sigilo do voto não for registrado.
                </Text>
              </div>
            )}
          </>
        )}
      </ConteudoPagina>

      <DialogoConfirmacao
        aberto={confirmarEnvio}
        aoFechar={() => setConfirmarEnvio(false)}
        titulo={`Enviar a Etapa ${etapa}?`}
        descricao="Após o envio, a edição fica bloqueada até o cartório validar. Confirme que as fotos e respostas estão corretas."
        rotuloConfirmar="Enviar etapa"
        carregando={enviando}
        aoConfirmar={enviar}
      />
    </>
  );
}
