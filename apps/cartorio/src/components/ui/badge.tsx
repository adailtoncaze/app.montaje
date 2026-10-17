import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'bg-brand-solid text-brand-solid-foreground',
        success: 'bg-success-solid text-success-solid-foreground',
        warning: 'bg-warning-solid text-warning-solid-foreground',
        danger: 'bg-danger-solid text-danger-solid-foreground',
        neutral: 'bg-neutral-solid text-neutral-solid-foreground',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

/** Selo/etiqueta no estilo do shadcn/ui, com as cores de estado do sistema de design. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
