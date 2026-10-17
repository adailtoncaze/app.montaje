import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dropdown,
  Field,
  Option,
  Spinner,
  Tab,
  TabList,
  Text,
  Textarea,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Alert24Regular,
  ArrowLeft24Regular,
  Camera24Regular,
  CheckmarkCircle24Regular,
  Person24Regular,
} from '@fluentui/react-icons';
import { Aviso, Botao, Cartao, EstadoVazio, Medalhao, Selo, pontoTablet } from '@montaje/ui';
import {
  ROTULO_MOTIVO,
  ROTULO_STATUS_ETAPA,
  type Desvio,
  type Etapa,
  type Evidencia,
  type ItemChecklist,
  type StatusEtapa,
  type ValidacaoInput,
} from '@montaje/core';
import { useSecao, validarSecao, type SecaoDetalhe, type ValidacaoComAutor } from '@/lib/dados';
import { ROTULO_STATUS_ITEM, tomStatusEtapa, tomStatusItem } from '@/lib/status-ui';
import { useSessao } from '@/features/auth/store';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  voltar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: 'none',
    width: 'fit-content',
  },
  cabecalho: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  rotulo: {
    color: tokens.colorNeutralForeground3,
  },
  selos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  lista: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingVerticalM,
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
  itemCorpo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  foto: {
    width: '100%',
    maxHeight: '360px',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  acoes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  historico: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  linhaHistorico: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

function ItemAvaliacao({
  item,
  evidencias,
  desvio,
  urls,
}: {
  item: ItemChecklist;
  evidencias: Evidencia[];
  desvio: Desvio | null;
  urls: Record<string, string>;
}) {
  const c = useClasses();
  const evidencia = evidencias[0];
  const caminho = evidencia?.caminho_miniatura ?? evidencia?.caminho_foto ?? null;
  const url = caminho ? urls[caminho] : undefined;
  const tom = tomStatusItem(item.status);

  return (
    <Cartao
      inicio={
        <Medalhao tom={tom}>{item.foto_numero ?? <Camera24Regular />}</Medalhao>
      }
      titulo={item.nome}
      descricao={item.tipo === 'foto' ? 'Evidência fotográfica' : 'Confirmação'}
      acao={<Selo texto={ROTULO_STATUS_ITEM[item.status]} tom={tom} />}
    >
      <div className={c.itemCorpo}>
        {item.tipo === 'confirmacao' && (
          <Text size={300}>
            Resposta: <strong>{item.resposta == null ? 'não respondido' : item.resposta ? 'Sim' : 'Não'}</strong>
          </Text>
        )}

        {item.tipo === 'foto' &&
          (url ? (
            <img className={c.foto} src={url} alt={`Evidência do item ${item.nome}`} loading="lazy" />
          ) : (
            <Aviso tom="alerta">Foto não enviada.</Aviso>
          ))}

        {evidencia?.capturada_em && (
          <Text size={200} className={c.rotulo}>
            {new Date(evidencia.capturada_em).toLocaleString('pt-BR')}
            {evidencia.latitude != null && evidencia.longitude != null
              ? ` · ${evidencia.latitude.toFixed(5)}, ${evidencia.longitude.toFixed(5)}`
              : ''}
          </Text>
        )}

        {item.observacao && <Text size={200}>Obs.: {item.observacao}</Text>}

        {desvio && (
          <Aviso tom="alerta" titulo={`Desvio: ${ROTULO_MOTIVO[desvio.motivo]}`}>
            {desvio.observacao?.trim() || 'Sem observação.'}
          </Aviso>
        )}

        {!desvio && item.status === 'nao_conforme' && (
          <Aviso tom="alerta">Resposta "Não" sem desvio registrado.</Aviso>
        )}
      </div>
    </Cartao>
  );
}

function PainelValidacao({
  detalhe,
  etapa,
  status,
  conforme,
  validadorId,
  ultima,
  onValidado,
}: {
  detalhe: SecaoDetalhe;
  etapa: Etapa;
  status: StatusEtapa;
  conforme: boolean;
  validadorId: string;
  ultima: ValidacaoComAutor | null;
  onValidado: () => void;
}) {
  const c = useClasses();
  const [itemId, setItemId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const itensEtapa = useMemo(
    () => detalhe.itens.filter((item) => item.etapa === etapa),
    [detalhe.itens, etapa],
  );
  const nomeDoItem = (id: string | null) =>
    id ? itensEtapa.find((item) => item.id === id)?.nome ?? 'item removido' : '';

  async function registrar(novoStatus: 'aprovada' | 'correcao_solicitada') {
    setErro(null);
    setSucesso(null);

    if (novoStatus === 'aprovada' && !conforme) {
      return setErro(
        'Esta seção tem sigilo do voto não conforme (regra eliminatória). Use "Solicitar correção".',
      );
    }

    if (novoStatus === 'correcao_solicitada') {
      if (!itemId) return setErro('Selecione o item que deve ser corrigido.');
      if (!comentario.trim()) return setErro('Descreva o que a equipe precisa corrigir.');
    }

    const entrada: ValidacaoInput = {
      secao_id: detalhe.secao.id,
      etapa,
      status: novoStatus,
      item_devolvido: novoStatus === 'correcao_solicitada' ? itemId : null,
      comentario: novoStatus === 'correcao_solicitada' ? comentario.trim() : null,
    };

    setEnviando(true);
    try {
      await validarSecao(entrada, validadorId);
      setSucesso(
        novoStatus === 'aprovada'
          ? `Etapa ${etapa} aprovada.`
          : `Correção da Etapa ${etapa} solicitada à equipe.`,
      );
      setComentario('');
      setItemId(null);
      onValidado();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Falha ao registrar a validação.');
    } finally {
      setEnviando(false);
    }
  }

  if (status !== 'enviada') {
    if (status === 'aprovada') {
      return (
        <Aviso tom="sucesso" titulo={`Etapa ${etapa} aprovada`}>
          Nenhuma ação pendente nesta etapa.
        </Aviso>
      );
    }
    if (status === 'correcao_solicitada') {
      return (
        <Aviso tom="alerta" titulo={`Etapa ${etapa} devolvida para correção`}>
          {ultima?.comentario?.trim()
            ? `${nomeDoItem(ultima.item_devolvido)}: ${ultima.comentario}`
            : 'A equipe foi notificada para revisar esta etapa.'}
        </Aviso>
      );
    }
    return (
      <Aviso tom="info" titulo={`Etapa ${etapa} aguardando envio`}>
        A equipe de montagem ainda não enviou esta etapa para validação.
      </Aviso>
    );
  }

  return (
    <Cartao titulo={`Validação da Etapa ${etapa}`}>
      <div className={c.formulario}>
        <Text size={200} className={c.rotulo}>
          Revise as evidências acima antes de decidir. A aprovação libera a próxima etapa
          para a equipe.
        </Text>

        {erro && <Aviso tom="erro">{erro}</Aviso>}
        {sucesso && <Aviso tom="sucesso">{sucesso}</Aviso>}

        <Field label="Item a corrigir (obrigatório para devolução)">
          <Dropdown
            aria-label="Item a corrigir"
            placeholder="Selecione o item"
            selectedOptions={itemId ? [itemId] : []}
            value={nomeDoItem(itemId)}
            onOptionSelect={(_, d) => setItemId((d.optionValue as string) ?? null)}
          >
            {itensEtapa.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.nome}
              </Option>
            ))}
          </Dropdown>
        </Field>

        <Field label="Comentário (obrigatório para devolução)">
          <Textarea
            value={comentario}
            placeholder="Ex.: foto sem a urna de lona; repetir o enquadramento."
            resize="vertical"
            onChange={(_, d) => setComentario(d.value)}
          />
        </Field>

        <div className={c.acoes}>
          <Botao
            variante="primario"
            icon={<CheckmarkCircle24Regular />}
            carregando={enviando}
            disabled={!conforme}
            title={
              conforme
                ? undefined
                : 'Bloqueado: sigilo do voto não conforme (regra eliminatória).'
            }
            onClick={() => registrar('aprovada')}
          >
            Aprovar Etapa {etapa}
          </Botao>
          <Botao
            variante="perigo"
            icon={<Alert24Regular />}
            carregando={enviando}
            onClick={() => registrar('correcao_solicitada')}
          >
            Solicitar correção
          </Botao>
        </div>

        {!conforme && (
          <Aviso tom="alerta">
            A aprovação está bloqueada enquanto houver sigilo do voto não conforme. Registre a
            correção informando o item de sigilo.
          </Aviso>
        )}
      </div>
    </Cartao>
  );
}

function Historico({ validacoes, itens }: { validacoes: ValidacaoComAutor[]; itens: ItemChecklist[] }) {
  const c = useClasses();
  if (!validacoes.length) return null;

  const nomeDoItem = (id: string | null) =>
    id ? itens.find((item) => item.id === id)?.nome ?? 'item removido' : '';

  return (
    <Cartao titulo="Histórico de validações">
      <div className={c.historico}>
        {validacoes.map((v) => (
          <div key={v.id} className={c.linhaHistorico}>
            <div className={c.selos}>
              <Selo
                texto={`Etapa ${v.etapa}: ${ROTULO_STATUS_ETAPA[v.status]}`}
                tom={v.status === 'aprovada' ? 'ok' : 'erro'}
              />
              <Text size={200} className={c.rotulo}>
                {new Date(v.data).toLocaleString('pt-BR')}
              </Text>
            </div>
            <Text size={200}>
              <Person24Regular /> {v.validadorNome ?? 'Validador'}
            </Text>
            {v.item_devolvido && (
              <Text size={200}>Item devolvido: {nomeDoItem(v.item_devolvido)}</Text>
            )}
            {v.comentario && <Text size={200}>{v.comentario}</Text>}
          </div>
        ))}
      </div>
    </Cartao>
  );
}

export function SecaoDetalhe() {
  const c = useClasses();
  const { secaoId = '' } = useParams();
  const perfil = useSessao((s) => s.perfil);
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState<Etapa>(1);

  const { data, isLoading, error } = useSecao(secaoId);

  if (isLoading) return <Spinner label="Carregando seção..." />;

  if (error || !data) {
    return (
      <div className={c.pagina}>
        <Link to="/secoes" className={c.voltar}>
          <ArrowLeft24Regular /> Voltar
        </Link>
        <Aviso tom="erro" titulo="Não foi possível carregar a seção">
          {error instanceof Error ? error.message : 'Seção não encontrada.'}
        </Aviso>
      </div>
    );
  }

  const { secao, itens, evidenciasPorItem, desvioPorItem, urls, validacoes, sigilo, equipes } = data;
  const local = secao.local;
  const statusEtapa = etapa === 1 ? secao.status_etapa1 : secao.status_etapa2;
  const itensEtapa = itens.filter((item) => item.etapa === etapa);
  const ultimaDaEtapa = validacoes.find((v) => v.etapa === etapa) ?? null;
  const sigiloDaEtapa = etapa === 2 ? sigilo : [];

  function recarregar() {
    void queryClient.invalidateQueries({ queryKey: ['secao', secaoId] });
    void queryClient.invalidateQueries({ queryKey: ['secoes'] });
  }

  return (
    <div className={c.pagina}>
      <Link to="/secoes" className={c.voltar}>
        <ArrowLeft24Regular /> Voltar às seções
      </Link>

      <div className={c.cabecalho}>
        <Title3>
          Seção {secao.numero}
          {local ? ` · ${local.zona}ª zona` : ''}
        </Title3>
        <Text className={c.rotulo}>{local?.nome ?? 'Local não identificado'}</Text>
        {equipes.length > 0 && (
          <Text size={200} className={c.rotulo}>
            Equipe(s): {equipes.join(', ')}
          </Text>
        )}
        <div className={c.selos}>
          <Selo
            texto={`Etapa 1: ${ROTULO_STATUS_ETAPA[secao.status_etapa1]}`}
            tom={tomStatusEtapa(secao.status_etapa1)}
          />
          <Selo
            texto={`Etapa 2: ${ROTULO_STATUS_ETAPA[secao.status_etapa2]}`}
            tom={tomStatusEtapa(secao.status_etapa2)}
          />
          <Selo texto={secao.conforme ? 'Conforme' : 'Sigilo não conforme'} tom={secao.conforme ? 'ok' : 'erro'} />
        </div>
      </div>

      {!secao.conforme && (
        <Aviso tom="erro" titulo="Sigilo do voto não conforme (eliminatório)">
          A seção tem ao menos uma resposta de sigilo "Não". Não pode ser aprovada antes da
          correção, conforme a regra 1 do PRD.
        </Aviso>
      )}

      <TabList
        selectedValue={String(etapa)}
        onTabSelect={(_, d) => setEtapa(Number(d.value) as Etapa)}
      >
        <Tab value="1">Etapa 1 · Montagem</Tab>
        <Tab value="2">Etapa 2 · Sigilo do voto</Tab>
      </TabList>

      {itensEtapa.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum item nesta etapa"
          descricao="Os itens são materializados quando o cronograma do local é criado."
        />
      ) : (
        <div className={c.lista}>
          {itensEtapa.map((item) => (
            <ItemAvaliacao
              key={item.id}
              item={item}
              evidencias={evidenciasPorItem[item.id] ?? []}
              desvio={desvioPorItem[item.id] ?? null}
              urls={urls}
            />
          ))}
        </div>
      )}

      {sigiloDaEtapa.length > 0 && (
        <Cartao titulo="Respostas de sigilo">
          <div className={c.itemCorpo}>
            {sigiloDaEtapa.map((s) => (
              <Text key={s.id} size={200}>
                {s.pergunta}: <strong>{s.resposta == null ? 'não respondido' : s.resposta ? 'Sim' : 'Não'}</strong>
              </Text>
            ))}
          </div>
        </Cartao>
      )}

      {perfil && (
        <PainelValidacao
          detalhe={data}
          etapa={etapa}
          status={statusEtapa}
          conforme={secao.conforme}
          validadorId={perfil.id}
          ultima={ultimaDaEtapa}
          onValidado={recarregar}
        />
      )}

      <Historico validacoes={validacoes} itens={itens} />
    </div>
  );
}
