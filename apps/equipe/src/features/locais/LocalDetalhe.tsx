import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { ROTULO_STATUS_ETAPA, type Etapa } from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';
import {
  BarraProgresso,
  CabecalhoApp,
  Cartao,
  ConteudoPagina,
  EsqueletoLista,
  EstadoVazio,
  Medalhao,
  Selo,
  pontoDesktop,
  pontoTablet,
} from '@montaje/ui';
import { db } from '@/db/schema';
import { tomStatusEtapa } from '@/lib/status-ui';

const useClasses = makeStyles({
  endereco: {
    color: tokens.colorNeutralForeground3,
  },
  contadores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: tokens.spacingHorizontalS,
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
    fontSize: '28px',
    lineHeight: '32px',
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  numeroOk: {
    color: tokens.colorPaletteGreenForeground1,
  },
  numeroErro: {
    color: tokens.colorPaletteRedForeground1,
  },
  agenda: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  agendaRotulo: {
    color: tokens.colorNeutralForeground3,
  },
  lista: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: tokens.spacingHorizontalL,
    },
    [`@media ${pontoDesktop}`]: {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
  },
  conteudo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  linha: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  naoConforme: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorPaletteRedForeground1,
  },
});

export function LocalDetalhe() {
  const c = useClasses();
  const navigate = useNavigate();
  const { localId = '' } = useParams();

  const local = useLiveQuery(() => db.locais.get(localId), [localId]);
  const secoes = useLiveQuery(
    () => db.secoes.where('local_id').equals(localId).toArray(),
    [localId],
  );
  const itens = useLiveQuery(() => db.itens.toArray(), [], []);
  const cronograma = useLiveQuery(
    () => db.cronograma.where('local_id').equals(localId).toArray(),
    [localId],
    [],
  );

  const carregando = local === undefined || secoes === undefined;
  const listaSecoes = secoes ?? [];

  function progresso(secaoId: string, etapa: Etapa) {
    const daEtapa = itens.filter((i) => i.secao_id === secaoId && i.etapa === etapa);
    return {
      concluidos: daEtapa.filter((i) => i.status !== 'pendente').length,
      total: daEtapa.length,
    };
  }

  const aprovadas = listaSecoes.filter(
    (s) => s.status_etapa1 === 'aprovada' && s.status_etapa2 === 'aprovada',
  ).length;
  const naoConformes = listaSecoes.filter((s) => !s.conforme).length;

  const dias = [...cronograma].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <>
      <CabecalhoApp
        titulo={local?.nome ?? 'Local'}
        subtitulo={local ? `Zona ${local.zona}` : undefined}
        aoVoltar={() => navigate('/locais')}
      />

      <ConteudoPagina>
        {local?.endereco && <Text className={c.endereco}>{local.endereco}</Text>}

        {!carregando && listaSecoes.length > 0 && (
          <div className={c.contadores}>
            <Cartao className={c.contador}>
              <Text className={c.numero}>{listaSecoes.length}</Text>
              <Text size={200} className={c.rotulo}>
                Seção(ões)
              </Text>
            </Cartao>
            <Cartao className={c.contador}>
              <Text className={`${c.numero} ${c.numeroOk}`}>{aprovadas}</Text>
              <Text size={200} className={c.rotulo}>
                Aprovada(s)
              </Text>
            </Cartao>
            <Cartao className={c.contador}>
              <Text
                className={`${c.numero} ${naoConformes > 0 ? c.numeroErro : ''}`}
              >
                {naoConformes}
              </Text>
              <Text size={200} className={c.rotulo}>
                Não conforme(s)
              </Text>
            </Cartao>
          </div>
        )}

        {dias.length > 0 && (
          <div className={c.agenda}>
            <Text size={200} className={c.agendaRotulo}>
              Programado em:
            </Text>
            {dias.map((d) => (
              <Selo
                key={d.id}
                texto={`Etapa ${d.etapa} · ${new Date(`${d.data}T00:00:00`).toLocaleDateString(
                  'pt-BR',
                  { day: '2-digit', month: '2-digit' },
                )}`}
                tom="neutro"
              />
            ))}
          </div>
        )}

        {carregando ? (
          <EsqueletoLista itens={4} />
        ) : listaSecoes.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma seção neste local"
            descricao="As seções deste local ainda não foram baixadas. Use 'Baixar dados do dia' em Ajustes."
          />
        ) : (
          <div className={c.lista}>
            {listaSecoes
              .slice()
              .sort((a, b) => a.numero - b.numero)
              .map((s) => {
                const e1 = progresso(s.id, 1);
                const e2 = progresso(s.id, 2);
                const concluida =
                  s.status_etapa1 === 'aprovada' && s.status_etapa2 === 'aprovada';

                return (
                  <Cartao
                    key={s.id}
                    clicavel
                    onClick={() => navigate(`/locais/${localId}/secoes/${s.id}`)}
                    inicio={
                      <Medalhao tom={concluida ? 'ok' : 'marca'}>{s.numero}</Medalhao>
                    }
                    titulo={`Seção ${s.numero}`}
                    descricao={concluida ? 'Montagem aprovada' : 'Toque para abrir as etapas'}
                  >
                    <div className={c.conteudo}>
                      {!s.conforme && (
                        <span className={c.naoConforme}>
                          <Warning24Regular />
                          <Text size={200} weight="semibold">
                            Não conforme no sigilo
                          </Text>
                        </span>
                      )}

                      <div className={c.linha}>
                        <Text size={200} className={c.rotulo}>
                          Etapa 1
                        </Text>
                        <Selo
                          texto={ROTULO_STATUS_ETAPA[s.status_etapa1]}
                          tom={tomStatusEtapa(s.status_etapa1)}
                        />
                      </div>
                      {e1.total > 0 && (
                        <BarraProgresso
                          concluidos={e1.concluidos}
                          total={e1.total}
                          rotulo={`Etapa 1 · ${e1.concluidos} de ${e1.total} itens`}
                        />
                      )}

                      <div className={c.linha}>
                        <Text size={200} className={c.rotulo}>
                          Etapa 2
                        </Text>
                        <Selo
                          texto={ROTULO_STATUS_ETAPA[s.status_etapa2]}
                          tom={tomStatusEtapa(s.status_etapa2)}
                        />
                      </div>
                      {e2.total > 0 && (
                        <BarraProgresso
                          concluidos={e2.concluidos}
                          total={e2.total}
                          rotulo={`Etapa 2 · ${e2.concluidos} de ${e2.total} itens`}
                        />
                      )}
                    </div>
                  </Cartao>
                );
              })}
          </div>
        )}
      </ConteudoPagina>
    </>
  );
}
