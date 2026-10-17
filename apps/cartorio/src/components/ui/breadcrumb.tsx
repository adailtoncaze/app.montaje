import { ChevronRight, MoreHorizontal } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Breadcrumb({ ...props }: ComponentProps<'nav'>) {
  return <nav aria-label="Breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

export interface BreadcrumbLinkProps extends ComponentProps<typeof Link> {
  asChild?: boolean;
}

export function BreadcrumbLink({ className, to, ...props }: BreadcrumbLinkProps) {
  return <Link to={to} className={cn('transition-colors hover:text-foreground', className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span className={cn('font-semibold text-foreground', className)} aria-current="page" {...props} />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-4', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
    </span>
  );
}
