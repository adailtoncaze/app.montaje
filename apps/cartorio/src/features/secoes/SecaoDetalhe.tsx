import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CircleCheck,
  ImageOff,
  Maximize2,
  Minus,
  TriangleAlert,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert';
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
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Medalhao } from '@/components/medalhao';
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
import {
  useSecao,
  validarSecao,
  type SecaoDetalhe as DetalheSecao,
  type ValidacaoComAutor,
} from '@/lib/dados';
import { ROTULO_STATUS_ITEM, tomStatusEtapa, tomStatusItem } from '@/lib/status-ui';
import { useSessao } from '@/features/auth/store';

/** Dados de uma foto preparados para o visualizador em tela cheia. */
interface FotoAberta {
  url: string;
  titulo: string;
  numero: number | null;
  capturada: string | null;
  coords: string | null;
  observacao: string | null;
  desvio: Desvio | null;
}

/** Resposta Sim/Não (ou "não respondido") como selo compacto. */
function ChipResposta({ resposta }: { resposta: boolean | null }) {
  if (resposta == null) return <Badge variant="secondary">Não respondido</Badge>;
  return (
    <Badge variant={resposta ? 'success' : 'danger'}>{resposta ? 'Sim' : 'Não'}</Badge>
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
      className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ampliar ${alt}`}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="size-full object-cover transition-transform group-hover:scale-105"
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
  const evidencia = evidencias[0];
  const caminho = evidencia?.caminho_miniatura ?? evidencia?.caminho_foto ?? null;
  const url = caminho ? urls[caminho] : undefined;
  const tom = tomStatusItem(item.status);

  const capturada = evidencia?.capturada_em
    ? new Date(evidencia.capturada_em).toLocaleString('pt-BR')
    : null;
  const coords =
    evidencia?.latitude != null && evidencia.longitude != null
      ? `${evidencia.latitude.toFixed(5)}, ${evidencia.longitude.toFixed(5)}`
      : null;

  return (
    <li className="flex items-start gap-4 p-4">
      {item.tipo === 'foto' ? (
        <MiniaturaEvidencia
          url={url}
          alt={item.nome}
          onAbrir={() =>
            url &&
            onAbrir({
              url,
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
              <span className="text-muted-foreground">#{item.foto_numero}</span>
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

        {item.tipo === 'foto' && !url && (
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
      setErro(
        'Esta seção tem sigilo do voto não conforme (regra eliminatória). Use "Solicitar correção".',
      );
      return;
    }

    if (novoStatus === 'correcao_solicitada') {
      if (!itemId) {
        setErro('Selecione o item que deve ser corrigido.');
        return;
      }
      if (!comentario.trim()) {
        setErro('Descreva o que a equipe precisa corrigir.');
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
        <Alert variant="success">
          <AlertIcon>
            <CircleCheck />
          </AlertIcon>
          <AlertDescription>
            <strong className="block">Etapa {etapa} aprovada</strong>
            Nenhuma ação pendente nesta etapa.
          </AlertDescription>
        </Alert>
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
        <AlertDescription>
          <strong className="block">Etapa {etapa} aguardando envio</strong>
          A equipe de montagem ainda não enviou esta etapa para validação.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Validação da Etapa {etapa}</CardTitle>
          <CardDescription>
            Revise as evidências desta etapa antes de decidir. A aprovação libera a próxima etapa
            para a equipe.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        {sucesso && (
          <Alert variant="success">
            <AlertDescription>{sucesso}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="item-corrigir">Item a corrigir (obrigatório para devolução)</Label>
          <Select value={itemId ?? undefined} onValueChange={(v) => setItemId(v)}>
            <SelectTrigger id="item-corrigir" aria-label="Item a corrigir">
              <SelectValue placeholder="Selecione o item" />
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
          <Label htmlFor="comentario">Comentário (obrigatório para devolução)</Label>
          <Textarea
            id="comentario"
            value={comentario}
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

        {!conforme && (
          <Alert variant="warning">
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
        <CardTitle>Histórico de validações</CardTitle>
      </CardHeader>
      <CardContent>
        {validacoes.map((v) => (
          <div
            key={v.id}
            className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={v.status === 'aprovada' ? 'success' : 'danger'}>
                Etapa {v.etapa}: {ROTULO_STATUS_ETAPA[v.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(v.data).toLocaleString('pt-BR')}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="size-3.5" />
              {v.validadorNome ?? 'Validador'}
            </p>
            {v.item_devolvido && (
              <p className="text-xs text-foreground">
                Item devolvido: {nomeDoItem(v.item_devolvido)}
              </p>
            )}
            {v.comentario && <p className="text-xs text-foreground">{v.comentario}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SecaoDetalhe() {
  const { localId = '', secaoId = '' } = useParams();
  const perfil = useSessao((s) => s.perfil);
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [foto, setFoto] = useState<FotoAberta | null>(null);

  const { data, isLoading, error } = useSecao(secaoId);

  if (isLoading) return <Spinner label="Carregando seção..." />;

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          to={`/locais/${localId}`}
          className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary-subtle-foreground hover:underline"
        >
          <ArrowLeft className="size-4" /> Voltar ao local
        </Link>
        <Alert variant="destructive">
          <AlertDescription>
            <strong className="block">Não foi possível carregar a seção</strong>
            {error instanceof Error ? error.message : 'Seção não encontrada.'}
          </AlertDescription>
        </Alert>
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

  function recarregar() {
    void queryClient.invalidateQueries({ queryKey: ['secao', secaoId] });
    void queryClient.invalidateQueries({ queryKey: ['secoes'] });
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/locais/${localId}`}
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary-subtle-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Voltar ao local
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Seção {secao.numero}
          {local ? ` · ${local.zona}ª zona` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">{local?.nome ?? 'Local não identificado'}</p>
        {equipes.length > 0 && (
          <p className="text-xs text-muted-foreground">Equipe(s): {equipes.join(', ')}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant={tomStatusEtapa(secao.status_etapa1)}>
            Etapa 1: {ROTULO_STATUS_ETAPA[secao.status_etapa1]}
          </Badge>
          <Badge variant={tomStatusEtapa(secao.status_etapa2)}>
            Etapa 2: {ROTULO_STATUS_ETAPA[secao.status_etapa2]}
          </Badge>
          <Badge variant={secao.conforme ? 'success' : 'danger'}>
            {secao.conforme ? 'Conforme' : 'Sigilo não conforme'}
          </Badge>
        </div>
      </div>

      {!secao.conforme && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertDescription>
            <strong className="block">Sigilo do voto não conforme (eliminatório)</strong>
            A seção tem ao menos uma resposta de sigilo "Não". Não pode ser aprovada antes da
            correção, conforme a regra 1 do PRD.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={String(etapa)} onValueChange={(v) => setEtapa(Number(v) as Etapa)}>
        <TabsList>
          <TabsTrigger value="1">Etapa 1 · Montagem</TabsTrigger>
          <TabsTrigger value="2">Etapa 2 · Sigilo do voto</TabsTrigger>
        </TabsList>
      </Tabs>

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

      {itensEtapa.length === 0 ? (
        <EmptyState
          titulo="Nenhum item nesta etapa"
          descricao="Os itens são materializados quando o cronograma do local é criado."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-0.5 border-b border-border px-5 py-4">
            <CardTitle>Checklist da Etapa {etapa}</CardTitle>
            <CardDescription>
              {itensEtapa.length} item(ns)
              {fotosSemEnvio > 0 ? ` · ${fotosSemEnvio} sem foto` : ''}
              {' · clique na foto para ampliar'}
            </CardDescription>
          </div>
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
        </Card>
      )}

      {sigiloDaEtapa.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-0.5 border-b border-border px-5 py-4">
            <CardTitle>Respostas de sigilo</CardTitle>
            <CardDescription>
              Perguntas eliminatórias da Etapa 2 (regra 1 do PRD).
            </CardDescription>
          </div>
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
        </Card>
      )}

      <Historico validacoes={validacoes} itens={itens} />

      <Dialog open={foto !== null} onOpenChange={(aberto) => !aberto && setFoto(null)}>
        <DialogContent className="max-w-3xl">
          {foto && (
            <>
              <div className="border-b border-border p-4 pr-14">
                <DialogTitle>{foto.titulo}</DialogTitle>
                <DialogDescription>
                  {foto.numero != null ? `Foto #${foto.numero} · ` : ''}
                  {foto.capturada ?? 'Data não informada'}
                  {foto.coords ? ` · ${foto.coords}` : ''}
                </DialogDescription>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted p-2">
                <img
                  src={foto.url}
                  alt={foto.titulo}
                  className="max-h-[70vh] w-auto rounded-md object-contain"
                />
              </div>
              {(foto.observacao || foto.desvio) && (
                <div className="flex flex-col gap-2 border-t border-border p-4">
                  {foto.observacao && (
                    <p className="text-sm text-foreground">Obs.: {foto.observacao}</p>
                  )}
                  {foto.desvio && (
                    <Alert variant="warning">
                      <AlertDescription>
                        <strong className="block">
                          Desvio: {ROTULO_MOTIVO[foto.desvio.motivo]}
                        </strong>
                        {foto.desvio.observacao?.trim() || 'Sem observação.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
