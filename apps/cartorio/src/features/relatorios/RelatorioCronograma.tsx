import { useMemo, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  FileText,
  MapPin,
  Printer,
  RefreshCw,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { ROTULO_STATUS_ETAPA, type Etapa } from '@montaje/core';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatarDataCurta, hojeLocal } from '@/lib/datas';
import { ROTULO_SITUACAO } from '@/lib/status-ui';
import { useSessao } from '@/features/auth/store';
import { cn } from '@/lib/utils';
import {
  descreverMembro,
  FILTRO_PADRAO,
  filtroAtivo,
  montarRelatorio,
  ROTULO_ETAPA,
  rotuloVinculo,
  type EquipeRelatorio,
  type EscalaRelatorio,
  type FiltroRelatorio,
  type LocalRelatorio,
} from './relatorio-cronograma';

const FORMATO_EMISSAO = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/** "17/10/2026 a 24/10/2026" (ou o limite que existir). */
function rotuloPeriodo(periodo: { de: string | null; ate: string | null }): string {
  const { de, ate } = periodo;
  if (de && ate) {
    return de === ate
      ? formatarDataCurta(de)
      : `${formatarDataCurta(de)} a ${formatarDataCurta(ate)}`;
  }
  if (de) return `A partir de ${formatarDataCurta(de)}`;
  if (ate) return `Até ${formatarDataCurta(ate)}`;
  return 'Sem período';
}

function TituloSecao({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 print:break-after-avoid">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
        <Icone />
      </span>
      <div className="flex min-w-0 flex-col">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{titulo}</h3>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </div>
    </div>
  );
}

function ItemResumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs leading-snug text-muted-foreground">{rotulo}</dt>
      <dd className="text-lg font-semibold tabular-nums text-foreground">{valor}</dd>
    </div>
  );
}

/**
 * Uma escala dentro do cronograma do dia: ordem de visita, local com endereço,
 * equipe com membros e o quadro de seções com a situação de cada etapa.
 */
function ItemEscala({ escala }: { escala: EscalaRelatorio }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 print:break-inside-avoid print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            {escala.ordem != null ? `Ordem ${escala.ordem}` : 'Sem ordem'}
          </Badge>
          <p className="min-w-0 text-sm font-semibold text-foreground">
            Zona {escala.local.zona} · {escala.local.nome}
          </p>
        </div>
        <Badge variant="brand">{escala.equipe.nome}</Badge>
      </div>

      {escala.local.endereco && (
        <p className="text-xs text-muted-foreground">{escala.local.endereco}</p>
      )}

      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <p>
          Líder:{' '}
          <span className="font-medium text-foreground">{escala.equipe.lider ?? '—'}</span>
          {' · '}
          {escala.equipe.membros.length} membro(s)
        </p>
        {escala.equipe.membros.length > 0 && (
          <p className="leading-relaxed">
            {escala.equipe.membros.map(descreverMembro).join(' · ')}
          </p>
        )}
      </div>

      {escala.secoes.length > 0 ? (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-1 pr-3 font-medium">
                Seção
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                Etapa 1
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                Etapa 2
              </th>
              <th scope="col" className="py-1 font-medium">
                Situação
              </th>
            </tr>
          </thead>
          <tbody>
            {escala.secoes.map((secao) => (
              <tr key={secao.numero} className="border-b border-border/60 last:border-0">
                <th
                  scope="row"
                  className="py-1 pr-3 text-left font-medium tabular-nums text-foreground"
                >
                  {secao.numero}
                </th>
                <td className="py-1 pr-3 text-muted-foreground">
                  {ROTULO_STATUS_ETAPA[secao.etapa1]}
                </td>
                <td className="py-1 pr-3 text-muted-foreground">
                  {ROTULO_STATUS_ETAPA[secao.etapa2]}
                </td>
                <td className="py-1 text-muted-foreground">
                  {ROTULO_SITUACAO[secao.situacao]}
                  {!secao.conforme && ' · sigilo não conforme'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma seção cadastrada para este local.
        </p>
      )}
    </li>
  );
}

function CartaoEquipe({ equipe }: { equipe: EquipeRelatorio }) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 print:break-inside-avoid print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{equipe.nome}</h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">
            {equipe.totalEscalas} escala(s) · {equipe.datas.length} dia(s)
          </Badge>
          <Badge variant="secondary">
            {equipe.etapas.map((etapa) => `E${etapa}`).join(' · ')}
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Líder: <span className="font-medium text-foreground">{equipe.lider ?? '—'}</span>
        {' · '}
        {equipe.membros.length} membro(s)
      </p>

      <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
        {equipe.membros.map((membro) => (
          <li key={membro.matricula} className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-foreground">{membro.nome}</span>
            <span>
              · {membro.matricula} · {rotuloVinculo(membro.vinculo)}
            </span>
            {membro.lider && <Badge variant="brand">Líder</Badge>}
          </li>
        ))}
        {equipe.membros.length === 0 && <li>Sem membros cadastrados.</li>}
      </ul>

      <p className="text-xs text-muted-foreground">
        Dias: {equipe.datas.map(formatarDataCurta).join(' · ')}
      </p>
      <p className="text-xs text-muted-foreground">Locais: {equipe.locais.join(' · ')}</p>
    </article>
  );
}

/**
 * Relatório de cronograma de montagem, com geração de PDF pela janela de
 * impressão do navegador (padrão já usado pelo manual — ver `@media print` em
 * `styles/index.css`, classe `.relatorio-impressao` para "papel branco").
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

  const relatorio = useMemo(
    () => montarRelatorio(filtro, cronograma.data ?? [], equipes.data ?? [], locais.data ?? []),
    [filtro, cronograma.data, equipes.data, locais.data],
  );
  const emitidoEm = useMemo(() => FORMATO_EMISSAO.format(new Date()), [relatorio]);

  const carregando = cronograma.isLoading || equipes.isLoading || locais.isLoading;
  const buscando = cronograma.isFetching || equipes.isFetching || locais.isFetching;
  const semDados = !carregando && !erro && relatorio.totais.escalas === 0;

  if (!podeVer) return <AreaRestrita titulo="Relatórios" />;

  function atualizar() {
    void Promise.all([cronograma.refetch(), equipes.refetch(), locais.refetch()]);
  }

  /**
   * Abre a janela de impressão com nome de arquivo sugerido pelo período.
   * O usuário escolhe "Salvar como PDF" (Chrome/Edge/Firefox).
   */
  function gerarPdf() {
    const tituloAnterior = document.title;
    const { de, ate } = relatorio.periodo;
    const intervalo = de && ate ? `${de}_a_${ate}` : (de ?? ate ?? hojeLocal());
    document.title = `cronograma-montagem_${intervalo}`;
    const restaurarTitulo = () => {
      document.title = tituloAnterior;
    };
    window.addEventListener('afterprint', restaurarTitulo, { once: true });
    window.print();
    // Nem todo navegador dispara `afterprint` (mobile): garante o restauro.
    window.setTimeout(restaurarTitulo, 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 print:hidden">
        <PageHeader
          titulo="Relatórios"
          descricao="Cronograma de montagem consolidado por dia e etapa, com equipes, membros e locais de votação. O PDF é gerado pela janela de impressão do navegador."
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={gerarPdf} disabled={semDados || !podeVer}>
                    <Printer />
                    Gerar PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Abre a impressão: escolha &ldquo;Salvar como PDF&rdquo;
                </TooltipContent>
              </Tooltip>
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
                  <SelectItem value="2">Etapa 2 — Sigilo do voto</SelectItem>
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
      </div>

      {erro && (
        <Alert variant="destructive" className="print:hidden">
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
        <div className="flex flex-col gap-4 print:hidden">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {!carregando && !erro && semDados && (
        <EmptyState
          className="print:hidden"
          icone={<CalendarDays />}
          titulo={filtroAtivo(filtro) ? 'Nenhuma escala no filtro' : 'Nenhuma escala cadastrada'}
          descricao={
            filtroAtivo(filtro)
              ? 'Ajuste o período, a equipe ou a etapa para gerar o relatório.'
              : 'Cadastre as escalas no cronograma para que este relatório consolide dias, equipes e locais.'
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

      {!carregando && !erro && !semDados && (
        <div className="relatorio-impressao mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-none print:max-w-none print:gap-4 print:rounded-none print:border-0 print:p-0">
          <header className="flex flex-col gap-1 border-b border-border pb-3 print:break-inside-avoid">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground [&_svg]:size-4 print:bg-transparent print:text-foreground">
                <FileText />
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Relatório de cronograma de montagem
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {rotuloPeriodo(relatorio.periodo)} · {relatorio.totais.dias} dia(s) ·{' '}
              {relatorio.totais.escalas} escala(s)
            </p>
            <p className="text-xs text-muted-foreground">
              Emitido em {emitidoEm}
              {perfil?.nome && ` · por ${perfil.nome}`} · MontaJE · Cartório
              {filtroAtivo(filtro) && ' · filtros aplicados'}
            </p>
          </header>

          <Card className="print:break-inside-avoid print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Totais do período selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                <ItemResumo rotulo="Dias" valor={relatorio.totais.dias} />
                <ItemResumo rotulo="Escalas" valor={relatorio.totais.escalas} />
                <ItemResumo rotulo={ROTULO_ETAPA[1]} valor={relatorio.totais.etapa1} />
                <ItemResumo rotulo={ROTULO_ETAPA[2]} valor={relatorio.totais.etapa2} />
                <ItemResumo rotulo="Equipes" valor={relatorio.totais.equipes} />
                <ItemResumo rotulo="Locais de votação" valor={relatorio.totais.locais} />
                <ItemResumo rotulo="Seções" valor={relatorio.totais.secoes} />
              </dl>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-4">
            <TituloSecao
              icone={CalendarDays}
              titulo="Cronograma por dia"
              descricao="Escalas de cada dia, por etapa e na ordem de visita."
            />

            {relatorio.dias.map((dia) => (
              <article key={dia.data} className="flex flex-col gap-3">
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 print:break-after-avoid">
                  <h4 className="text-base font-semibold text-foreground">{dia.rotulo}</h4>
                  <span className="text-xs text-muted-foreground">
                    {dia.totalEscalas} escala(s)
                  </span>
                </header>

                {dia.etapas.map((bloco) => (
                  <div key={bloco.etapa} className="flex flex-col gap-2">
                    <h5 className="text-sm font-semibold text-primary print:break-after-avoid">
                      {ROTULO_ETAPA[bloco.etapa]}
                    </h5>
                    <ol className="flex flex-col gap-3">
                      {bloco.escalas.map((escala) => (
                        <ItemEscala key={escala.id} escala={escala} />
                      ))}
                    </ol>
                  </div>
                ))}
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <TituloSecao
              icone={UsersRound}
              titulo="Equipes consolidadas"
              descricao="Membros de cada equipe e os locais que atendem no período."
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {relatorio.equipes.map((equipe) => (
                <CartaoEquipe key={equipe.id} equipe={equipe} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <TituloSecao
              icone={MapPin}
              titulo="Locais de votação"
              descricao="Endereço, seções e escalas de cada local, na ordem da primeira visita."
            />
            <div className="overflow-x-auto rounded-xl border border-border print:overflow-visible print:rounded-none print:border-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted text-left text-xs font-medium text-muted-foreground print:bg-transparent">
                    <th scope="col" className="px-3 py-2">
                      Ordem
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Zona
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Local
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Seções
                    </th>
                    <th scope="col" className="px-3 py-2">
                      Escalas (data · etapa · equipe)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.locais.map((local) => (
                    <LinhaLocal key={local.id} local={local} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/** Linha da tabela de locais: posição na visita, zona, endereço, seções e agenda. */
function LinhaLocal({ local }: { local: LocalRelatorio }) {
  const primeira = local.visitas[0];
  return (
    <tr className="border-b border-border/60 align-top last:border-0 print:break-inside-avoid">
      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
        {primeira?.ordem != null ? primeira.ordem : '—'}
      </td>
      <td className="px-3 py-2 text-xs tabular-nums text-muted-foreground">{local.zona}</td>
      <td className="px-3 py-2">
        <p className="text-sm font-medium text-foreground">{local.nome}</p>
        <p className="text-xs text-muted-foreground">
          {local.endereco ?? 'Endereço não cadastrado'}
        </p>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {local.secoes.length > 0
          ? `${local.secoes.map((secao) => secao.numero).join(', ')} (${local.secoes.length})`
          : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {local.visitas.map((visita, indice) => (
          <p key={`${visita.data}-${visita.etapa}-${indice}`}>
            {formatarDataCurta(visita.data)} · E{visita.etapa} · {visita.equipe}
            {visita.ordem != null && ` · ordem ${visita.ordem}`}
          </p>
        ))}
      </td>
    </tr>
  );
}
