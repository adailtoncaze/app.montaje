import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock,
  MapPin,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Medalhao } from '@/components/medalhao';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { ROTULO_PAPEL } from '@montaje/core';
import { useSessao } from '@/features/auth/store';
import { useAvisoErro } from '@/lib/avisos';
import { useLocais } from '@/lib/dados';
import {
  ROTULO_SITUACAO,
  prioridadeSituacao,
  situacaoSecao,
  tomSituacao,
  type SituacaoSecao,
} from '@/lib/status-ui';
import { cn } from '@/lib/utils';

/** Anel de progresso em SVG puro (sem dependência). */
function AnelProgresso({ porcentagem }: { porcentagem: number }) {
  const raio = 54;
  const espessura = 12;
  const circunferencia = 2 * Math.PI * raio;
  const deslocamento = circunferencia * (1 - porcentagem / 100);

  return (
    <div className="relative flex size-40 shrink-0 items-center justify-center">
      <svg viewBox="0 0 140 140" className="size-40 -rotate-90" aria-hidden>
        <circle
          cx="70"
          cy="70"
          r={raio}
          fill="none"
          strokeWidth={espessura}
          className="stroke-muted"
        />
        <circle
          cx="70"
          cy="70"
          r={raio}
          fill="none"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={deslocamento}
          className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">{porcentagem}%</span>
        <span className="text-xs text-muted-foreground">concluído</span>
      </div>
    </div>
  );
}

/** Barra horizontal fina de composição por situação. */
function BarraSituacao({
  rotulo,
  valor,
  total,
  cor,
}: {
  rotulo: string;
  valor: number;
  total: number;
  cor: string;
}) {
  const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-muted-foreground">{rotulo}</span>
        <span className="font-semibold tabular-nums text-foreground">{valor}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', cor)}
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}

export function Inicio() {
  const perfil = useSessao((s) => s.perfil);
  const { data, isLoading, error } = useLocais();
  useAvisoErro(error);

  const locais = data ?? [];

  const totais = useMemo(
    () =>
      locais.reduce(
        (acc, local) => ({
          secoes: acc.secoes + local.totalSecoes,
          aguardando: acc.aguardando + local.aguardando,
          correcoes: acc.correcoes + local.correcoes,
          naoConformes: acc.naoConformes + local.naoConformes,
          concluidas: acc.concluidas + local.concluidas,
        }),
        { secoes: 0, aguardando: 0, correcoes: 0, naoConformes: 0, concluidas: 0 },
      ),
    [locais],
  );

  const progresso = totais.secoes > 0 ? Math.round((totais.concluidas / totais.secoes) * 100) : 0;

  const porSituacao = useMemo(() => {
    const contagem: Record<SituacaoSecao, number> = {
      aguardando: 0,
      correcao: 0,
      em_andamento: 0,
      concluida: 0,
    };
    for (const local of locais) {
      for (const secao of local.secoes) contagem[situacaoSecao(secao)] += 1;
    }
    return contagem;
  }, [locais]);

  /** Seções que ainda dependem de uma decisão do cartório. */
  const atencao = useMemo(() => {
    const itens: {
      id: string;
      localId: string;
      numero: number;
      localNome: string;
      zona: number;
      situacao: SituacaoSecao;
      naoConforme: boolean;
    }[] = [];

    for (const local of locais) {
      for (const secao of local.secoes) {
        const situacao = situacaoSecao(secao);
        if (situacao === 'concluida' && secao.conforme) continue;
        itens.push({
          id: secao.id,
          localId: local.id,
          numero: secao.numero,
          localNome: local.nome,
          zona: local.zona,
          situacao,
          naoConforme: !secao.conforme,
        });
      }
    }

    return itens.sort(
      (a, b) =>
        Number(b.naoConforme) - Number(a.naoConforme) ||
        prioridadeSituacao(a.situacao) - prioridadeSituacao(b.situacao) ||
        a.numero - b.numero,
    );
  }, [locais]);

  const pendencia =
    totais.naoConformes > 0
      ? { tom: 'danger' as const, texto: `${totais.naoConformes} com sigilo não conforme` }
      : totais.correcoes > 0
        ? { tom: 'danger' as const, texto: `${totais.correcoes} com correção solicitada` }
        : totais.aguardando > 0
          ? { tom: 'brand' as const, texto: `${totais.aguardando} aguardando validação` }
          : { tom: 'success' as const, texto: 'Sem pendências' };

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Início"
        descricao={
          <>
            Olá, {perfil?.nome ?? '—'}
            {perfil ? ` · ${ROTULO_PAPEL[perfil.papel]}` : ''} · {dataHoje}
          </>
        }
        acoes={<Badge variant={pendencia.tom}>{pendencia.texto}</Badge>}
      />

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar o resumo</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          valor={locais.length}
          rotulo="Locais de votação"
          icone={MapPin}
          carregando={isLoading}
        />
        <StatCard valor={totais.secoes} rotulo="Seções" icone={ClipboardList} carregando={isLoading} />
        <StatCard
          valor={totais.concluidas}
          rotulo="Aprovadas"
          icone={CircleCheck}
          tom="sucesso"
          descricao={`${progresso}% do total`}
          carregando={isLoading}
        />
        <StatCard
          valor={totais.aguardando}
          rotulo="Em análise"
          icone={Clock}
          tom={totais.aguardando > 0 ? 'marca' : 'neutro'}
          carregando={isLoading}
        />
        <StatCard
          valor={totais.correcoes}
          rotulo="Correções"
          icone={TriangleAlert}
          tom={totais.correcoes > 0 ? 'erro' : 'neutro'}
          carregando={isLoading}
        />
        <StatCard
          valor={totais.naoConformes}
          rotulo="Não conformes"
          icone={ShieldAlert}
          tom={totais.naoConformes > 0 ? 'erro' : 'neutro'}
          carregando={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-0.5">
              <CardTitle>Progresso geral</CardTitle>
              <CardDescription>
                {totais.concluidas} de {totais.secoes} seções com as duas etapas aprovadas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Skeleton className="size-40 shrink-0 rounded-full" />
                <div className="flex w-full flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <AnelProgresso porcentagem={progresso} />
                <div className="flex w-full flex-col gap-3.5">
                  <BarraSituacao
                    rotulo={ROTULO_SITUACAO.aguardando}
                    valor={porSituacao.aguardando}
                    total={totais.secoes}
                    cor="bg-primary"
                  />
                  <BarraSituacao
                    rotulo={ROTULO_SITUACAO.em_andamento}
                    valor={porSituacao.em_andamento}
                    total={totais.secoes}
                    cor="bg-warning-solid"
                  />
                  <BarraSituacao
                    rotulo={ROTULO_SITUACAO.correcao}
                    valor={porSituacao.correcao}
                    total={totais.secoes}
                    cor="bg-danger-solid"
                  />
                  <BarraSituacao
                    rotulo={ROTULO_SITUACAO.concluida}
                    valor={porSituacao.concluida}
                    total={totais.secoes}
                    cor="bg-success-solid"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex flex-col gap-0.5">
              <CardTitle>Precisa de atenção</CardTitle>
              <CardDescription>Seções que aguardam uma decisão sua</CardDescription>
            </div>
            {!isLoading && atencao.length > 0 && (
              <Badge variant="neutral">{atencao.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : atencao.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent px-0 py-8"
                icone={<CircleCheck />}
                titulo="Tudo em ordem"
                descricao="Nenhuma seção aguarda decisão do cartório."
              />
            ) : (
              <ul className="-mx-2 flex flex-col divide-y divide-border">
                {atencao.slice(0, 6).map((secao) => (
                  <li key={secao.id}>
                    <Link
                      to={`/locais/${secao.localId}/secoes/${secao.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Medalhao
                        tom={secao.naoConforme ? 'danger' : tomSituacao(secao.situacao)}
                        tamanho="sm"
                      >
                        {secao.numero}
                      </Medalhao>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          Seção {secao.numero}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {secao.localNome} · {secao.zona}ª zona
                        </span>
                      </div>
                      <Badge variant={secao.naoConforme ? 'danger' : tomSituacao(secao.situacao)}>
                        {secao.naoConforme ? 'Sigilo não conforme' : ROTULO_SITUACAO[secao.situacao]}
                      </Badge>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
