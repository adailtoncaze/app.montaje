import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        info: 'border-info-border bg-info-bg text-info',
        success: 'border-success-border bg-success-bg text-success',
        warning: 'border-warning-border bg-warning-bg text-warning',
        destructive: 'border-danger-border bg-danger-bg text-danger',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

export type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

/** Mensagem contextual (equivalente ao MessageBar do Teams). */
export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('font-semibold', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('text-sm leading-relaxed', className)} {...props} />;
}

export function AlertIcon({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-0.5 [&_svg]:size-4', className)} {...props} />;
}
