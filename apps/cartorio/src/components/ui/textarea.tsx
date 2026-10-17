import { forwardRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Área de texto no estilo shadcn/ui (forwardRef para o react-hook-form). */
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
