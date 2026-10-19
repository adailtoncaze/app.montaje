import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adicionarSecao, atualizarLocal, criarLocal, excluirSecao } from '@/lib/cadastros';
import { mensagemDeErro } from '@/lib/avisos';
import type { SecaoResumo } from '@/lib/dados';

/**
 * Conversa uma lista escrita pelo operador ("101, 102 103") em números.
 * Retorna `null` quando há algum token que não é número.
 */
function paraNumeros(texto: string): number[] | null {
  const tokens = texto.split(/[\s,;]+/).filter(Boolean);
  if (tokens.some((token) => !/^\d+$/.test(token))) return null;
  return [...new Set(tokens.map(Number))].sort((a, b) => a - b);
}

function DialogoBase({
  titulo,
  descricao,
  aberto,
  onFechar,
  children,
}: {
  titulo: string;
  descricao: string;
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-lg p-0">
        <div className="border-b border-border p-5 pr-14">
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Cria o local de votação com as seções. */
export function DialogoNovoLocal({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [zona, setZona] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [secoes, setSecoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setZona('');
    setNome('');
    setEndereco('');
    setSecoes('');
    setErro(null);
    onFechar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const zonaValor = Number(zona);
    if (!Number.isInteger(zonaValor) || zonaValor < 1) {
      setErro('Informe a zona como um número inteiro maior que zero.');
      return;
    }
    if (nome.trim().length < 3) {
      setErro('Informe o nome do local.');
      return;
    }
    const numeros = paraNumeros(secoes);
    if (numeros === null) {
      setErro('Use apenas números nas seções, separados por vírgula ou espaço.');
      return;
    }
    if (!numeros.length) {
      setErro('Informe ao menos uma seção.');
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      const local = await criarLocal({
        zona: zonaValor,
        nome,
        endereco: endereco.trim() || null,
        secoes: numeros,
      });
      toast.success('Local cadastrado', {
        description: `${numeros.length} seção(ões) criadas. Agora coloque o local no cronograma.`,
      });
      fechar();
      await queryClient.invalidateQueries({ queryKey: ['secoes'] });
      await queryClient.invalidateQueries({ queryKey: ['locais-cadastro'] });
      navigate(`/locais/${local.id}`);
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível cadastrar o local.');
      setErro(mensagem);
      toast.error('Não foi possível cadastrar', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <DialogoBase
      titulo="Novo local de votação"
      descricao="Cadastre o local e as seções. O cronograma é feito em seguida, na tela Cronograma."
      aberto={aberto}
      onFechar={fechar}
    >
      <form onSubmit={enviar} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="local-zona">Zona</Label>
          <Input
            id="local-zona"
            type="number"
            min={1}
            placeholder="ex.: 1"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="local-nome">Nome do local</Label>
          <Input
            id="local-nome"
            placeholder="Escola Municipal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="local-endereco">Endereço (opcional)</Label>
          <Input
            id="local-endereco"
            placeholder="Rua, número"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="local-secoes">Seções</Label>
          <Input
            id="local-secoes"
            placeholder="101, 102, 103"
            value={secoes}
            onChange={(e) => setSecoes(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Números separados por vírgula ou espaço. Novas seções podem ser acrescentadas depois,
            na página do local.
          </p>
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
            Cadastrar local
          </Button>
        </div>
      </form>
    </DialogoBase>
  );
}

/** Dados cadastrais editáveis do local (as seções ficam na página do local). */
export interface LocalEditavel {
  id: string;
  zona: number;
  nome: string;
  endereco: string | null;
}

/** Edita zona, nome e endereço de um local já cadastrado. */
export function DialogoEditarLocal({
  local,
  aberto,
  onFechar,
}: {
  local: LocalEditavel;
  aberto: boolean;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [zona, setZona] = useState(String(local.zona));
  const [nome, setNome] = useState(local.nome);
  const [endereco, setEndereco] = useState(local.endereco ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche com os dados atuais toda vez que o diálogo abre, sem deixar o
  // estado de uma edição anterior vazando para a próxima.
  useEffect(() => {
    if (!aberto) return;
    setZona(String(local.zona));
    setNome(local.nome);
    setEndereco(local.endereco ?? '');
    setErro(null);
  }, [aberto, local]);

  function fechar() {
    if (enviando) return;
    onFechar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const zonaValor = Number(zona);
    if (!Number.isInteger(zonaValor) || zonaValor < 1) {
      setErro('Informe a zona como um número inteiro maior que zero.');
      return;
    }
    if (nome.trim().length < 3) {
      setErro('Informe o nome do local.');
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await atualizarLocal({
        id: local.id,
        zona: zonaValor,
        nome,
        endereco: endereco.trim() || null,
      });
      toast.success('Local atualizado', {
        description: 'Zona, nome e endereço foram salvos.',
      });
      fechar();
      await queryClient.invalidateQueries({ queryKey: ['secoes'] });
      await queryClient.invalidateQueries({ queryKey: ['locais-cadastro'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível atualizar o local.');
      setErro(mensagem);
      toast.error('Não foi possível atualizar', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <DialogoBase
      titulo="Editar local de votação"
      descricao={'As seções do local são gerenciadas na página do local, em "Nova seção".'}
      aberto={aberto}
      onFechar={fechar}
    >
      <form onSubmit={enviar} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="editar-local-zona">Zona</Label>
          <Input
            id="editar-local-zona"
            type="number"
            min={1}
            placeholder="ex.: 1"
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="editar-local-nome">Nome do local</Label>
          <Input
            id="editar-local-nome"
            placeholder="Escola Municipal"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="editar-local-endereco">Endereço (opcional)</Label>
          <Input
            id="editar-local-endereco"
            placeholder="Rua, número"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
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
            Salvar alterações
          </Button>
        </div>
      </form>
    </DialogoBase>
  );
}

/** Acrescenta uma seção a um local já cadastrado. */
export function DialogoNovaSecao({
  localId,
  aberto,
  onFechar,
}: {
  localId: string;
  aberto: boolean;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [numero, setNumero] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setNumero('');
    setErro(null);
    onFechar();
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const valor = Number(numero);
    if (!Number.isInteger(valor) || valor < 1) {
      setErro('Informe o número da seção como um número inteiro maior que zero.');
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await adicionarSecao(localId, valor);
      toast.success('Seção criada', {
        description:
          'As seções já entram com o checklist gerado quando o local tem escala no cronograma.',
      });
      fechar();
      await queryClient.invalidateQueries({ queryKey: ['secoes'] });
      await queryClient.invalidateQueries({ queryKey: ['locais-cadastro'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível criar a seção.');
      setErro(mensagem);
      toast.error('Não foi possível criar a seção', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <DialogoBase
      titulo="Nova seção"
      descricao="Acrescenta uma seção ao local de votação."
      aberto={aberto}
      onFechar={fechar}
    >
      <form onSubmit={enviar} className="flex flex-col gap-4 p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="secao-numero">Número da seção</Label>
          <Input
            id="secao-numero"
            type="number"
            min={1}
            placeholder="ex.: 105"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            autoFocus
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
            Criar seção
          </Button>
        </div>
      </form>
    </DialogoBase>
  );
}

/**
 * Confirma a exclusão de uma seção do local. Exclui em cascata o checklist,
 * as fotos, as respostas de sigilo e o histórico de validações da seção —
 * por isso pede confirmação explícita antes de agir.
 */
export function DialogoExcluirSecao({
  secao,
  onFechar,
}: {
  /** A seção a excluir; o diálogo fica fechado enquanto for `null`. */
  secao: SecaoResumo | null;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setErro(null);
    onFechar();
  }

  async function excluir() {
    if (!secao) return;

    setErro(null);
    setEnviando(true);
    try {
      await excluirSecao(secao.local_id, secao.id);
      toast.success(`Seção ${secao.numero} excluída`, {
        description: 'O checklist, as fotos e as validações da seção também foram removidos.',
      });
      fechar();
      await queryClient.invalidateQueries({ queryKey: ['secoes'] });
      await queryClient.invalidateQueries({ queryKey: ['locais-cadastro'] });
    } catch (causa) {
      const mensagem = mensagemDeErro(causa, 'Não foi possível excluir a seção.');
      setErro(mensagem);
      toast.error('Não foi possível excluir a seção', { description: mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={secao !== null} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-lg p-0">
        <div className="border-b border-border p-5 pr-14">
          <DialogTitle>Excluir a seção {secao?.numero}?</DialogTitle>
          <DialogDescription>
            A seção sai do local de votação junto com o checklist, as fotos, as respostas de
            sigilo e o histórico de validações. Esta ação não pode ser desfeita.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {erro && (
            <Alert variant="destructive">
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <div className="flex flex-col gap-1">
                <AlertTitle>Não foi possível excluir</AlertTitle>
                <AlertDescription>{erro}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void excluir()}
              disabled={enviando}
            >
              {enviando && <LoaderCircle className="animate-spin" />}
              Excluir seção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
