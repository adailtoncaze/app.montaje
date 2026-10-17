import { Link } from 'react-router-dom';
import { ClipboardList, FileClock, MapPin } from 'lucide-react';
import { ROTULO_PAPEL } from '@montaje/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/stat-card';
import { useSessao } from '@/features/auth/store';
import { useLocais } from '@/lib/dados';

export function Inicio() {
  const perfil = useSessao((s) => s.perfil);
  const { data, isLoading } = useLocais();

  const locais = data ?? [];
  const totais = locais.reduce(
    (acc, local) => ({
      secoes: acc.secoes + local.totalSecoes,
      aguardando: acc.aguardando + local.aguardando,
      naoConformes: acc.naoConformes + local.naoConformes,
    }),
    { secoes: 0, aguardando: 0, naoConformes: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Início</h1>
        <p className="text-sm text-muted-foreground">
          Olá, {perfil?.nome ?? '—'}
          {perfil ? ` · ${ROTULO_PAPEL[perfil.papel]}` : ''}
        </p>
      </div>

      {isLoading ? (
        <Spinner label="Carregando resumo..." />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard valor={locais.length} rotulo="Local(is)" />
          <StatCard valor={totais.secoes} rotulo="Seções" />
          <StatCard valor={totais.aguardando} rotulo="Aguardando validação" tom="marca" />
          <StatCard
            valor={totais.naoConformes}
            rotulo="Sigilo não conforme"
            tom={totais.naoConformes > 0 ? 'erro' : 'neutro'}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Locais de votação</CardTitle>
              <CardDescription>
                Navegue por local, veja as seções e valide as evidências.
              </CardDescription>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground">
              <MapPin className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-fit">
              <Link to="/locais">
                <ClipboardList />
                Abrir locais
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Auditoria</CardTitle>
              <CardDescription>
                Histórico de validações e alterações de status. Entra no épico de auditoria.
              </CardDescription>
            </div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileClock className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-fit" disabled>
              Em breve
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
