import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

function obterIniciais(nome?: string | null) {
  if (!nome) return 'US';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'US';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ''}${partes[partes.length - 1][0] ?? ''}`.toUpperCase();
}

export interface AvatarProps extends ComponentProps<'span'> {
  nome?: string | null;
  tamanho?: 'xs' | 'sm' | 'md' | 'lg';
}

const tamanhos: Record<NonNullable<AvatarProps['tamanho']>, string> = {
  xs: 'size-6 text-[11px]',
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
};

export function Avatar({ nome, tamanho = 'md', className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-subtle font-semibold leading-none text-primary-subtle-foreground',
        tamanhos[tamanho],
        className,
      )}
      aria-label={nome ? `Avatar de ${nome}` : 'Avatar'}
      {...props}
    >
      {obterIniciais(nome)}
    </span>
  );
}
