import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens,
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

const useClasses = makeStyles({
  barra: {
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow2,
  },
});

export interface AvisoProps {
  tom?: TomAviso;
  titulo?: string;
  children?: ReactNode;
  className?: string;
}

/** Mensagem contextual (MessageBar) com cantos arredondados e sombra suave. */
export function Aviso({ tom = 'info', titulo, children, className }: AvisoProps) {
  const c = useClasses();
  return (
    <MessageBar intent={INTENT[tom]} className={[c.barra, className].filter(Boolean).join(' ')}>
      <MessageBarBody>
        {titulo && <MessageBarTitle>{titulo}</MessageBarTitle>}
        {children}
      </MessageBarBody>
    </MessageBar>
  );
}
