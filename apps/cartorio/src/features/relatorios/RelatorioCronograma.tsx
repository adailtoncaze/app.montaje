import { useMemo, useState } from 'react';
import { CalendarDays, FileDown, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import type { Etapa } from '@montaje/core';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AreaRestrita } from '@/components/area-restrita';
import { PageHeader } from '@/components/page-header';
import { useAvisoErro } from '@/lib/avisos';
import { useCronograma, useEquipes, useLocaisCadastro } from '@/lib/cadastros';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';
import {
  FILTRO_PADRAO,
  filtroAtivo,
  montarRelatorio,
  ROTULO_ETAPA,
  rotuloPeriodo,
  type FiltroRelatorio,
} from './relatorio-cronograma';

/**
 * Tela de geração do PDF "Cronograma de Montagem de Seção" (Gestão →
 * Relatórios): filtros e resumo à esquerda, nenhum documento na tela — o PDF é
 * montado sob demanda pelo gerador (`gerar-pdf-cronograma.ts`, importado de
 * forma assíncrona para não pesar o carregamento inicial) e baixado com nome
 * `cronograma-montagem_<de>_a_<ate>.pdf`.
 *
 * Restrito a administradores, como a tela de Cronograma de onde vêm os dados.
 */
export function RelatorioCronograma() {
  const perfil = useSessao((s) => s.perfil);
  const podeVer = perfil?.papel === 'administrador';

  const cronograma = useCronograma({ enabled: podeVer });
  const equipes = useEquipes({ enabled: podeVer });
  const locais = useLocaisCadastro({ enabled: podeVer });
  const erro = cronograma.error ?? equipes.error ?? locais.error;
  useAvisoErro(erro);

  const [filtro, setFiltro] = useState<FiltroRelatorio>(FILTRO_PADRAO);
  const [gerando, setGerando] = useState(false);

  const relatorio = useMemo(
    () => montarRelatorio(filtro, cronograma.data ?? [], equipes.data ?? [], locais.data ?? []),
    [filtro, cronograma.data, equipes.data, locais.data],
  );

  const carregando = cronograma.isLoading || equipes.isLoading || locais.isLoading;
  const buscando = cronograma.isFetching || equipes.isFetching || locais.isFetching;
  const semDados = !carregando && !erro && relatorio.totais.escalas === 0;

  if (!podeVer) return <AreaRestrita titulo="Relatórios" />;

  function atualizar() {
    void Promise.all([cronograma.refetch(), equipes.refetch(), locais.refetch()]);
  }

  /** Monta o PDF e baixa direto, sem prévia e sem janela de impressão. */
  async function gerarPdf() {
    setGerando(true);
    try {
      const { baixarPdfCronograma } = await import('./gerar-pdf-cronograma');
      const nome = baixarPdfCronograma(relatorio);
      toast.success('PDF gerado', { description: `Arquivo ${nome} baixado.` });
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : 'Tente novamente.';
      toast.error('Não foi possível gerar o PDF', { description: mensagem });
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Relatórios"
        descricao="Cronograma de montagem por equipe, etapa e dia — membros, locais e endereços na ordem de visita. O PDF é baixado direto, sem prévia."
        acoes={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={atualizar}
                  disabled={buscando || !podeVer}
                  aria-label="Atualizar dados do relatório"
                >
                  <RefreshCw className={cn(buscando && 'animate-spin')} />
                  Atualizar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recarregar os dados do servidor</TooltipContent>
            </Tooltip>
            <Button onClick={gerarPdf} disabled={semDados || gerando || carregando}>
              {gerando ? <Loader2 className="animate-spin" /> : <FileDown />}
              {gerando ? 'Gerando PDF…' : 'Gerar PDF'}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="relatorio-de">Período — de</Label>
              <Input
                id="relatorio-de"
                type="date"
                value={filtro.de}
                max={filtro.ate || undefined}
                onChange={(evento) => setFiltro({ ...filtro, de: evento.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="relatorio-ate">Período — até</Label>
              <Input
                id="relatorio-ate"
                type="date"
                value={filtro.ate}
                min={filtro.de || undefined}
                onChange={(evento) => setFiltro({ ...filtro, ate: evento.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:w-56">
            <Label htmlFor="relatorio-equipe">Equipe</Label>
            <Select
              value={filtro.equipeId}
              onValueChange={(valor) => setFiltro({ ...filtro, equipeId: valor })}
            >
              <SelectTrigger id="relatorio-equipe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as equipes</SelectItem>
                {(equipes.data ?? []).map((equipe) => (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 lg:w-48">
            <Label htmlFor="relatorio-etapa">Etapa</Label>
            <Select
              value={String(filtro.etapa)}
              onValueChange={(valor) =>
                setFiltro({
                  ...filtro,
                  etapa: valor === 'todas' ? 'todas' : (Number(valor) as Etapa),
                })
              }
            >
              <SelectTrigger id="relatorio-etapa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                <SelectItem value="1">Etapa 1 — Montagem</SelectItem>
                <SelectItem value="2">Etapa 2 — Instalação da Urna</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtroAtivo(filtro) && (
            <Button variant="outline" onClick={() => setFiltro(FILTRO_PADRAO)}>
              Limpar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      {!carregando && !erro && !semDados && (
        <Card>
          <CardContent className="flex flex-col gap-1.5 p-5 text-sm text-muted-foreground">
            <p>
              No recorte atual: <strong className="font-semibold text-foreground">
                {rotuloPeriodo(relatorio.periodo)}
              </strong>
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <li>{relatorio.totais.equipes} equipe(s)</li>
              <li>{relatorio.totais.escalas} escala(s)</li>
              <li>
                {relatorio.totais.etapa1} na {ROTULO_ETAPA[1].toLowerCase()}
              </li>
              <li>
                {relatorio.totais.etapa2} na {ROTULO_ETAPA[2].toLowerCase()}
              </li>
              <li>{relatorio.totais.locais} local(is)</li>
              <li>{relatorio.totais.secoes} seção(ões)</li>
              {relatorio.zonas.length > 0 && (
                <li>Zona(s): {relatorio.zonas.join(', ')}</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {erro && (
        <Alert variant="destructive">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle>Não foi possível carregar o relatório</AlertTitle>
            <AlertDescription>
              {erro instanceof Error ? erro.message : 'Tente novamente.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {carregando && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}

      {!carregando && !erro && semDados && (
        <EmptyState
          icone={<CalendarDays />}
          titulo={filtroAtivo(filtro) ? 'Nenhuma escala no filtro' : 'Nenhuma escala cadastrada'}
          descricao={
            filtroAtivo(filtro)
              ? 'Ajuste o período, a equipe ou a etapa para gerar o PDF.'
              : 'Cadastre as escalas no cronograma para que este relatório consolide equipes, etapas e locais.'
          }
          acao={
            filtroAtivo(filtro) ? (
              <Button variant="outline" onClick={() => setFiltro(FILTRO_PADRAO)}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
