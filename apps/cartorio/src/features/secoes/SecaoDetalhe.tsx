import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  CircleCheck,
  ImageOff,
  TriangleAlert,
  User as UserIcon,
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

function ItemAvaliacao({
  item,
  evidencias,
  desvio,
  urls,
}: {
  item: ItemChecklist;
  evidencias: Evidencia[];
  desvio: Desvio | null;
  urls: Record<string, string>;
}) {
  const evidencia = evidencias[0];
  const caminho = evidencia?.caminho_miniatura ?? evidencia?.caminho_foto ?? null;
  const url = caminho ? urls[caminho] : undefined;
  const tom = tomStatusItem(item.status);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <Medalhao tom={tom}>
            {item.foto_numero ?? <Camera className="size-5" />}
          </Medalhao>
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle className="text-sm">{item.nome}</CardTitle>
            <CardDescription>
              {item.tipo === 'foto' ? 'Evidência fotográfica' : 'Confirmação'}
            </CardDescription>
          </div>
        </div>
        <Badge variant={tom}>{ROTULO_STATUS_ITEM[item.status]}</Badge>
      </CardHeader>

      <CardContent>
        {item.tipo === 'confirmacao' && (
          <p className="text-sm text-foreground">
            Resposta:{' '}
            <strong>
              {item.resposta == null ? 'não respondido' : item.resposta ? 'Sim' : 'Não'}
            </strong>
          </p>
        )}

        {item.tipo === 'foto' &&
          (url ? (
            <img
              className="max-h-90 w-full rounded-lg border border-border bg-muted object-contain"
              src={url}
              alt={`Evidência do item ${item.nome}`}
              loading="lazy"
            />
          ) : (
            <Alert variant="warning">
              <AlertIcon>
                <ImageOff />
              </AlertIcon>
              <AlertDescription>Foto não enviada.</AlertDescription>
            </Alert>
          ))}

        {evidencia?.capturada_em && (
          <p className="text-xs text-muted-foreground">
            {new Date(evidencia.capturada_em).toLocaleString('pt-BR')}
            {evidencia.latitude != null && evidencia.longitude != null
              ? ` · ${evidencia.latitude.toFixed(5)}, ${evidencia.longitude.toFixed(5)}`
              : ''}
          </p>
        )}

        {item.observacao && <p className="text-xs text-foreground">Obs.: {item.observacao}</p>}

        {desvio && (
          <Alert variant="warning">
            <AlertDescription>
              <strong className="block">Desvio: {ROTULO_MOTIVO[desvio.motivo]}</strong>
              {desvio.observacao?.trim() || 'Sem observação.'}
            </AlertDescription>
          </Alert>
        )}

        {!desvio && item.status === 'nao_conforme' && (
          <Alert variant="warning">
            <AlertDescription>Resposta "Não" sem desvio registrado.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
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
          <Button variant="destructive" disabled={enviando} onClick={() => registrar('correcao_solicitada')}>
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
          <div key={v.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {itensEtapa.map((item) => (
            <ItemAvaliacao
              key={item.id}
              item={item}
              evidencias={evidenciasPorItem[item.id] ?? []}
              desvio={desvioPorItem[item.id] ?? null}
              urls={urls}
            />
          ))}
        </div>
      )}

      {sigiloDaEtapa.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respostas de sigilo</CardTitle>
          </CardHeader>
          <CardContent>
            {sigiloDaEtapa.map((s) => (
              <p key={s.id} className="text-sm text-foreground">
                {s.pergunta}:{' '}
                <strong>
                  {s.resposta == null ? 'não respondido' : s.resposta ? 'Sim' : 'Não'}
                </strong>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Historico validacoes={validacoes} itens={itens} />
    </div>
  );
}
