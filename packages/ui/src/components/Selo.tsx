import { Badge, type BadgeProps } from '@fluentui/react-components';

export type TomSelo = 'ok' | 'alerta' | 'erro' | 'neutro' | 'marca';

const COR: Record<TomSelo, NonNullable<BadgeProps['color']>> = {
  ok: 'success',
  alerta: 'warning',
  erro: 'danger',
  neutro: 'informative',
  marca: 'brand',
};

export interface SeloProps {
  texto: string;
  tom?: TomSelo;
}

/** Etiqueta de status no estilo do Teams. */
export function Selo({ texto, tom = 'neutro' }: SeloProps) {
  return (
    <Badge appearance="filled" color={COR[tom]} size="medium">
      {texto}
    </Badge>
  );
}
