import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleCheck,
  MapPin,
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
import { useAvisoErro } from '@/lib/avisos';
import { useLocais, type LocalComSecoes } from '@/lib/dados';
import { classeAcento, ROTULO_SITUACAO, tomSituacao } from '@/lib/status-ui';
import { cn } from '@/lib/utils';

type Filtro = 'todas' | 'aguardando' | 'correcao' | 'nao_conformes' | 'concluidos';

function CartaoLocal({ local }: { local: LocalComSecoes }) {
  const semLocal = local.id === 'sem-local';
  const naoConforme = local.naoConformes > 0;
  const tom = tomSituacao(local.situacao);

  const conteudo = (
    <Card
      className={cn(
        'h-full overflow-hidden',
        !semLocal &&
          'transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-teams-8',
      )}
    >
      <span aria-hidden className={cn('h-1 w-full shrink-0', classeAcento(tom))} />
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <Medalhao tom={tom}>
            {local.situacao === 'concluida' ? <CircleCheck className="size-5" /> : local.zona || '—'}
          </Medalhao>
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="truncate">{local.nome}</CardTitle>
            <CardDescription className="truncate">
              {local.zona}ª zona{local.endereco?.trim() ? ` · ${local.endereco}` : ''}
            </CardDescription>
          </div>
        </div>
        {local.aguardando > 0 ? (
          <Badge variant="brand">{local.aguardando} para validar</Badge>
        ) : (
          <Badge variant={tom}>{ROTULO_SITUACAO[local.situacao]}</Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{local.totalSecoes} seção(ões)</Badge>
          <Badge variant="secondary">{local.concluidas} concluída(s)</Badge>
          {naoConforme && <Badge variant="danger">{local.naoConformes} não conforme</Badge>}
        </div>

        {naoConforme && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-danger">
            <TriangleAlert className="size-3.5" />
            Há seção com sigilo do voto não conforme
          </p>
        )}

        {local.totalSecoes > 0 && (
          <Progresso
            concluidos={local.concluidas}
            total={local.totalSecoes}
            rotulo={`${local.concluidas} de ${local.totalSecoes} seções concluídas`}
          />
        )}

        {semLocal && (
          <Alert variant="warning">
            <AlertDescription>Local não encontrado — confira o cadastro.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  if (semLocal) return conteudo;
  return (
    <Link
      to={`/locais/${local.id}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {conteudo}
    </Link>
  );
}

function EsqueletoGrade() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-full">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function Locais() {
  const { data, isLoading, error, refetch, isFetching } = useLocais();
  useAvisoErro(error);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [soNaoConformes, setSoNaoConformes] = useState(false);

  const locais = data ?? [];

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
      return `${local.zona} ${local.nome} ${local.endereco ?? ''}`
        .toLowerCase()
        .includes(termo);
    });
  }, [locais, busca, filtro, soNaoConformes]);

  const filtrosAtivos = busca.trim() !== '' || filtro !== 'todas' || soNaoConformes;

  function limparFiltros() {
    setBusca('');
    setFiltro('todas');
    setSoNaoConformes(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Locais de votação"
        descricao="O trabalho é acompanhado por local. Abra um local para ver as seções e validar as evidências."
        acoes={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
                aria-label="Atualizar lista de locais"
              >
                <RefreshCw className={cn(isFetching && 'animate-spin')} />
                Atualizar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Recarregar os dados do servidor</TooltipContent>
          </Tooltip>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="busca-local" className="sr-only">
                Buscar locais
              </Label>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="busca-local"
                className="pl-9 pr-9"
                placeholder="Zona, local ou endereço"
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

            <div className="lg:w-56">
              <Label htmlFor="filtro-local" className="sr-only">
                Filtrar por situação
              </Label>
              <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                <SelectTrigger id="filtro-local" aria-label="Filtrar locais">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos os locais</SelectItem>
                  <SelectItem value="aguardando">Aguardando validação</SelectItem>
                  <SelectItem value="correcao">Com correção solicitada</SelectItem>
                  <SelectItem value="nao_conformes">Com sigilo não conforme</SelectItem>
                  <SelectItem value="concluidos">Concluídos</SelectItem>
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
                {filtrados.length}
              </span>{' '}
              de <span className="tabular-nums">{locais.length}</span> locais
            </span>
            {filtrosAtivos && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar os locais</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {isLoading && <EsqueletoGrade />}

      {!isLoading && !error && filtrados.length === 0 && (
        <EmptyState
          icone={<MapPin />}
          titulo={locais.length === 0 ? 'Nenhum local cadastrado' : 'Nenhum local encontrado'}
          descricao={
            locais.length === 0
              ? 'Cadastre os locais e o cronograma das equipes para começar.'
              : 'Ajuste a busca ou os filtros.'
          }
          acao={
            locais.length > 0 && filtrosAtivos ? (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && filtrados.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((local) => (
            <CartaoLocal key={local.id} local={local} />
          ))}
        </div>
      )}
    </div>
  );
}
