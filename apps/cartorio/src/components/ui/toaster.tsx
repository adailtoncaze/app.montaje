import { Toaster as SonnerToaster } from 'sonner';
import { useTemaStore } from '@/lib/tema';

type TemaToaster = 'light' | 'dark' | 'system';

export function Toaster() {
  const tema = useTemaStore((s) => s.tema);
  const theme: TemaToaster = tema === 'escuro' ? 'dark' : tema === 'claro' ? 'light' : 'system';

  return (
    <SonnerToaster
      theme={theme}
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border border-border shadow-teams-4',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground hover:bg-primary-hover',
          cancelButton: 'bg-muted text-foreground hover:bg-accent',
          closeButton: 'border border-border bg-card text-foreground hover:bg-accent',
        },
      }}
    />
  );
}
