import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  CircleCheck,
  ImageOff,
  Maximize2,
  Minus,
  RefreshCw,
  TriangleAlert,
  User as UserIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Medalhao } from '@/components/medalhao';
import { PageHeader } from '@/components/page-header';
import { Progresso } from '@/components/progress-bar';
import {
  ROTULO_MOTIVO,
  ROTULO_STATUS_ETAPA,
  ROTULO_STATUS_VALIDACAO,
  type Desvio,
  type Etapa,
  type Evidencia,
  type ItemChecklist,
  type StatusEtapa,
  type ValidacaoInput,
} from '@montaje/core';
import {
  reabrirEtapa,
  useSecao,
  validarSecao,
  type SecaoDetalhe as DetalheSecao,
  type ValidacaoComAutor,
} from '@/lib/dados';
import { mensagemDeErro, useAvisoErro } from '@/lib/avisos';
import { VisualizadorFoto, type FotoAberta } from './VisualizadorFoto';
import { ROTULO_STATUS_ITEM, tomStatusEtapa, tomStatusItem } from '@/lib/status-ui';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';

const LIMITE_COMENTARIO = 600;

/** Resposta Sim/Não (ou "não respondido") como selo compacto. */
function ChipResposta({ resposta }: { resposta: boolean | null }) {
  if (resposta == null) return <Badge variant="secondary">Não respondido</Badge>;
  return <Badge variant={resposta ? 'success' : 'danger'}>{resposta ? 'Sim' : 'Não'}</Badge>;
}

/** Mini indicador numérico do resumo da etapa. */
function Indicador({
  rotulo,
  valor,
  tone,
}: {
  rotulo: string;
  valor: ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-2">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={cn('text-lg font-semibold tabular-nums', tone ?? 'text-foreground')}>
        {valor}
      </dd>
    </div>
  );
}

/** Miniatura clicável da evidência (abre o visualizador). */
function MiniaturaEvidencia({
  url,
  alt,
  onAbrir,
}: {
  url?: string;
  alt: string;
  onAbrir: () => void;
}) {
  if (!url) {
    return (
      <div className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
        <ImageOff className="size-5" />
        <span className="text-[10px] font-semibold">Sem foto</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:shadow-teams-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ampliar ${alt}`}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        <Maximize2 className="size-4" />
      </span>
    </button>
  );
}

/** Uma linha da checklist: foto (miniatura + metadados) ou confirmação (resposta). */
function ItemRevisao({
  item,
  evidencias,
  desvio,
  urls,
  onAbrir,
}: {
  item: ItemChecklist;
  evidencias: Evidencia[];
  desvio: Desvio | null;
  urls: Record<string, string>;
  onAbrir: (foto: FotoAberta) => void;
}) {
  // Sempre a foto mais recente do item: quando o cartório devolve uma foto e a
  // equipe envia a nova, esta substitui a anterior em desconformidade — mesmo
  // que ainda existam registros antigos duplicados no servidor (dado legado).
  const evidencia = [...evidencias].sort((a, b) =>
    (b.capturada_em ?? b.created_at).localeCompare(a.capturada_em ?? a.created_at),
  )[0];
  // A lista mostra a miniatura (320px, rápida); o visualizador abre a foto
  // original — validar a evidência sobre a miniatura distorce a resolução real.
  const caminhoMiniatura = evidencia?.caminho_miniatura ?? evidencia?.caminho_foto ?? null;
  const urlMiniatura = caminhoMiniatura ? urls[caminhoMiniatura] : undefined;
  const urlFoto = (evidencia?.caminho_foto ? urls[evidencia.caminho_foto] : undefined) ??
    urlMiniatura;
  const tom = tomStatusItem(item.status);

  const capturada = evidencia?.capturada_em
    ? new Date(evidencia.capturada_em).toLocaleString('pt-BR')
    : null;
  const coords =
    evidencia?.latitude != null && evidencia.longitude != null
      ? `${evidencia.latitude.toFixed(5)}, ${evidencia.longitude.toFixed(5)}`
      : null;

  return (
    <li className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-accent/40">
      {item.tipo === 'foto' ? (
        <MiniaturaEvidencia
          url={urlMiniatura}
          alt={item.nome}
          onAbrir={() =>
            urlFoto &&
            onAbrir({
              url: urlFoto,
              titulo: item.nome,
              numero: item.foto_numero,
              capturada,
              coords,
              observacao: item.observacao,
              desvio,
            })
          }
        />
      ) : (
        <Medalhao tom={tom} className="size-10">
          {item.resposta == null ? (
            <Minus className="size-5" />
          ) : item.resposta ? (
            <Check className="size-5" />
          ) : (
            <X className="size-5" />
          )}
        </Medalhao>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-baseline gap-2 text-sm font-semibold text-foreground">
            {item.tipo === 'foto' && item.foto_numero != null && (
              <span className="tabular-nums text-muted-foreground">#{item.foto_numero}</span>
            )}
            <span className="min-w-0 break-words">{item.nome}</span>
          </span>
          {item.tipo === 'foto' ? (
            <Badge variant={tom}>{ROTULO_STATUS_ITEM[item.status]}</Badge>
          ) : (
            <ChipResposta resposta={item.resposta} />
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          {item.tipo === 'foto' ? 'Evidência fotográfica' : 'Confirmação'}
          {capturada ? ` · ${capturada}` : ''}
          {coords ? ` · ${coords}` : ''}
        </span>

        {item.tipo === 'foto' && !urlMiniatura && (
          <span className="text-xs font-semibold text-warning">Foto não enviada.</span>
        )}

        {item.observacao && (
          <span className="text-xs text-foreground">Obs.: {item.observacao}</span>
        )}

        {desvio && (
          <Alert variant="warning" className="mt-1 py-2">
            <AlertDescription>
              <strong className="block">Desvio: {ROTULO_MOTIVO[desvio.motivo]}</strong>
              {desvio.observacao?.trim() || 'Sem observação.'}
            </AlertDescription>
          </Alert>
        )}

        {!desvio && item.status === 'nao_conforme' && (
          <span className="text-xs font-semibold text-warning">
            Resposta "Não" sem desvio registrado.
          </span>
        )}
      </div>
    </li>
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
  detalhe: DetalheSecao;
  etapa: Etapa;
  status: StatusEtapa;
  conforme: boolean;
  validadorId: string;
  ultima: ValidacaoComAutor | null;
  onValidado: () => void;
}) {
  const [itemId, setItemId] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [reabrindo, setReabrindo] = useState(false);
  const [motivoReabertura, setMotivoReabertura] = useState('');

  const itensEtapa = useMemo(
    () => detalhe.itens.filter((item) => item.etapa === etapa),
    [detalhe.itens, etapa],
  );
  const nomeDoItem = (id: string | null) =>
    id ? (itensEtapa.find((item) => item.id === id)?.nome ?? 'item removido') : '';

  async function registrar(novoStatus: 'aprovada' | 'correcao_solicitada') {
    setErro(null);
    setSucesso(null);

    if (novoStatus === 'aprovada' && !conforme) {
      const mensagem =
        'Esta seção tem sigilo do voto não conforme (regra eliminatória). Use "Solicitar correção".';
      setErro(mensagem);
      toast.error('Aprovação bloqueada', { description: mensagem });
      return;
    }

    if (novoStatus === 'correcao_solicitada') {
      if (!itemId) {
        const mensagem = 'Selecione o item que deve ser corrigido.';
        setErro(mensagem);
        toast.error('Falta o item a corrigir', { description: mensagem });
        return;
      }
      if (!comentario.trim()) {
        const mensagem = 'Descreva o que a equipe precisa corrigir.';
        setErro(mensagem);
        toast.error('Falta o comentário', { description: mensagem });
        return;
      }
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
      const mensagem =
        novoStatus === 'aprovada'
          ? `Etapa ${etapa} aprovada.`
          : `Correção da Etapa ${etapa} solicitada à equipe.`;
      setSucesso(mensagem);
      if (novoStatus === 'aprovada') {
        toast.success('Etapa aprovada', {
          description: 'A equipe foi liberada para a próxima etapa.',
        });
      } else {
        toast.success('Correção solicitada', {
          description: 'A equipe foi notificada para revisar a seção.',
        });
      }
      setComentario('');
      setItemId(null);
      onValidado();
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Falha ao registrar a validação.');
      setErro(mensagem);
      toast.error('Não foi possível registrar', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  /** Etapa 1 reaberta também derruba a Etapa 2 (regra 5), se ela já começou. */
  const cascataEtapa2 = etapa === 1 && detalhe.secao.status_etapa2 !== 'pendente';

  async function reabrir() {
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      await reabrirEtapa(detalhe.secao.id, etapa, motivoReabertura);
      toast.success('Etapa reaberta', {
        description: cascataEtapa2
          ? 'As duas etapas voltaram para correção; a equipe foi notificada.'
          : 'A equipe foi notificada para revisar e reenviar a etapa.',
      });
      setReabrindo(false);
      setMotivoReabertura('');
      onValidado();
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Falha ao reabrir a etapa.');
      setErro(mensagem);
      toast.error('Não foi possível reabrir', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  if (status !== 'enviada') {
    if (status === 'aprovada') {
      return (
        <>
          <Alert variant="success">
            <AlertIcon>
              <CircleCheck />
            </AlertIcon>
            <AlertDescription>
              <strong className="block">Etapa {etapa} aprovada</strong>
              Nenhuma ação pendente nesta etapa.
            </AlertDescription>
          </Alert>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-fit"
              onClick={() => setReabrindo(true)}
            >
              <RefreshCw />
              Reabrir etapa
            </Button>
            <p className="text-xs text-muted-foreground">
              Reabre a aprovação para a equipe revisar o checklist e reenviar. O motivo fica
              registrado no histórico.
              {cascataEtapa2 ? ' A Etapa 2 também será reaberta (regra 5).' : ''}
            </p>
          </div>

          <Dialog
            open={reabrindo}
            onOpenChange={(aberto) => {
              if (!aberto) {
                setReabrindo(false);
                setErro(null);
              }
            }}
          >
            <DialogContent className="max-w-lg p-0">
              <div className="border-b border-border p-5 pr-14">
                <DialogTitle>Reabrir a Etapa {etapa}?</DialogTitle>
                <DialogDescription>
                  A etapa volta para correção e a equipe é notificada para revisar e reenviar.
                  {cascataEtapa2 ? ' A Etapa 2 também será reaberta.' : ''}
                </DialogDescription>
              </div>

              <div className="flex flex-col gap-4 p-5">
                {erro && (
                  <Alert variant="destructive">
                    <AlertIcon>
                      <TriangleAlert />
                    </AlertIcon>
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <Label htmlFor="motivo-reabertura">Motivo da reabertura</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {motivoReabertura.length}/{LIMITE_COMENTARIO}
                    </span>
                  </div>
                  <Textarea
                    id="motivo-reabertura"
                    value={motivoReabertura}
                    maxLength={LIMITE_COMENTARIO}
                    placeholder="Ex.: a urna foi movida após a aprovação; reanálise da foto 2."
                    onChange={(e) => setMotivoReabertura(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    disabled={enviando}
                    onClick={() => setReabrindo(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={enviando || motivoReabertura.trim().length < 5}
                    onClick={reabrir}
                  >
                    <RefreshCw />
                    Reabrir etapa
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    if (status === 'correcao_solicitada') {
      return (
        <Alert variant="warning">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertDescription>
            <strong className="block">Etapa {etapa} devolvida para correção</strong>
            {ultima?.comentario?.trim()
              ? `${nomeDoItem(ultima.item_devolvido)}: ${ultima.comentario}`
              : 'A equipe foi notificada para revisar esta etapa.'}
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert variant="info">
        <AlertIcon>
          <TriangleAlert />
        </AlertIcon>
        <AlertDescription>
          <strong className="block">Etapa {etapa} aguardando envio</strong>
          A equipe de montagem ainda não enviou esta etapa para validação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-1">
          <CardTitle>Validação da Etapa {etapa}</CardTitle>
          <CardDescription>
            Revise as evidências antes de decidir. A aprovação libera a próxima etapa.
          </CardDescription>
        </div>
        <Badge variant={tomStatusEtapa(status)}>{ROTULO_STATUS_ETAPA[status]}</Badge>
      </CardHeader>

      <CardContent className="pt-5">
        {erro && (
          <Alert variant="destructive">
            <AlertIcon>
              <TriangleAlert />
            </AlertIcon>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        {sucesso && (
          <Alert variant="success">
            <AlertIcon>
              <CircleCheck />
            </AlertIcon>
            <AlertDescription>{sucesso}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="item-corrigir">Item a corrigir</Label>
          <Select value={itemId ?? undefined} onValueChange={(v) => setItemId(v)}>
            <SelectTrigger id="item-corrigir" aria-label="Item a corrigir">
              <SelectValue placeholder="Selecione o item (obrigatório para devolver)" />
            </SelectTrigger>
            <SelectContent>
              {itensEtapa.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="comentario">Comentário</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {comentario.length}/{LIMITE_COMENTARIO}
            </span>
          </div>
          <Textarea
            id="comentario"
            value={comentario}
            maxLength={LIMITE_COMENTARIO}
            placeholder="Ex.: foto sem a urna de lona; repetir o enquadramento."
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            disabled={!conforme || enviando}
            title={
              conforme
                ? undefined
                : 'Bloqueado: sigilo do voto não conforme (regra eliminatória).'
            }
            onClick={() => registrar('aprovada')}
          >
            <CircleCheck />
            Aprovar Etapa {etapa}
          </Button>
          <Button
            variant="destructive"
            disabled={enviando}
            onClick={() => registrar('correcao_solicitada')}
          >
            <TriangleAlert />
            Solicitar correção
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          A devolução exige selecionar o item e escrever o comentário.
        </p>

        {!conforme && (
          <Alert variant="warning">
            <AlertIcon>
              <TriangleAlert />
            </AlertIcon>
            <AlertDescription>
              A aprovação está bloqueada enquanto houver sigilo do voto não conforme. Registre a
              correção informando o item de sigilo.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/** Resumo da etapa selecionada (progresso, fotos e pendências). */
function ResumoEtapa({
  etapa,
  itensEtapa,
  itensConcluidos,
  fotosEnviadas,
  fotosEtapa,
  fotosSemEnvio,
  naoConformes,
  sigilo,
}: {
  etapa: Etapa;
  itensEtapa: number;
  itensConcluidos: number;
  fotosEnviadas: number;
  fotosEtapa: number;
  fotosSemEnvio: number;
  naoConformes: number;
  sigilo: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Resumo da Etapa {etapa}</CardTitle>
          <CardDescription>Visão rápida do que foi enviado pela equipe</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Progresso
          concluidos={itensConcluidos}
          total={itensEtapa}
          rotulo={`${itensConcluidos} de ${itensEtapa} itens respondidos`}
        />
        <dl className="grid grid-cols-2 gap-3">
          <Indicador rotulo="Fotos enviadas" valor={`${fotosEnviadas}/${fotosEtapa}`} />
          <Indicador
            rotulo="Sem foto"
            valor={fotosSemEnvio}
            tone={fotosSemEnvio > 0 ? 'text-warning' : 'text-foreground'}
          />
          <Indicador
            rotulo="Não conformes"
            valor={naoConformes}
            tone={naoConformes > 0 ? 'text-danger' : 'text-foreground'}
          />
          <Indicador rotulo="Perguntas de sigilo" valor={sigilo} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Historico({
  validacoes,
  itens,
}: {
  validacoes: ValidacaoComAutor[];
  itens: ItemChecklist[];
}) {
  if (!validacoes.length) return null;

  const nomeDoItem = (id: string | null) =>
    id ? (itens.find((item) => item.id === id)?.nome ?? 'item removido') : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Histórico de validações</CardTitle>
          <CardDescription>Decisões registradas nesta seção</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-5">
          {validacoes.map((v, indice) => {
            const aprovada = v.status === 'aprovada';
            const reabertura = v.status === 'reabertura';
            const ultima = indice === validacoes.length - 1;
            return (
              <li key={v.id} className="relative flex gap-3">
                {!ultima && (
                  <span
                    aria-hidden
                    className="absolute -bottom-5 left-[13px] top-7 w-px bg-border"
                  />
                )}
                <span
                  className={cn(
                    'z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                    aprovada
                      ? 'bg-success-bg text-success'
                      : reabertura
                        ? 'bg-warning-bg text-warning'
                        : 'bg-danger-bg text-danger',
                  )}
                >
                  {aprovada ? (
                    <CircleCheck className="size-4" />
                  ) : reabertura ? (
                    <RefreshCw className="size-4" />
                  ) : (
                    <TriangleAlert className="size-4" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">
                      Etapa {v.etapa} · {ROTULO_STATUS_VALIDACAO[v.status]}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {new Date(v.data).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserIcon className="size-3.5" />
                    {v.validadorNome ?? 'Validador'}
                  </span>
                  {v.item_devolvido && (
                    <span className="text-xs text-foreground">
                      Item devolvido: {nomeDoItem(v.item_devolvido)}
                    </span>
                  )}
                  {v.comentario && (
                    <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
                      {v.comentario}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function EsqueletoSecao() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg sm:max-w-md" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SecaoDetalhe() {
  const { localId = '', secaoId = '' } = useParams();
  const perfil = useSessao((s) => s.perfil);
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [foto, setFoto] = useState<FotoAberta | null>(null);

  const { data, isLoading, error } = useSecao(secaoId);
  useAvisoErro(error);

  if (isLoading) return <EsqueletoSecao />;

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader titulo="Seção" />
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar a seção</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Seção não encontrada.'}
            </AlertDescription>
          </div>
        </Alert>
        <Button variant="outline" className="w-fit" asChild>
          <Link to={`/locais/${localId}`}>Voltar ao local</Link>
        </Button>
      </div>
    );
  }

  const { secao, itens, evidenciasPorItem, desvioPorItem, urls, validacoes, sigilo, equipes } = data;
  const local = secao.local;
  const statusEtapa = etapa === 1 ? secao.status_etapa1 : secao.status_etapa2;
  const itensEtapa = itens.filter((item) => item.etapa === etapa);
  const ultimaDaEtapa = validacoes.find((v) => v.etapa === etapa) ?? null;
  const sigiloDaEtapa = etapa === 2 ? sigilo : [];
  const fotosSemEnvio = itensEtapa.filter(
    (item) => item.tipo === 'foto' && !(evidenciasPorItem[item.id]?.length),
  ).length;
  const fotosEtapa = itensEtapa.filter((item) => item.tipo === 'foto').length;
  const fotosEnviadas = Math.max(fotosEtapa - fotosSemEnvio, 0);
  const naoConformesEtapa = itensEtapa.filter((item) => item.status === 'nao_conforme').length;
  const itensConcluidosEtapa = itensEtapa.filter((item) => item.status !== 'pendente').length;

  function recarregar() {
    void queryClient.invalidateQueries({ queryKey: ['secao', secaoId] });
    void queryClient.invalidateQueries({ queryKey: ['secoes'] });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={`Seção ${secao.numero}${local ? ` · ${local.zona}ª zona` : ''}`}
        descricao={
          <>
            {local?.nome ?? 'Local não identificado'}
            {equipes.length > 0 ? ` · Equipe(s): ${equipes.join(', ')}` : ''}
          </>
        }
        acoes={
          <>
            <Badge variant={tomStatusEtapa(secao.status_etapa1)}>
              Etapa 1: {ROTULO_STATUS_ETAPA[secao.status_etapa1]}
            </Badge>
            <Badge variant={tomStatusEtapa(secao.status_etapa2)}>
              Etapa 2: {ROTULO_STATUS_ETAPA[secao.status_etapa2]}
            </Badge>
            <Badge variant={secao.conforme ? 'success' : 'danger'}>
              {secao.conforme ? 'Conforme' : 'Sigilo não conforme'}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={recarregar}
                  aria-label="Atualizar dados da seção"
                >
                  <RefreshCw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recarregar os dados do servidor</TooltipContent>
            </Tooltip>
          </>
        }
      />

      {!secao.conforme && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Sigilo do voto não conforme (eliminatório)</AlertTitle>
            <AlertDescription>
              A seção tem ao menos uma resposta de sigilo "Não". Não pode ser aprovada antes da
              correção, conforme a regra 1 do PRD.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs value={String(etapa)} onValueChange={(v) => setEtapa(Number(v) as Etapa)}>
        <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
          <TabsTrigger value="1">Etapa 1 · Montagem</TabsTrigger>
          <TabsTrigger value="2">Etapa 2 · Sigilo do voto</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Coluna principal: checklist + respostas de sigilo. */}
        <div className="flex flex-col gap-6">
          {itensEtapa.length === 0 ? (
            <EmptyState
              titulo="Nenhum item nesta etapa"
              descricao="Os itens são materializados quando o cronograma do local é criado."
            />
          ) : (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col gap-0.5">
                  <CardTitle>Checklist da Etapa {etapa}</CardTitle>
                  <CardDescription>
                    {itensEtapa.length} item(ns)
                    {fotosSemEnvio > 0 ? ` · ${fotosSemEnvio} sem foto` : ''}
                    {' · clique na foto para ampliar'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {itensEtapa.map((item) => (
                    <ItemRevisao
                      key={item.id}
                      item={item}
                      evidencias={evidenciasPorItem[item.id] ?? []}
                      desvio={desvioPorItem[item.id] ?? null}
                      urls={urls}
                      onAbrir={setFoto}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {sigiloDaEtapa.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col gap-0.5">
                  <CardTitle>Respostas de sigilo</CardTitle>
                  <CardDescription>
                    Perguntas eliminatórias da Etapa 2 (regra 1 do PRD).
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {sigiloDaEtapa.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3"
                    >
                      <span className="min-w-0 flex-1 text-sm text-foreground">{s.pergunta}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {s.critica && <Badge variant="outline">Crítica</Badge>}
                        <ChipResposta resposta={s.resposta} />
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna lateral: validação (fixa ao rolar), resumo e histórico. */}
        <div className="flex flex-col gap-6">
          <div className="xl:sticky xl:top-24">
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
          </div>

          <ResumoEtapa
            etapa={etapa}
            itensEtapa={itensEtapa.length}
            itensConcluidos={itensConcluidosEtapa}
            fotosEnviadas={fotosEnviadas}
            fotosEtapa={fotosEtapa}
            fotosSemEnvio={fotosSemEnvio}
            naoConformes={naoConformesEtapa}
            sigilo={sigiloDaEtapa.length}
          />

          <Historico validacoes={validacoes} itens={itens} />
        </div>
      </div>

      <VisualizadorFoto foto={foto} onFechar={() => setFoto(null)} />
    </div>
  );
}
