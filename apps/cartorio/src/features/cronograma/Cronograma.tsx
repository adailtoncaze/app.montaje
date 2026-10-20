import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarPlus,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Etapa } from '@montaje/core';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { SelectBusca } from '@/components/ui/select-busca';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaRestrita } from '@/components/area-restrita';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { mensagemDeErro, useAvisoErro } from '@/lib/avisos';
import {
  atualizarEscala,
  criarEscala,
  removerEscala,
  useCronograma,
  useEquipes,
  useLocaisCadastro,
  type EscalaDetalhe,
} from '@/lib/cadastros';
import { diasAteHoje, formatarDiaLongo, hojeLocal } from '@/lib/datas';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';

type Periodo = 'todos' | 'hoje' | 'proximos';

const ROTULO_PERIODO: Record<Periodo, string> = {
  todos: 'Todas as datas',
  hoje: 'Só hoje',
  proximos: 'A partir de hoje',
};

export function Cronograma() {
  const papel = useSessao((s) => s.perfil?.papel);
  const podeEditar = papel === 'administrador';

  const { data, isLoading, error, refetch, isFetching } = useCronograma({ enabled: podeEditar });
  useAvisoErro(error);

  const [filtroEquipe, setFiltroEquipe] = useState('todas');
  const [periodo, setPeriodo] = useState<Periodo>('todos');
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<EscalaDetalhe | null>(null);

  const escalas = data ?? [];

  const filtradas = useMemo(() => {
    const hoje = diasAteHoje(hojeLocal());
    return escalas.filter((escala) => {
      if (filtroEquipe !== 'todas' && escala.equipe_id !== filtroEquipe) return false;
      const relativo = diasAteHoje(escala.data) - hoje;
      if (periodo === 'hoje' && relativo !== 0) return false;
      if (periodo === 'proximos' && relativo < 0) return false;
      return true;
    });
  }, [escalas, filtroEquipe, periodo]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, EscalaDetalhe[]>();
    for (const escala of filtradas) {
      const lista = mapa.get(escala.data);
      if (lista) lista.push(escala);
      else mapa.set(escala.data, [escala]);
    }
    return [...mapa.entries()]
      .map(([data, lista]) => ({ data, lista }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [filtradas]);

  const equipesEscaladas = new Set(escalas.map((escala) => escala.equipe_id)).size;
  const proximas = escalas.filter((escala) => diasAteHoje(escala.data) >= diasAteHoje(hojeLocal()))
    .length;

  if (!podeEditar) return <AreaRestrita titulo="Cronograma" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Cronograma"
        descricao="Define qual equipe monta qual local em cada dia e etapa. Ao criar a escala, os itens do checklist das seções são gerados automaticamente."
        acoes={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  aria-label="Atualizar cronograma"
                >
                  <RefreshCw className={cn(isFetching && 'animate-spin')} />
                  Atualizar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recarregar os dados do servidor</TooltipContent>
            </Tooltip>
            {podeEditar && (
              <Button onClick={() => setCriando(true)}>
                <Plus />
                Nova escala
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard valor={escalas.length} rotulo="Escalas" icone={CalendarDays} carregando={isLoading} />
        <StatCard
          valor={equipesEscaladas}
          rotulo="Equipes escaladas"
          icone={UsersRound}
          carregando={isLoading}
        />
        <StatCard
          valor={proximas}
          rotulo="A partir de hoje"
          icone={CalendarPlus}
          tom={proximas > 0 ? 'marca' : 'neutro'}
          carregando={isLoading}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="sm:flex-1">
            <Label htmlFor="filtro-equipe" className="sr-only">
              Filtrar por equipe
            </Label>
            <SelectEscala value={filtroEquipe} onValueChange={setFiltroEquipe} />
          </div>
          <div className="sm:w-56">
            <Label htmlFor="filtro-periodo" className="sr-only">
              Filtrar por período
            </Label>
            <Select value={periodo} onValueChange={(valor) => setPeriodo(valor as Periodo)}>
              <SelectTrigger id="filtro-periodo" aria-label="Filtrar por período">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROTULO_PERIODO) as Periodo[]).map((valor) => (
                  <SelectItem key={valor} value={valor}>
                    {ROTULO_PERIODO[valor]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar o cronograma</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && !error && escalas.length === 0 && (
        <EmptyState
          icone={<CalendarDays />}
          titulo="Nenhuma escala cadastrada"
          descricao="Escale uma equipe para um local. A partir daí o app da equipe baixa as seções do dia e o checklist é materializado."
          acao={
            podeEditar ? (
              <Button onClick={() => setCriando(true)}>
                <Plus />
                Nova escala
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && escalas.length > 0 && filtradas.length === 0 && (
        <EmptyState
          icone={<MapPin />}
          titulo="Nenhuma escala no filtro"
          descricao="Ajuste a equipe ou o período."
          acao={
            <Button
              variant="outline"
              onClick={() => {
                setFiltroEquipe('todas');
                setPeriodo('todos');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      )}

      {!isLoading && !error && grupos.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {grupos.map((grupo) => (
            <CartaoDia
              key={grupo.data}
              data={grupo.data}
              escalas={grupo.lista}
              podeRemover={podeEditar}
              onEditar={setEditando}
            />
          ))}
        </div>
      )}

      <DialogoEscala aberto={criando} onFechar={() => setCriando(false)} />
      <DialogoEscala
        escala={editando}
        aberto={editando !== null}
        onFechar={() => setEditando(null)}
      />
    </div>
  );
}

/** Select de equipe com o carregamento das equipes (páginas já usam o hook). */
function SelectEscala({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  const { data, isLoading } = useEquipes();
  const equipes = data ?? [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id="filtro-equipe" aria-label="Filtrar por equipe">
        <SelectValue placeholder={isLoading ? 'Carregando equipes…' : 'Todas as equipes'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as equipes</SelectItem>
        {equipes.map((equipe) => (
          <SelectItem key={equipe.id} value={equipe.id}>
            {equipe.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ------------------------------------------------------------------ dia

function CartaoDia({
  data,
  escalas,
  podeRemover,
  onEditar,
}: {
  data: string;
  escalas: EscalaDetalhe[];
  podeRemover: boolean;
  onEditar: (escala: EscalaDetalhe) => void;
}) {
  const relativo = diasAteHoje(data);
  const hoje = relativo === 0;
  const queryClient = useQueryClient();
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  async function remover(escala: EscalaDetalhe) {
    setRemovendoId(escala.id);
    try {
      await removerEscala(escala.id);
      toast.success('Escala removida', {
        description: `${escala.equipeNome ?? 'A equipe'} deixou de montar este local.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['cronograma'] });
    } catch (causa) {
      toast.error('Não foi possível remover', {
        description: mensagemDeErro(causa, 'Tente novamente.'),
      });
    } finally {
      setRemovendoId(null);
      setConfirmandoId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {formatarDiaLongo(data)}
          </h2>
          {hoje && <Badge variant="brand">Hoje</Badge>}
          {!hoje && relativo === 1 && <Badge variant="secondary">Amanhã</Badge>}
          <span className="text-xs text-muted-foreground">
            {escalas.length} escala(s)
          </span>
        </div>

        <ul className="flex flex-col">
          {escalas.map((escala) => (
            <li
              key={escala.id}
              className="flex items-center justify-between gap-3 border-t border-border py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Badge variant={escala.etapa === 1 ? 'brand' : 'warning'} className="shrink-0">
                  Etapa {escala.etapa}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {escala.equipeNome ?? 'Equipe removida'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Zona {escala.localZona ?? '—'} · {escala.localNome ?? 'Local removido'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {escala.ordem != null && (
                  <Badge variant="secondary">Ordem {escala.ordem}</Badge>
                )}

                {podeRemover && removendoId === escala.id && (
                  <Button type="button" variant="ghost" size="sm" disabled>
                    Removendo…
                  </Button>
                )}

                {podeRemover && removendoId !== escala.id && confirmandoId === escala.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-danger">Remover esta escala?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void remover(escala)}
                    >
                      Sim, remover
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmandoId(null)}
                    >
                      Não
                    </Button>
                  </div>
                )}

                {podeRemover && removendoId !== escala.id && confirmandoId !== escala.id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditar(escala)}
                        aria-label="Editar escala"
                      >
                        <Pencil />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar escala</TooltipContent>
                  </Tooltip>
                )}

                {podeRemover && removendoId !== escala.id && confirmandoId !== escala.id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmandoId(escala.id)}
                        aria-label="Remover escala"
                      >
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remover escala</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ diálogo

function DialogoEscala({
  escala = null,
  aberto,
  onFechar,
}: {
  /** Escala sendo editada. Ausente (`null`) = criar nova escala. */
  escala?: EscalaDetalhe | null;
  aberto: boolean;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: equipes } = useEquipes();
  const { data: locais } = useLocaisCadastro();

  const [data, setData] = useState(escala?.data ?? hojeLocal());
  const [etapa, setEtapa] = useState<Etapa>(escala?.etapa ?? 1);
  const [equipeId, setEquipeId] = useState(escala?.equipe_id ?? '');
  const [localId, setLocalId] = useState(escala?.local_id ?? '');
  const [ordem, setOrdem] = useState(escala?.ordem != null ? String(escala.ordem) : '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const editando = escala !== null;

  const listaEquipes = equipes ?? [];
  const listaLocais = locais ?? [];

  // Opções do seletor de local: o rótulo mostra zona e nome; o endereço entra
  // apenas como texto de busca, para achar o local sem poluir a lista.
  const opcoesLocais = useMemo(
    () =>
      listaLocais.map((local) => ({
        value: local.id,
        label: `${local.zona}ª zona · ${local.nome}`,
        busca: local.endereco ?? undefined,
      })),
    [listaLocais],
  );

  // Preenche com os dados da escala toda vez que o diálogo abre, sem deixar o
  // estado de uma edição anterior vazando para a próxima.
  useEffect(() => {
    if (!aberto) return;
    setData(escala?.data ?? hojeLocal());
    setEtapa(escala?.etapa ?? 1);
    setEquipeId(escala?.equipe_id ?? '');
    setLocalId(escala?.local_id ?? '');
    setOrdem(escala?.ordem != null ? String(escala.ordem) : '');
    setErro(null);
  }, [aberto, escala]);

  function fechar() {
    if (enviando) return;
    setErro(null);
    onFechar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!data) return setErro('Informe a data da escala.');
    if (!equipeId) return setErro('Selecione a equipe.');
    if (!localId) return setErro('Selecione o local de votação.');
    const ordemValor = ordem.trim() === '' ? null : Number(ordem);
    if (ordemValor !== null && (!Number.isInteger(ordemValor) || ordemValor < 1)) {
      return setErro('A ordem deve ser um número inteiro maior que zero.');
    }

    setErro(null);
    setEnviando(true);
    try {
      const input = { data, etapa, equipe_id: equipeId, local_id: localId, ordem: ordemValor };
      if (editando && escala) {
        await atualizarEscala(escala.id, input, escala.local_id);
        toast.success('Escala atualizada', {
          description: 'Data, etapa, equipe e local foram salvos.',
        });
      } else {
        await criarEscala(input);
        toast.success('Escala criada', {
          description: 'As seções do local já podem ser baixadas pelo app da equipe.',
        });
      }
      setOrdem('');
      onFechar();
      await queryClient.invalidateQueries({ queryKey: ['cronograma'] });
      await queryClient.invalidateQueries({ queryKey: ['secoes'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(
        causa,
        editando ? 'Não foi possível atualizar a escala.' : 'Não foi possível criar a escala.',
      );
      setErro(mensagem);
      toast.error(
        editando ? 'Não foi possível atualizar a escala' : 'Não foi possível criar a escala',
        { description: mensagem },
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg p-0">
        <div className="border-b border-border p-5 pr-14">
          <DialogTitle>{editando ? 'Editar escala' : 'Nova escala'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Ajusta a data, a etapa, a equipe ou o local da escala. Se o local mudar, os itens do checklist são gerados para as seções dele.'
              : 'Marca que a equipe monta o local neste dia e etapa. Os itens do checklist são gerados automaticamente.'}
          </DialogDescription>
        </div>

        <form onSubmit={enviar} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5" noValidate>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="escala-data">Data</Label>
              <Input
                id="escala-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="escala-etapa">Etapa</Label>
              <Select
                value={String(etapa)}
                onValueChange={(valor) => setEtapa(valor === '2' ? 2 : 1)}
              >
                <SelectTrigger id="escala-etapa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Etapa 1 — Montagem</SelectItem>
                  <SelectItem value="2">Etapa 2 — Instalação da Urna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="escala-equipe">Equipe</Label>
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger id="escala-equipe">
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {listaEquipes.length === 0 && (
                  <SelectItem value="sem-equipes" disabled>
                    Cadastre uma equipe primeiro
                  </SelectItem>
                )}
                {listaEquipes.map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="escala-local">Local de votação</Label>
            <SelectBusca
              id="escala-local"
              value={localId}
              onValueChange={setLocalId}
              placeholder="Selecione o local"
              placeholderBusca="Buscar por nome"
              mensagemVazia="Cadastre um local primeiro"
              opcoes={opcoesLocais}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="escala-ordem">Ordem da visita (opcional)</Label>
            <Input
              id="escala-ordem"
              type="number"
              min={1}
              placeholder="ex.: 1"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
            />
          </div>

          {erro && (
            <Alert variant="destructive">
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <div className="flex flex-col gap-1">
                <AlertTitle>Confira os dados</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando && <LoaderCircle className="animate-spin" />}
              {editando ? 'Salvar alterações' : 'Criar escala'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
