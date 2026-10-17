import { useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROTULO_PAPEL } from '@montaje/core';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaRestrita } from '@/components/area-restrita';
import { Medalhao } from '@/components/medalhao';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { mensagemDeErro, useAvisoErro } from '@/lib/avisos';
import {
  adicionarMembro,
  buscarPerfilPorMatricula,
  criarEquipe,
  criarUsuarioEquipe,
  definirLider,
  excluirEquipe,
  renomearEquipe,
  removerMembro,
  useEquipes,
  type EquipeDetalhe,
  type MembroDetalhe,
} from '@/lib/cadastros';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';

/** Sigla do nome para o avatar do membro. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Equipes() {
  const papel = useSessao((s) => s.perfil?.papel);
  const podeEditar = papel === 'administrador';

  const { data, isLoading, error, refetch, isFetching } = useEquipes({ enabled: podeEditar });
  useAvisoErro(error);

  const [idAberta, setIdAberta] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const equipes = data ?? [];
  const membrosTotal = useMemo(
    () => equipes.reduce((total, equipe) => total + equipe.membros.length, 0),
    [equipes],
  );
  const semLider = equipes.filter((equipe) => equipe.liderNome === null).length;
  const aberta = equipes.find((equipe) => equipe.id === idAberta) ?? null;

  if (!podeEditar) return <AreaRestrita titulo="Equipes" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Equipes"
        descricao="Cada equipe recebe locais pelo cronograma e enxerga apenas as seções escaladas a ela."
        acoes={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                  aria-label="Atualizar lista de equipes"
                >
                  <RefreshCw className={cn(isFetching && 'animate-spin')} />
                  Atualizar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recarregar os dados do servidor</TooltipContent>
            </Tooltip>
            <Button onClick={() => setCriando(true)}>
              <Plus />
              Nova equipe
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard valor={equipes.length} rotulo="Equipes" icone={UsersRound} carregando={isLoading} />
        <StatCard valor={membrosTotal} rotulo="Membros" icone={UserRound} carregando={isLoading} />
        <StatCard
          valor={semLider}
          rotulo="Sem líder"
          icone={Crown}
          tom={semLider > 0 ? 'alerta' : 'neutro'}
          carregando={isLoading}
        />
        <StatCard
          valor={equipes.filter((e) => e.membros.length === 0).length}
          rotulo="Equipes vazias"
          icone={TriangleAlert}
          tom={equipes.some((e) => e.membros.length === 0) ? 'erro' : 'neutro'}
          carregando={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar as equipes</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && !error && equipes.length === 0 && (
        <EmptyState
          icone={<UsersRound />}
          titulo="Nenhuma equipe cadastrada"
          descricao="Crie a equipe, informe a matrícula dos servidores e defina o líder. Em seguida escalas os locais no cronograma."
          acao={
            <Button onClick={() => setCriando(true)}>
              <Plus />
              Nova equipe
            </Button>
          }
        />
      )}

      {!isLoading && !error && equipes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {equipes.map((equipe) => (
            <CartaoEquipe key={equipe.id} equipe={equipe} onGerenciar={() => setIdAberta(equipe.id)} />
          ))}
        </div>
      )}

      <DialogoNovaEquipe aberto={criando} onFechar={() => setCriando(false)} />

      {aberta && (
        <DialogoEquipe
          key={aberta.id}
          equipe={aberta}
          onFechar={() => setIdAberta(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ cartão

function CartaoEquipe({ equipe, onGerenciar }: { equipe: EquipeDetalhe; onGerenciar: () => void }) {
  const semLider = equipe.liderNome === null;
  const demais = equipe.membros.filter((membro) => !membro.lider);
  const visiveis = demais.slice(0, 8);

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Medalhao tom={semLider ? 'warning' : 'brand'}>
              <UsersRound className="size-5" />
            </Medalhao>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {equipe.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {equipe.membros.length === 0
                  ? 'Sem membros vinculados'
                  : `${equipe.membros.length} membro(s)`}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onGerenciar}>
            Gerenciar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {semLider ? (
            <Badge variant="warning">
              <Crown />
              Sem líder
            </Badge>
          ) : (
            <Badge variant="brand">
              <Crown />
              {equipe.liderNome}
            </Badge>
          )}
          {visiveis.map((membro) => (
            <Badge key={membro.id} variant="secondary">
              {membro.perfil.nome}
            </Badge>
          ))}
          {demais.length > visiveis.length && (
            <span className="text-xs text-muted-foreground">
              +{demais.length - visiveis.length}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ diálogo

function CabecalhoDialogo({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="border-b border-border p-5 pr-14">
      <DialogTitle>{titulo}</DialogTitle>
      {descricao && <DialogDescription>{descricao}</DialogDescription>}
    </div>
  );
}

/** Dialogo para criar a equipe (nome). */
function DialogoNovaEquipe({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setNome('');
    setErro(null);
    onFechar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const valor = nome.trim();
    if (!valor) {
      setErro('Informe o nome da equipe.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await criarEquipe(valor);
      toast.success('Equipe criada', {
        description: 'Agora adicione os membros e escalas os locais no cronograma.',
      });
      setNome('');
      onFechar();
      await queryClient.invalidateQueries({ queryKey: ['equipes'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível criar a equipe.');
      setErro(mensagem);
      toast.error('Não foi possível criar a equipe', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg p-0">
        <CabecalhoDialogo
          titulo="Nova equipe"
          descricao="A equipe entra no cronograma e passa a enxergar as seções dos locais escalados."
        />
        <form onSubmit={enviar} className="flex flex-col gap-4 p-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-equipe">Nome da equipe</Label>
            <Input
              id="nome-equipe"
              placeholder="Equipe A"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-invalid={Boolean(erro)}
              autoFocus
            />
            {erro && <p className="text-xs font-medium text-danger">{erro}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando && <LoaderCircle className="animate-spin" />}
              Criar equipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Dialogo de gestão: nome, membros, líder e exclusão da equipe. */
function DialogoEquipe({ equipe, onFechar }: { equipe: EquipeDetalhe; onFechar: () => void }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(equipe.nome);
  const [matricula, setMatricula] = useState('');
  const [novoMembro, setNovoMembro] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeAlterado = nome.trim() !== equipe.nome && nome.trim() !== '';

  async function executar(
    acao: () => Promise<void>,
    opcoes: { titulo: string; descricao: string },
  ) {
    setErro(null);
    setEnviando(true);
    try {
      await acao();
      toast.success(opcoes.titulo, { description: opcoes.descricao });
      await queryClient.invalidateQueries({ queryKey: ['equipes'] });
      return true;
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível concluir.');
      setErro(mensagem);
      toast.error(opcoes.titulo, { description: mensagem });
      return false;
    } finally {
      setEnviando(false);
    }
  }

  function salvarNome() {
    void executar(
      async () => {
        await renomearEquipe(equipe.id, nome.trim());
      },
      { titulo: 'Nome atualizado', descricao: 'A equipe foi renomeada.' },
    );
  }

  function adicionar() {
    const valor = matricula.trim().toLowerCase();
    if (!valor) {
      setErro('Informe a matrícula do membro.');
      return;
    }
    void executar(
      async () => {
        const perfil = await buscarPerfilPorMatricula(valor);
        if (!perfil) {
          throw new Error(
            `Nenhum perfil com a matrícula "${valor}". Cadastre o usuário em Supabase → Auth antes de adicionar.`,
          );
        }
        await adicionarMembro(equipe.id, perfil.id);
        setMatricula('');
      },
      { titulo: 'Membro adicionado', descricao: 'A equipe já enxerga o trabalho deste membro.' },
    );
  }

  function definirComoLider(perfilId: string) {
    void executar(
      async () => {
        await definirLider(equipe.id, perfilId);
      },
      { titulo: 'Líder definido', descricao: 'Somente um membro pode ser líder por equipe.' },
    );
  }

  function remover(membro: MembroDetalhe) {
    void executar(
      async () => {
        await removerMembro(membro.perfil_id);
        if (membro.lider) await definirLider(equipe.id, null);
      },
      { titulo: 'Membro removido', descricao: `${membro.perfil.nome} saiu da equipe.` },
    );
  }

  async function excluir() {
    const ok = await executar(
      async () => {
        await excluirEquipe(equipe.id);
      },
      { titulo: 'Equipe excluída', descricao: 'As escalas dela também foram removidas.' },
    );
    if (ok) onFechar();
  }

  return (
    <>
      <Dialog open={!novoMembro} onOpenChange={(v) => !v && onFechar()}>
        <DialogContent className="max-w-xl p-0">
          <CabecalhoDialogo
            titulo={equipe.nome}
            descricao={`${equipe.membros.length} membro(s) · ${equipe.liderNome ?? 'sem líder definido'}`}
          />

          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-5">
            {/* Nome */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome-equipe-edi">Nome da equipe</Label>
              <div className="flex gap-2">
                <Input
                  id="nome-equipe-edi"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={salvarNome}
                  disabled={!nomeAlterado || enviando}
                >
                  Salvar
                </Button>
              </div>
            </div>

            {/* Membros */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Membros
              </span>

              {equipe.membros.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Nenhum membro ainda. Adicione pela matrícula abaixo.
                </p>
              )}

              <ul className="flex flex-col gap-2">
                {equipe.membros.map((membro) => (
                  <li
                    key={membro.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <Medalhao tom={membro.lider ? 'brand' : 'neutral'} tamanho="sm">
                      {iniciais(membro.perfil.nome)}
                    </Medalhao>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                        {membro.perfil.nome}
                        {membro.lider && (
                          <Badge variant="brand">
                            <Crown />
                            Líder
                          </Badge>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Matrícula {membro.perfil.matricula} · {ROTULO_PAPEL[membro.perfil.papel]}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant={membro.lider ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => definirComoLider(membro.perfil_id)}
                            disabled={enviando}
                            aria-label={
                              membro.lider ? 'Remover a liderança' : 'Definir como líder'
                            }
                          >
                            <Crown className={cn(!membro.lider && 'opacity-60')} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {membro.lider ? 'Remover a liderança' : 'Definir como líder'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remover(membro)}
                            disabled={enviando}
                            aria-label={`Remover ${membro.perfil.nome} da equipe`}
                          >
                            <Trash2 />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover da equipe</TooltipContent>
                      </Tooltip>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Adicionar */}
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <Label htmlFor="membro-matricula">Adicionar membro pela matrícula</Label>
              <div className="flex gap-2">
                <Input
                  id="membro-matricula"
                  placeholder="matricula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && adicionar()}
                />
                <Button type="button" onClick={adicionar} disabled={enviando}>
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O usuário precisa já existir no Supabase (e-mail{' '}
                <span className="font-medium text-foreground">
                  {'<matrícula>'}@equipe.local
                </span>
                ). Se não existir, cadastre-o ao lado.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setNovoMembro(true)}>
                <Plus />
                Cadastrar novo membro
              </Button>
            </div>

            {erro && (
              <Alert variant="destructive">
                <AlertIcon>
                  <TriangleAlert />
                </AlertIcon>
                <div className="flex flex-col gap-1">
                  <AlertTitle>Não foi possível concluir</AlertTitle>
                  <AlertDescription>{erro}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between gap-2 border-t border-border p-4 pr-14">
            <div>
              {excluindo ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-danger">Excluir a equipe e suas escalas?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void excluir()}
                    disabled={enviando}
                  >
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExcluindo(false)}
                  >
                    Não
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger"
                  onClick={() => setExcluindo(true)}
                >
                  <Trash2 />
                  Excluir equipe
                </Button>
              )}
            </div>

            <Button type="button" variant="outline" onClick={onFechar}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogoNovoMembro
        equipeId={equipe.id}
        aberto={novoMembro}
        onFechar={() => setNovoMembro(false)}
      />
    </>
  );
}

/** Dialogo que cria a conta da equipe no Supabase e a vincula à equipe. */
function DialogoNovoMembro({
  equipeId,
  aberto,
  onFechar,
}: {
  equipeId: string;
  aberto: boolean;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const [codigo, setCodigo] = useState('');
  const [vinculo, setVinculo] = useState<'servidor' | 'alvt'>('servidor');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setNome('');
    setMatricula('');
    setCodigo('');
    setErro(null);
    onFechar();
  }

  function validar(): string | null {
    if (nome.trim().length < 3) return 'Informe o nome completo.';
    if (!/^[0-9A-Za-z._-]{3,}$/.test(matricula.trim())) {
      return 'Matrícula inválida (use letras, números, ponto, hífen ou sublinhado).';
    }
    if (codigo.trim().length < 6) return 'O código precisa ter ao menos 6 caracteres.';
    return null;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await criarUsuarioEquipe({ nome, matricula, codigo, vinculo });
      if (resultado.perfilId) {
        try {
          await adicionarMembro(equipeId, resultado.perfilId);
        } catch {
          // Já era membro: o cadastro em si deu certo.
        }
      }
      toast.success(resultado.criado ? 'Membro cadastrado' : 'Membro vinculado', {
        description: resultado.aviso ?? 'A conta já pode entrar no app da equipe.',
      });
      fechar();
      await queryClient.invalidateQueries({ queryKey: ['equipes'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível cadastrar o membro.');
      setErro(mensagem);
      toast.error('Não foi possível cadastrar', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg p-0">
        <CabecalhoDialogo
          titulo="Cadastrar membro da equipe"
          descricao="Cria o acesso no Supabase com a matrícula e o código — depois é só confirmar a vinculação."
        />
        <form onSubmit={enviar} className="flex flex-col gap-4 p-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-nome">Nome completo</Label>
            <Input
              id="novo-nome"
              placeholder="Maria da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-matricula">Matrícula</Label>
            <Input
              id="novo-matricula"
              placeholder="12345"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Vira o e-mail de acesso <span className="font-medium">{'<matrícula>'}@equipe.local</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-codigo">Código de acesso (senha)</Label>
            <Input
              id="novo-codigo"
              type="password"
              placeholder="mínimo 6 caracteres"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="novo-vinculo">Vínculo</Label>
            <Select
              value={vinculo}
              onValueChange={(valor) => setVinculo(valor === 'alvt' ? 'alvt' : 'servidor')}
            >
              <SelectTrigger id="novo-vinculo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servidor">Servidor</SelectItem>
                <SelectItem value="alvt">ALVT</SelectItem>
              </SelectContent>
            </Select>
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
              Cadastrar e adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
