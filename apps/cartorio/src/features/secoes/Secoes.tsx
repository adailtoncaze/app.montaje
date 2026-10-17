import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Checkbox,
  Dropdown,
  Option,
  Spinner,
  Text,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ClipboardTaskListLtr24Regular } from '@fluentui/react-icons';
import { Aviso, Campo, Cartao, EstadoVazio, Medalhao, Selo, pontoTablet } from '@montaje/ui';
import { ROTULO_STATUS_ETAPA, type StatusEtapa } from '@montaje/core';
import { useSecoes, type SecaoResumo } from '@/lib/dados';
import { prioridadeStatus, tomStatusEtapa } from '@/lib/status-ui';

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
    gap: tokens.spacingVerticalM,
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
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
    },
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
  },
});

function CartaoSecao({ secao }: { secao: SecaoResumo }) {
  const c = useClasses();
  const local = secao.local;
  const semLocal = !local;
  const naoConforme = !secao.conforme;

  return (
    <Link to={`/secoes/${secao.id}`} style={{ textDecorationLine: 'none', color: 'inherit' }}>
      <Cartao
        clicavel
        inicio={<Medalhao tom={naoConforme ? 'erro' : 'marca'}>{secao.numero}</Medalhao>}
        titulo={`Seção ${secao.numero}`}
        descricao={local ? `${local.zona}ª zona · ${local.nome}` : 'Local não identificado'}
        acao={
          <>
            <Selo
              texto={`E1: ${ROTULO_STATUS_ETAPA[secao.status_etapa1]}`}
              tom={tomStatusEtapa(secao.status_etapa1)}
            />
            {naoConforme && <Selo texto="Sigilo" tom="erro" />}
          </>
        }
      >
        <div className={c.meta}>
          <Text size={200}>Etapa 2: {ROTULO_STATUS_ETAPA[secao.status_etapa2]}</Text>
          <Text size={200}>
            {secao.itensConcluidos}/{secao.totalItens} itens
          </Text>
          <Text size={200}>{secao.fotos} foto(s)</Text>
        </div>
        {semLocal && (
          <Aviso tom="alerta">Local não encontrado — confira o cadastro.</Aviso>
        )}
      </Cartao>
    </Link>
  );
}

export function Secoes() {
  const c = useClasses();
  const { data, isLoading, error } = useSecoes();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusEtapa | 'todas'>('todas');
  const [soNaoConformes, setSoNaoConformes] = useState(false);

  const secoes = data ?? [];

  const resumo = useMemo(() => {
    const contagem = new Map<StatusEtapa, number>();
    for (const secao of secoes) {
      contagem.set(secao.status_etapa1, (contagem.get(secao.status_etapa1) ?? 0) + 1);
    }
    return STATUS.map((status) => ({ status, total: contagem.get(status) ?? 0 }));
  }, [secoes]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return secoes
      .filter((secao) => {
        if (filtroStatus !== 'todas' && secao.status_etapa1 !== filtroStatus) return false;
        if (soNaoConformes && secao.conforme) return false;
        if (!termo) return true;
        const alvo = `${secao.numero} ${secao.local?.zona ?? ''} ${secao.local?.nome ?? ''}`;
        return alvo.toLowerCase().includes(termo);
      })
      .sort(
        (a, b) =>
          prioridadeStatus(a.status_etapa1) - prioridadeStatus(b.status_etapa1) ||
          (a.local?.zona ?? 0) - (b.local?.zona ?? 0) ||
          a.numero - b.numero,
      );
  }, [secoes, busca, filtroStatus, soNaoConformes]);

  return (
    <div className={c.pagina}>
      <Title2>Seções</Title2>
      <Text>
        Acompanhe as duas etapas, valide as evidências da Etapa 1 e devolva com correção
        quando necessário.
      </Text>

      <div className={c.resumo}>
        {resumo.map(({ status, total }) => (
          <Cartao key={status} clicavel={false} className={c.contador}>
            <Text className={c.numero}>{total}</Text>
            <Text size={200}>{ROTULO_STATUS_ETAPA[status]} (E1)</Text>
          </Cartao>
        ))}
      </div>

      <div className={c.filtros}>
        <Campo
          rotulo="Buscar"
          placeholder="Zona, local ou número da seção"
          value={busca}
          onChange={(_, d) => setBusca(d.value)}
        />
        <Dropdown
          aria-label="Filtrar por status da Etapa 1"
          placeholder="Status da Etapa 1"
          value={filtroStatus === 'todas' ? 'Todas as etapas' : ROTULO_STATUS_ETAPA[filtroStatus]}
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

      {isLoading && <Spinner label="Carregando seções..." />}

      {error && (
        <Aviso tom="erro" titulo="Não foi possível carregar as seções">
          {error instanceof Error ? error.message : 'Tente novamente.'}
        </Aviso>
      )}

      {!isLoading && !error && filtradas.length === 0 && (
        <EstadoVazio
          icone={<ClipboardTaskListLtr24Regular />}
          titulo="Nenhuma seção encontrada"
          descricao="Ajuste os filtros ou aguarde o envio das equipes."
        />
      )}

      {!isLoading && filtradas.length > 0 && (
        <div className={c.lista}>
          {filtradas.map((secao) => (
            <CartaoSecao key={secao.id} secao={secao} />
          ))}
        </div>
      )}
    </div>
  );
}
