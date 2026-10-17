import {
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useToastController,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Info24Filled,
  Warning24Filled,
} from '@fluentui/react-icons';
import { useCallback, useMemo, type ReactElement } from 'react';

/** Identificador do container de toasts do app (precisa ser único). */
export const ID_TOASTER = 'montaje-equipe-toasts';

/**
 * Container de toasts do Fluent. Deve ser montado uma única vez dentro do
 * `ProvedorMontaje` (feito no `AppShell`).
 */
export function ToasterAvisos() {
  return (
    <Toaster toasterId={ID_TOASTER} position="top-end" limit={3} timeout={4500} />
  );
}

type Intent = 'success' | 'error' | 'warning' | 'info';

export interface Avisos {
  /** Feedback positivo (ex.: item salvo, envio concluído). */
  sucesso: (titulo: string, descricao?: string) => void;
  /** Falha (ex.: envio, validação, captura de foto). */
  erro: (titulo: string, descricao?: string) => void;
  /** Atenção (ex.: dado incompleto, ação irreversível). */
  alerta: (titulo: string, descricao?: string) => void;
  /** Informação neutra. */
  info: (titulo: string, descricao?: string) => void;
}

const ICONE: Record<Intent, ReactElement> = {
  success: <CheckmarkCircle24Filled />,
  error: <DismissCircle24Filled />,
  warning: <Warning24Filled />,
  info: <Info24Filled />,
};

/**
 * Hook de feedback rápido (toasts). Funciona em qualquer tela que esteja
 * montada dentro do `AppShell` — sincronização, fotos e validações.
 *
 *   const avisos = useAvisos();
 *   avisos.sucesso('Item salvo', 'Envio automático na sequência.');
 */
export function useAvisos(): Avisos {
  const { dispatchToast } = useToastController(ID_TOASTER);

  const mostrar = useCallback(
    (intent: Intent, titulo: string, descricao?: string) => {
      dispatchToast(
        <Toast>
          <ToastTitle media={ICONE[intent]}>{titulo}</ToastTitle>
          {descricao && <ToastBody>{descricao}</ToastBody>}
        </Toast>,
        { intent, timeout: intent === 'error' ? 6500 : 4500 },
      );
    },
    [dispatchToast],
  );

  return useMemo<Avisos>(
    () => ({
      sucesso: (titulo, descricao) => mostrar('success', titulo, descricao),
      erro: (titulo, descricao) => mostrar('error', titulo, descricao),
      alerta: (titulo, descricao) => mostrar('warning', titulo, descricao),
      info: (titulo, descricao) => mostrar('info', titulo, descricao),
    }),
    [mostrar],
  );
}
