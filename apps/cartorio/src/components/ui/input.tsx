import { forwardRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Campo de texto no estilo shadcn/ui.
 *
 * Precisa de `forwardRef`: o react-hook-form (`register`) usa a ref para ler o
 * valor do input. Sem ela (React 18), o valor chega `undefined` na validação.
 */
export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
