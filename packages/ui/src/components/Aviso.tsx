import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  type MessageBarProps,
} from '@fluentui/react-components';
import type { ReactNode } from 'react';

export type TomAviso = 'info' | 'sucesso' | 'alerta' | 'erro';

const INTENT: Record<TomAviso, NonNullable<MessageBarProps['intent']>> = {
  info: 'info',
  sucesso: 'success',
  alerta: 'warning',
  erro: 'error',
};

export interface AvisoProps {
  tom?: TomAviso;
  titulo?: string;
  children?: ReactNode;
}

/** Mensagem contextual no estilo do Teams (MessageBar). */
export function Aviso({ tom = 'info', titulo, children }: AvisoProps) {
  return (
    <MessageBar intent={INTENT[tom]}>
      <MessageBarBody>
        {titulo && <MessageBarTitle>{titulo}</MessageBarTitle>}
        {children}
      </MessageBarBody>
    </MessageBar>
  );
}
