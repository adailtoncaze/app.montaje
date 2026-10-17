import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/page-header';

/**
 * Estado exibido quando um validador abre uma área de cadastro. As escritas
 * dependem do papel `administrador` (RLS `is_admin()`), então a tela nem
 * oferece as ações.
 */
export function AreaRestrita({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo={titulo} />
      <EmptyState
        icone={<ShieldAlert />}
        titulo="Área exclusiva de administradores"
        descricao="O cadastro de equipes e do cronograma é restrito ao perfil de administrador. Peça acesso ao responsável pelo painel."
      />
    </div>
  );
}
