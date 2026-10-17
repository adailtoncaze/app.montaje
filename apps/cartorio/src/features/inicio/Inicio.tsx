import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/stat-card';
import { ROTULO_PAPEL } from '@montaje/core';
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
      correcoes: acc.correcoes + local.correcoes,
      naoConformes: acc.naoConformes + local.naoConformes,
      concluidas: acc.concluidas + local.concluidas,
    }),
    { secoes: 0, aguardando: 0, correcoes: 0, naoConformes: 0, concluidas: 0 },
  );

  const progresso = totais.secoes > 0 ? Math.round((totais.concluidas / totais.secoes) * 100) : 0;

  const pendencia =
    totais.naoConformes > 0
      ? { tom: 'danger' as const, texto: `${totais.naoConformes} com sigilo não conforme` }
      : totais.correcoes > 0
        ? { tom: 'danger' as const, texto: `${totais.correcoes} com correção solicitada` }
        : totais.aguardando > 0
          ? { tom: 'brand' as const, texto: `${totais.aguardando} aguardando validação` }
          : { tom: 'success' as const, texto: 'Sem pendências' };

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
        <>
          <Card>
            <CardContent className="gap-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Progresso geral
                  </span>
                  <span className="text-4xl font-bold leading-none text-foreground">
                    {progresso}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {totais.concluidas} de {totais.secoes} seções concluídas
                  </span>
                </div>
                <Badge variant={pendencia.tom}>{pendencia.texto}</Badge>
              </div>
              <Progress value={progresso} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard valor={locais.length} rotulo="Locais de votação" />
            <StatCard valor={totais.secoes} rotulo="Seções" />
            <StatCard
              valor={totais.aguardando}
              rotulo="Aguardando validação"
              tom={totais.aguardando > 0 ? 'marca' : 'neutro'}
            />
            <StatCard
              valor={totais.correcoes}
              rotulo="Com correção"
              tom={totais.correcoes > 0 ? 'erro' : 'neutro'}
            />
            <StatCard
              valor={totais.naoConformes}
              rotulo="Sigilo não conforme"
              tom={totais.naoConformes > 0 ? 'erro' : 'neutro'}
            />
            <StatCard valor={totais.concluidas} rotulo="Seções concluídas" />
          </div>
        </>
      )}
    </div>
  );
}
