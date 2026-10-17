import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Search, TriangleAlert } from 'lucide-react';
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

function CartaoSecao({ secao }: { secao: SecaoResumo }) {
  const situacao = situacaoSecao(secao);
  const naoConforme = !secao.conforme;

  return (
    <Link to={`/locais/${secao.local_id}/secoes/${secao.id}`} className="block h-full">
      <Card className="h-full transition-shadow hover:shadow-teams-8">
        <CardHeader>
          <div className="flex min-w-0 items-start gap-3">
            <Medalhao tom={tomSituacao(situacao)}>{secao.numero}</Medalhao>
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle>Seção {secao.numero}</CardTitle>
              <CardDescription>
                {secao.itensConcluidos}/{secao.totalItens} itens · {secao.fotos} foto(s)
              </CardDescription>
            </div>
          </div>
          <Badge variant={tomSituacao(situacao)}>{ROTULO_SITUACAO[situacao]}</Badge>
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

export function LocalDetalhe() {
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
      <div className="flex flex-col gap-4">
        <Link
          to="/locais"
          className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary-subtle-foreground hover:underline"
        >
          <ArrowLeft className="size-4" /> Voltar aos locais
        </Link>
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">Não foi possível carregar o local</strong>
            {error instanceof Error ? error.message : 'Local não encontrado.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/locais"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary-subtle-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Voltar aos locais
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{local.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {local.zona}ª zona
          {local.endereco?.trim() ? ` · ${local.endereco}` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={tomSituacao(local.situacao)}>{ROTULO_SITUACAO[local.situacao]}</Badge>
          <Badge variant="secondary">{local.totalSecoes} seção(ões)</Badge>
          {local.naoConformes > 0 && (
            <Badge variant="danger">{local.naoConformes} não conforme</Badge>
          )}
        </div>
      </div>

      {local.naoConformes > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">Sigilo do voto não conforme (eliminatório)</strong>
            Há seção(ões) com resposta de sigilo "Não". Elas não podem ser aprovadas antes da
            correção, conforme a regra 1 do PRD.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard valor={local.totalSecoes} rotulo="Seções" />
        <StatCard valor={local.aguardando} rotulo="Aguardando validação" tom={local.aguardando > 0 ? 'marca' : 'neutro'} />
        <StatCard valor={local.correcoes} rotulo="Com correção" tom={local.correcoes > 0 ? 'erro' : 'neutro'} />
        <StatCard valor={local.concluidas} rotulo="Concluídas" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="busca-secao">Buscar seção</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="busca-secao"
              className="pl-9"
              inputMode="numeric"
              placeholder="Número da seção"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-status">Status da Etapa 1</Label>
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

        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="secao-nao-conformes"
            checked={soNaoConformes}
            onCheckedChange={(v) => setSoNaoConformes(v === true)}
          />
          <Label htmlFor="secao-nao-conformes" className="font-medium">
            Só sigilo não conforme
          </Label>
        </div>
      </div>

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
