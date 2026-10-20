import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface OpcaoBusca {
  /** Valor enviado ao formulário. */
  value: string;
  /** Texto exibido na lista e usado na busca. */
  label: string;
  /** Texto adicional pesquisável que não aparece na tela (ex.: endereço). */
  busca?: string;
}

interface SelectBuscaProps {
  id?: string;
  value: string;
  onValueChange: (valor: string) => void;
  opcoes: OpcaoBusca[];
  /** Texto do gatilho quando nada está selecionado. */
  placeholder?: string;
  /** Texto do campo de busca dentro da lista. */
  placeholderBusca?: string;
  /** Mensagem exibida quando a lista está vazia. */
  mensagemVazia?: ReactNode;
  /** Limite de opções renderizadas a cada abertura da lista. */
  limite?: number;
  className?: string;
}

/**
 * `Select` com campo de busca embutido na lista — para listas longas em que
 * rolar até a opção é pior do que digitar parte do nome. Filtra por `label` e
 * por `busca`, mostrando as primeiras `limite` opções para não pesar o DOM.
 */
export function SelectBusca({
  id,
  value,
  onValueChange,
  opcoes,
  placeholder,
  placeholderBusca = 'Buscar...',
  mensagemVazia,
  limite = 50,
  className,
}: SelectBuscaProps) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  // Evita que o Radix feche a lista quando o foco sai do gatilho para o campo
  // de busca: enquanto a lista está aberta, o clique é tratado aqui.
  const campoRef = useRef<HTMLInputElement | null>(null);

  // Cada abertura começa com a lista completa, sem o termo da vez anterior.
  useEffect(() => {
    if (!aberto) setTermo('');
  }, [aberto]);

  // O Radix foca o próprio viewport ao abrir; devolvemos o foco ao campo de
  // busca para o usuário já poder digitar. Um `setTimeout` roda depois do
  // efeito de foco do Radix, então o campo realmente fica com o foco.
  useEffect(() => {
    if (!aberto) return;
    const timer = setTimeout(() => campoRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [aberto]);

  const filtradas = useMemo(() => {
    const alvo = termo.trim().toLowerCase();
    if (!alvo) return opcoes.slice(0, limite);
    return opcoes
      .filter((opcao) => `${opcao.label} ${opcao.busca ?? ''}`.toLowerCase().includes(alvo))
      .slice(0, limite);
  }, [opcoes, termo, limite]);

  const semResultado = filtradas.length === 0;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      open={aberto}
      onOpenChange={setAberto}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b border-border bg-popover p-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={campoRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder={placeholderBusca}
              aria-label={placeholderBusca}
              className={cn(
                'h-8 w-full rounded-md border border-input bg-card pl-7 pr-2 text-sm text-foreground shadow-sm',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
              )}
              // Sem isto, o Radix trata as letras como typeahead e a lista pula
              // entre as opções enquanto se digita. As setas, Home, End, Enter
              // e Escape passam, para continuar navegando e selecionando.
              onKeyDown={(e) => {
                const navegacao = [
                  'ArrowDown',
                  'ArrowUp',
                  'Home',
                  'End',
                  'Enter',
                  'Escape',
                  'Tab',
                ];
                if (!navegacao.includes(e.key)) e.stopPropagation();
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {semResultado ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {termo.trim() ? 'Nenhum resultado para a busca.' : mensagemVazia ?? 'Nenhuma opção disponível.'}
          </div>
        ) : (
          filtradas.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
