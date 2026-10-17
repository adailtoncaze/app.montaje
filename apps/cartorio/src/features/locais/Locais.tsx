import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, MapPin, Search, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Spinner } from '@/components/ui/spinner';
import { Medalhao } from '@/components/medalhao';
import { Progresso } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { useLocais, type LocalComSecoes } from '@/lib/dados';
import { ROTULO_SITUACAO, tomSituacao } from '@/lib/status-ui';
import { cn } from '@/lib/utils';

type Filtro = 'todas' | 'aguardando' | 'correcao' | 'nao_conformes' | 'concluidos';

function CartaoLocal({ local }: { local: LocalComSecoes }) {
  const semLocal = local.id === 'sem-local';
  const naoConforme = local.naoConformes > 0;

  const conteudo = (
    <Card className={cn('h-full', !semLocal && 'transition-shadow hover:shadow-teams-8')}>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <Medalhao tom={tomSituacao(local.situacao)}>
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
          <Badge variant={tomSituacao(local.situacao)}>{ROTULO_SITUACAO[local.situacao]}</Badge>
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
    <Link to={`/locais/${local.id}`} className="block h-full">
      {conteudo}
    </Link>
  );
}

export function Locais() {
  const { data, isLoading, error } = useLocais();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [soNaoConformes, setSoNaoConformes] = useState(false);

  const locais = data ?? [];

  const totais = useMemo(
    () =>
      locais.reduce(
        (acc, local) => ({
          secoes: acc.secoes + local.totalSecoes,
          aguardando: acc.aguardando + local.aguardando,
          naoConformes: acc.naoConformes + local.naoConformes,
        }),
        { secoes: 0, aguardando: 0, naoConformes: 0 },
      ),
    [locais],
  );

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Locais de votação</h1>
        <p className="text-sm text-muted-foreground">
          O trabalho é acompanhado por local. Abra um local para ver as seções e validar as
          evidências.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard valor={locais.length} rotulo="Local(is)" />
        <StatCard valor={totais.secoes} rotulo="Seções" />
        <StatCard valor={totais.aguardando} rotulo="Aguardando validação" tom="marca" />
        <StatCard
          valor={totais.naoConformes}
          rotulo="Sigilo não conforme"
          tom={totais.naoConformes > 0 ? 'erro' : 'neutro'}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="busca-local">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="busca-local"
              className="pl-9"
              placeholder="Zona, local ou endereço"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-local">Situação</Label>
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

        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="so-nao-conformes"
            checked={soNaoConformes}
            onCheckedChange={(v) => setSoNaoConformes(v === true)}
          />
          <Label htmlFor="so-nao-conformes" className="font-medium">
            Só sigilo não conforme
          </Label>
        </div>
      </div>

      {isLoading && <Spinner label="Carregando locais..." />}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">Não foi possível carregar os locais</strong>
            {error instanceof Error ? error.message : 'Tente novamente.'}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && filtrados.length === 0 && (
        <EmptyState
          icone={<MapPin />}
          titulo={locais.length === 0 ? 'Nenhum local cadastrado' : 'Nenhum local encontrado'}
          descricao={
            locais.length === 0
              ? 'Cadastre os locais e o cronograma das equipes para começar.'
              : 'Ajuste a busca ou os filtros.'
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
