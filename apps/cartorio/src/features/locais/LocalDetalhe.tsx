import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Checkbox,
  Dropdown,
  Option,
  Spinner,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowLeft24Regular, Warning24Regular } from '@fluentui/react-icons';
import {
  Aviso,
  BarraProgresso,
  Campo,
  Cartao,
  EstadoVazio,
  Medalhao,
  Selo,
  pontoTablet,
} from '@montaje/ui';
import { ROTULO_STATUS_ETAPA, type StatusEtapa } from '@montaje/core';
import { useLocais, type SecaoResumo } from '@/lib/dados';
import {
  ROTULO_SITUACAO,
  situacaoSecao,
  tomSituacao,
  tomStatusEtapa,
} from '@/lib/status-ui';

const STATUS: StatusEtapa[] = [
  'pendente',
  'em_montagem',
  'enviada',
  'aprovada',
  'correcao_solicitada',
];

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
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
    marginTop: tokens.spacingVerticalXS,
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  contador: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
  },
  numero: {
    fontSize: '24px',
    lineHeight: '28px',
    fontWeight: tokens.fontWeightBold,
  },
  destaque: {
    color: tokens.colorBrandForeground1,
  },
  alerta: {
    color: tokens.colorPaletteRedForeground1,
  },
  filtros: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    [`@media ${pontoTablet}`]: {
      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto',
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
  conteudo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  naoConforme: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorPaletteRedForeground1,
  },
});

function CartaoSecao({ secao }: { secao: SecaoResumo }) {
  const c = useClasses();
  const situacao = situacaoSecao(secao);
  const naoConforme = !secao.conforme;

  return (
    <Link to={`/locais/${secao.local_id}/secoes/${secao.id}`} style={{ textDecorationLine: 'none', color: 'inherit' }}>
      <Cartao
        clicavel
        inicio={<Medalhao tom={tomSituacao(situacao)}>{secao.numero}</Medalhao>}
        titulo={`Seção ${secao.numero}`}
        descricao={`${secao.itensConcluidos}/${secao.totalItens} itens · ${secao.fotos} foto(s)`}
        acao={<Selo texto={ROTULO_SITUACAO[situacao]} tom={tomSituacao(situacao)} />}
      >
        <div className={c.conteudo}>
          <div className={c.meta}>
            <Selo
              texto={`E1: ${ROTULO_STATUS_ETAPA[secao.status_etapa1]}`}
              tom={tomStatusEtapa(secao.status_etapa1)}
            />
            <Selo
              texto={`E2: ${ROTULO_STATUS_ETAPA[secao.status_etapa2]}`}
              tom={tomStatusEtapa(secao.status_etapa2)}
            />
          </div>

          {naoConforme && (
            <span className={c.naoConforme}>
              <Warning24Regular />
              <Text size={200} weight="semibold">
                Sigilo do voto não conforme
              </Text>
            </span>
          )}

          {secao.totalItens > 0 && (
            <BarraProgresso concluidos={secao.itensConcluidos} total={secao.totalItens} />
          )}
        </div>
      </Cartao>
    </Link>
  );
}

export function LocalDetalhe() {
  const c = useClasses();
  const { localId = '' } = useParams();
  const { data, isLoading, error } = useLocais();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusEtapa | 'todas'>('todas');
  const [soNaoConformes, setSoNaoConformes] = useState(false);

  const local = useMemo(() => data?.find((l) => l.id === localId), [data, localId]);

  const filtradas = useMemo(() => {
    const secoes = local?.secoes ?? [];
    const termo = busca.trim();
    return secoes.filter((secao) => {
      if (filtroStatus !== 'todas' && secao.status_etapa1 !== filtroStatus) return false;
      if (soNaoConformes && secao.conforme) return false;
      if (!termo) return true;
      return String(secao.numero).includes(termo);
    });
  }, [local, busca, filtroStatus, soNaoConformes]);

  if (isLoading) return <Spinner label="Carregando local..." />;

  if (error || !local) {
    return (
      <div className={c.pagina}>
        <Link to="/locais" className={c.voltar}>
          <ArrowLeft24Regular /> Voltar aos locais
        </Link>
        <Aviso tom="erro" titulo="Não foi possível carregar o local">
          {error instanceof Error ? error.message : 'Local não encontrado.'}
        </Aviso>
      </div>
    );
  }

  return (
    <div className={c.pagina}>
      <Link to="/locais" className={c.voltar}>
        <ArrowLeft24Regular /> Voltar aos locais
      </Link>

      <div className={c.cabecalho}>
        <Title3>{local.nome}</Title3>
        <Text className={c.rotulo}>
          {local.zona}ª zona
          {local.endereco?.trim() ? ` · ${local.endereco}` : ''}
        </Text>
        <div className={c.selos}>
          <Selo texto={ROTULO_SITUACAO[local.situacao]} tom={tomSituacao(local.situacao)} />
          <Selo texto={`${local.totalSecoes} seção(ões)`} tom="neutro" />
          {local.naoConformes > 0 && (
            <Selo texto={`${local.naoConformes} não conforme`} tom="erro" />
          )}
        </div>
      </div>

      {local.naoConformes > 0 && (
        <Aviso tom="erro" titulo="Sigilo do voto não conforme (eliminatório)">
          Há seção(ões) com resposta de sigilo "Não". Elas não podem ser aprovadas antes da
          correção, conforme a regra 1 do PRD.
        </Aviso>
      )}

      <div className={c.resumo}>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{local.totalSecoes}</Text>
          <Text size={200}>Seções</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${local.aguardando > 0 ? c.destaque : ''}`}>
            {local.aguardando}
          </Text>
          <Text size={200}>Aguardando validação</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${local.correcoes > 0 ? c.alerta : ''}`}>
            {local.correcoes}
          </Text>
          <Text size={200}>Com correção</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{local.concluidas}</Text>
          <Text size={200}>Concluídas</Text>
        </Cartao>
      </div>

      <div className={c.filtros}>
        <Campo
          rotulo="Buscar seção"
          placeholder="Número da seção"
          inputMode="numeric"
          value={busca}
          onChange={(_, d) => setBusca(d.value)}
        />
        <Dropdown
          aria-label="Filtrar por status da Etapa 1"
          placeholder="Status da Etapa 1"
          value={
            filtroStatus === 'todas'
              ? 'Todas as etapas'
              : ROTULO_STATUS_ETAPA[filtroStatus]
          }
          selectedOptions={[filtroStatus]}
          onOptionSelect={(_, d) =>
            setFiltroStatus((d.optionValue as StatusEtapa | 'todas') ?? 'todas')
          }
        >
          <Option value="todas">Todas as etapas</Option>
          {STATUS.map((status) => (
            <Option key={status} value={status}>
              {ROTULO_STATUS_ETAPA[status]}
            </Option>
          ))}
        </Dropdown>
        <Checkbox
          label="Só sigilo não conforme"
          checked={soNaoConformes}
          onChange={(_, d) => setSoNaoConformes(Boolean(d.checked))}
        />
      </div>

      {filtradas.length === 0 ? (
        <EstadoVazio
          titulo={
            local.totalSecoes === 0 ? 'Nenhuma seção neste local' : 'Nenhuma seção encontrada'
          }
          descricao={
            local.totalSecoes === 0
              ? 'As seções são criadas quando o cronograma do local é montado.'
              : 'Ajuste a busca ou os filtros.'
          }
        />
      ) : (
        <div className={c.lista}>
          {filtradas.map((secao) => (
            <CartaoSecao key={secao.id} secao={secao} />
          ))}
        </div>
      )}
    </div>
  );
}
