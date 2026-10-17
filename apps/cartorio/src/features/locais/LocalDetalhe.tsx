import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CircleCheck,
  Clock,
  ClipboardList,
  RefreshCw,
  Search,
  ShieldAlert,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Medalhao } from '@/components/medalhao';
import { PageHeader } from '@/components/page-header';
import { Progresso } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { ROTULO_STATUS_ETAPA, type StatusEtapa } from '@montaje/core';
import { useAvisoErro } from '@/lib/avisos';
import { useLocais, type SecaoResumo } from '@/lib/dados';
import {
  classeAcento,
  ROTULO_SITUACAO,
  situacaoSecao,
  tomSituacao,
  tomStatusEtapa,
} from '@/lib/status-ui';
import { cn } from '@/lib/utils';

const STATUS: StatusEtapa[] = [
  'pendente',
  'em_montagem',
  'enviada',
  'aprovada',
  'correcao_solicitada',
];

function CartaoSecao({ secao }: { secao: SecaoResumo }) {
  const situacao = situacaoSecao(secao);
  const naoConforme = !secao.conforme;
  const tom = tomSituacao(situacao);

  return (
    <Link
      to={`/locais/${secao.local_id}/secoes/${secao.id}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full overflow-hidden transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-teams-8">
        <span aria-hidden className={cn('h-1 w-full shrink-0', classeAcento(tom))} />
        <CardHeader>
          <div className="flex min-w-0 items-start gap-3">
            <Medalhao tom={tom}>{secao.numero}</Medalhao>
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle>Seção {secao.numero}</CardTitle>
              <CardDescription>
                {secao.itensConcluidos}/{secao.totalItens} itens · {secao.fotos} foto(s)
              </CardDescription>
            </div>
          </div>
          <Badge variant={tom}>{ROTULO_SITUACAO[situacao]}</Badge>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={tomStatusEtapa(secao.status_etapa1)}>
              E1: {ROTULO_STATUS_ETAPA[secao.status_etapa1]}
            </Badge>
            <Badge variant={tomStatusEtapa(secao.status_etapa2)}>
              E2: {ROTULO_STATUS_ETAPA[secao.status_etapa2]}
            </Badge>
          </div>

          {naoConforme && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger">
              <TriangleAlert className="size-3.5" />
              Sigilo do voto não conforme
            </p>
          )}

          {secao.totalItens > 0 && (
            <Progresso concluidos={secao.itensConcluidos} total={secao.totalItens} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function EsqueletoDetalhe() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function LocalDetalhe() {
  const { localId = '' } = useParams();
  const { data, isLoading, error, refetch, isFetching } = useLocais();
  useAvisoErro(error);

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

  if (isLoading) return <EsqueletoDetalhe />;

  if (error || !local) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader titulo="Local de votação" />
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar o local</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Local não encontrado.'}
            </AlertDescription>
          </div>
        </Alert>
        <Button variant="outline" className="w-fit" asChild>
          <Link to="/locais">Voltar aos locais</Link>
        </Button>
      </div>
    );
  }

  const filtrosAtivos = busca.trim() !== '' || filtroStatus !== 'todas' || soNaoConformes;

  function limparFiltros() {
    setBusca('');
    setFiltroStatus('todas');
    setSoNaoConformes(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={local.nome}
        descricao={
          <>
            {local.zona}ª zona{local.endereco?.trim() ? ` · ${local.endereco}` : ''}
          </>
        }
        acoes={
          <>
            <Badge variant={tomSituacao(local.situacao)}>{ROTULO_SITUACAO[local.situacao]}</Badge>
            <Badge variant="secondary">{local.totalSecoes} seção(ões)</Badge>
            {local.naoConformes > 0 && (
              <Badge variant="danger">{local.naoConformes} não conforme</Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  aria-label="Atualizar dados do local"
                >
                  <RefreshCw className={cn(isFetching && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recarregar os dados do servidor</TooltipContent>
            </Tooltip>
          </>
        }
      />

      {local.naoConformes > 0 && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Sigilo do voto não conforme (eliminatório)</AlertTitle>
            <AlertDescription>
              Há seção(ões) com resposta de sigilo "Não". Elas não podem ser aprovadas antes da
              correção, conforme a regra 1 do PRD.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard valor={local.totalSecoes} rotulo="Seções" icone={ClipboardList} />
        <StatCard
          valor={local.aguardando}
          rotulo="Aguardando validação"
          icone={Clock}
          tom={local.aguardando > 0 ? 'marca' : 'neutro'}
        />
        <StatCard
          valor={local.correcoes}
          rotulo="Com correção"
          icone={TriangleAlert}
          tom={local.correcoes > 0 ? 'erro' : 'neutro'}
        />
        <StatCard
          valor={local.naoConformes}
          rotulo="Sigilo não conforme"
          icone={ShieldAlert}
          tom={local.naoConformes > 0 ? 'erro' : 'neutro'}
        />
        <StatCard
          valor={local.concluidas}
          rotulo="Concluídas"
          icone={CircleCheck}
          tom="sucesso"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="busca-secao" className="sr-only">
                Buscar seção
              </Label>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="busca-secao"
                className="pl-9 pr-9"
                inputMode="numeric"
                placeholder="Número da seção"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setBusca('')}
                  className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="lg:w-60">
              <Label htmlFor="filtro-status" className="sr-only">
                Filtrar por status da Etapa 1
              </Label>
              <Select
                value={filtroStatus}
                onValueChange={(v) => setFiltroStatus(v as StatusEtapa | 'todas')}
              >
                <SelectTrigger id="filtro-status" aria-label="Filtrar por status da Etapa 1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as etapas</SelectItem>
                  {STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ROTULO_STATUS_ETAPA[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              aria-pressed={soNaoConformes}
              onClick={() => setSoNaoConformes((v) => !v)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                soNaoConformes
                  ? 'border-danger-border bg-danger-bg text-danger'
                  : 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <ShieldAlert className="size-4" />
              Só sigilo não conforme
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Mostrando{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {filtradas.length}
              </span>{' '}
              de <span className="tabular-nums">{local.totalSecoes}</span> seções
            </span>
            {filtrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filtradas.length === 0 ? (
        <EmptyState
          titulo={
            local.totalSecoes === 0 ? 'Nenhuma seção neste local' : 'Nenhuma seção encontrada'
          }
          descricao={
            local.totalSecoes === 0
              ? 'As seções são criadas quando o cronograma do local é montado.'
              : 'Ajuste a busca ou os filtros.'
          }
          acao={
            local.totalSecoes > 0 && filtrosAtivos ? (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtradas.map((secao) => (
            <CartaoSecao key={secao.id} secao={secao} />
          ))}
        </div>
      )}
    </div>
  );
}
