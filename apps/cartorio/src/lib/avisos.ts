import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/** Extrai uma mensagem legível de um erro desconhecido. */
export function mensagemDeErro(erro: unknown, padrao = 'Tente novamente.'): string {
  if (erro instanceof Error && erro.message.trim()) return erro.message;
  if (typeof erro === 'string' && erro.trim()) return erro;
  return padrao;
}

/**
 * Dispara um toast de erro uma única vez por mensagem — usado nos erros de
 * carregamento das telas, sem repetir o aviso a cada re-render.
 */
export function useAvisoErro(erro: unknown, titulo = 'Não foi possível carregar os dados') {
  const ultimo = useRef<string | null>(null);
  const mensagem = erro ? mensagemDeErro(erro) : null;

  useEffect(() => {
    if (!mensagem || ultimo.current === mensagem) return;
    ultimo.current = mensagem;
    toast.error(titulo, { description: mensagem });
  }, [mensagem, titulo]);
}
