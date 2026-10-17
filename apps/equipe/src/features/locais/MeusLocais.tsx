import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import type { Etapa, Local, Secao } from '@montaje/core';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  Location24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
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
import { useSessao } from '@/features/auth/store';
import { FaixaInstalar } from '@/features/pwa/FaixaInstalar';

const useClasses = makeStyles({
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
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  naoConforme: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorPaletteRedForeground1,
  },
});

export function MeusLocais() {
  const c = useClasses();
  const navigate = useNavigate();
  const perfil = useSessao((s) => s.perfil);

  // Sem valor padrão na primeira consulta: `undefined` representa "ainda carregando".
  const locais = useLiveQuery(() => db.locais.toArray(), []);
  const cronograma = useLiveQuery(() => db.cronograma.toArray(), [], []);
  const secoes = useLiveQuery(() => db.secoes.toArray(), [], []);
  const itens = useLiveQuery(() => db.itens.toArray(), [], []);

  const carregando = locais === undefined;
  const localPorId = new Map((locais ?? []).map((l) => [l.id, l]));
  const secoesPorLocal = new Map<string, Secao[]>();
  for (const s of secoes) {
    const lista = secoesPorLocal.get(s.local_id) ?? [];
    lista.push(s);
    secoesPorLocal.set(s.local_id, lista);
  }

  // Um único item por local definido no cronograma da equipe.
  const agrupado = new Map<string, { local: Local; primeiraData: string; ordem: number }>();
  for (const linha of cronograma) {
    const local = localPorId.get(linha.local_id);
    if (!local) continue;
    const atual = agrupado.get(local.id);
    const candidato = { data: linha.data, ordem: linha.ordem ?? 999 };
    if (!atual) {
      agrupado.set(local.id, {
        local,
        primeiraData: candidato.data,
        ordem: candidato.ordem,
      });
      continue;
    }
    if (
      candidato.data < atual.primeiraData ||
      (candidato.data === atual.primeiraData && candidato.ordem < atual.ordem)
    ) {
      atual.primeiraData = candidato.data;
      atual.ordem = candidato.ordem;
    }
  }

  const lista = [...agrupado.values()].sort(
    (a, b) =>
      a.primeiraData.localeCompare(b.primeiraData) ||
      a.ordem - b.ordem ||
      a.local.nome.localeCompare(b.local.nome),
  );

  function progresso(localId: string, etapa: Etapa) {
    const ids = new Set((secoesPorLocal.get(localId) ?? []).map((s) => s.id));
    const daEtapa = itens.filter((i) => ids.has(i.secao_id) && i.etapa === etapa);
    return {
      concluidos: daEtapa.filter((i) => i.status !== 'pendente').length,
      total: daEtapa.length,
    };
  }

  return (
    <>
      <CabecalhoApp
        titulo="Locais de votação"
        subtitulo={perfil?.nome ?? 'Locais da equipe'}
      />

      <ConteudoPagina>
        <FaixaInstalar />

        {carregando ? (
          <EsqueletoLista itens={4} />
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={<Location24Regular />}
            titulo="Nenhum local definido"
            descricao='Vá em "Ajustes" e use "Baixar dados do dia". Se continuar vazio, o cartório ainda não definiu o cronograma da sua equipe.'
          />
        ) : (
          <div className={c.lista}>
            {lista.map(({ local }) => {
              const doLocal = secoesPorLocal.get(local.id) ?? [];
              const e1 = progresso(local.id, 1);
              const e2 = progresso(local.id, 2);
              const naoConforme = doLocal.some((s) => !s.conforme);
              const concluido =
                doLocal.length > 0 &&
                doLocal.every(
                  (s) => s.status_etapa1 === 'aprovada' && s.status_etapa2 === 'aprovada',
                );

              return (
                <Cartao
                  key={local.id}
                  clicavel
                  onClick={() => navigate(`/locais/${local.id}`)}
                  inicio={
                    <Medalhao tom={concluido ? 'ok' : 'marca'}>
                      {concluido ? <CheckmarkCircle24Regular /> : <Location24Regular />}
                    </Medalhao>
                  }
                  titulo={local.nome}
                  descricao={local.endereco ?? `Zona ${local.zona}`}
                  acao={
                    <Selo
                      texto={concluido ? 'Concluído' : `${doLocal.length} seção(ões)`}
                      tom={concluido ? 'ok' : 'neutro'}
                    />
                  }
                >
                  <div className={c.conteudo}>
                    <div className={c.meta}>
                      <Selo texto={`Zona ${local.zona}`} tom="marca" />
                      {concluido && <Selo texto="Tudo aprovado" tom="ok" />}
                    </div>

                    {naoConforme && (
                      <span className={c.naoConforme}>
                        <Warning24Regular />
                        <Text size={200} weight="semibold">
                          Há seção não conforme no sigilo
                        </Text>
                      </span>
                    )}

                    {e1.total > 0 && (
                      <BarraProgresso
                        concluidos={e1.concluidos}
                        total={e1.total}
                        rotulo={`Etapa 1 · ${e1.concluidos} de ${e1.total} itens`}
                      />
                    )}
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
