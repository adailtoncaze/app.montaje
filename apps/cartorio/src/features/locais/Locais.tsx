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
import {
  CheckmarkCircle24Regular,
  Location24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import {
  Aviso,
  BarraProgresso,
  Campo,
  Cartao,
  EstadoVazio,
  Medalhao,
  Selo,
  pontoDesktop,
  pontoTablet,
} from '@montaje/ui';
import { useLocais, type LocalComSecoes } from '@/lib/dados';
import { ROTULO_SITUACAO, tomSituacao } from '@/lib/status-ui';

/** Filtro principal da lista, pelo que o cartório precisa enxergar. */
type Filtro = 'todas' | 'aguardando' | 'correcao' | 'nao_conformes' | 'concluidos';

const useClasses = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  resumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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

function CartaoLocal({ local }: { local: LocalComSecoes }) {
  const c = useClasses();
  const semLocal = local.id === 'sem-local';
  const temPendencia = local.aguardando > 0;
  const naoConforme = local.naoConformes > 0;

  const conteudo = (
    <Cartao
      clicavel={!semLocal}
      inicio={
        <Medalhao tom={tomSituacao(local.situacao)}>
          {local.situacao === 'concluida' ? <CheckmarkCircle24Regular /> : local.zona || '—'}
        </Medalhao>
      }
      titulo={local.nome}
      descricao={
        local.endereco?.trim()
          ? `${local.zona}ª zona · ${local.endereco}`
          : `${local.zona}ª zona`
      }
      acao={
        temPendencia ? (
          <Selo texto={`${local.aguardando} para validar`} tom="marca" />
        ) : (
          <Selo texto={ROTULO_SITUACAO[local.situacao]} tom={tomSituacao(local.situacao)} />
        )
      }
    >
      <div className={c.conteudo}>
        <div className={c.meta}>
          <Selo texto={`${local.totalSecoes} seção(ões)`} tom="neutro" />
          <Selo texto={`${local.concluidas} concluída(s)`} tom="neutro" />
          {naoConforme && (
            <Selo texto={`${local.naoConformes} não conforme`} tom="erro" />
          )}
        </div>

        {naoConforme && (
          <span className={c.naoConforme}>
            <Warning24Regular />
            <Text size={200} weight="semibold">
              Há seção com sigilo do voto não conforme
            </Text>
          </span>
        )}

        {local.totalSecoes > 0 && (
          <BarraProgresso
            concluidos={local.concluidas}
            total={local.totalSecoes}
            rotulo={`${local.concluidas} de ${local.totalSecoes} seções concluídas`}
          />
        )}

        {semLocal && <Aviso tom="alerta">Local não encontrado — confira o cadastro.</Aviso>}
      </div>
    </Cartao>
  );

  if (semLocal) return conteudo;

  return (
    <Link to={`/locais/${local.id}`} style={{ textDecorationLine: 'none', color: 'inherit' }}>
      {conteudo}
    </Link>
  );
}

export function Locais() {
  const c = useClasses();
  const { data, isLoading, error } = useLocais();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [soNaoConformes, setSoNaoConformes] = useState(false);

  const locais = data ?? [];

  const totais = useMemo(() => {
    return locais.reduce(
      (acc, local) => ({
        secoes: acc.secoes + local.totalSecoes,
        aguardando: acc.aguardando + local.aguardando,
        naoConformes: acc.naoConformes + local.naoConformes,
      }),
      { secoes: 0, aguardando: 0, naoConformes: 0 },
    );
  }, [locais]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return locais.filter((local) => {
      if (soNaoConformes && local.naoConformes === 0) return false;

      switch (filtro) {
        case 'aguardando':
          if (local.aguardando === 0) return false;
          break;
        case 'correcao':
          if (local.correcoes === 0) return false;
          break;
        case 'nao_conformes':
          if (local.naoConformes === 0) return false;
          break;
        case 'concluidos':
          if (local.situacao !== 'concluida') return false;
          break;
        default:
          break;
      }

      if (!termo) return true;
      const alvo = `${local.zona} ${local.nome} ${local.endereco ?? ''}`;
      return alvo.toLowerCase().includes(termo);
    });
  }, [locais, busca, filtro, soNaoConformes]);

  return (
    <div className={c.pagina}>
      <div>
        <Title2>Locais de votação</Title2>
        <Text block>
          O trabalho é acompanhado por local. Abra um local para ver as seções e validar as
          evidências.
        </Text>
      </div>

      <div className={c.resumo}>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{locais.length}</Text>
          <Text size={200}>Local(is)</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={c.numero}>{totais.secoes}</Text>
          <Text size={200}>Seções</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${c.destaque}`}>{totais.aguardando}</Text>
          <Text size={200}>Aguardando validação</Text>
        </Cartao>
        <Cartao clicavel={false} className={c.contador}>
          <Text className={`${c.numero} ${totais.naoConformes > 0 ? c.alerta : ''}`}>
            {totais.naoConformes}
          </Text>
          <Text size={200}>Sigilo não conforme</Text>
        </Cartao>
      </div>

      <div className={c.filtros}>
        <Campo
          rotulo="Buscar"
          placeholder="Zona, local ou endereço"
          value={busca}
          onChange={(_, d) => setBusca(d.value)}
        />
        <Dropdown
          aria-label="Filtrar locais"
          value={
            filtro === 'todas'
              ? 'Todos os locais'
              : {
                  aguardando: 'Aguardando validação',
                  correcao: 'Com correção solicitada',
                  nao_conformes: 'Com sigilo não conforme',
                  concluidos: 'Concluídos',
                }[filtro]
          }
          selectedOptions={[filtro]}
          onOptionSelect={(_, d) => setFiltro((d.optionValue as Filtro) ?? 'todas')}
        >
          <Option value="todas">Todos os locais</Option>
          <Option value="aguardando">Aguardando validação</Option>
          <Option value="correcao">Com correção solicitada</Option>
          <Option value="nao_conformes">Com sigilo não conforme</Option>
          <Option value="concluidos">Concluídos</Option>
        </Dropdown>
        <Checkbox
          label="Só sigilo não conforme"
          checked={soNaoConformes}
          onChange={(_, d) => setSoNaoConformes(Boolean(d.checked))}
        />
      </div>

      {isLoading && <Spinner label="Carregando locais..." />}

      {error && (
        <Aviso tom="erro" titulo="Não foi possível carregar os locais">
          {error instanceof Error ? error.message : 'Tente novamente.'}
        </Aviso>
      )}

      {!isLoading && !error && filtrados.length === 0 && (
        <EstadoVazio
          icone={<Location24Regular />}
          titulo={locais.length === 0 ? 'Nenhum local cadastrado' : 'Nenhum local encontrado'}
          descricao={
            locais.length === 0
              ? 'Cadastre os locais e o cronograma das equipes para começar.'
              : 'Ajuste a busca ou os filtros.'
          }
        />
      )}

      {!isLoading && filtrados.length > 0 && (
        <div className={c.lista}>
          {filtrados.map((local) => (
            <CartaoLocal key={local.id} local={local} />
          ))}
        </div>
      )}
    </div>
  );
}
