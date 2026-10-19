import { Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { MANUAL_EQUIPE_CAMPO, segmentosNegrito, type BlocoManual } from '@montaje/core';

/** Texto do manual, com os trechos `**negrito**` em destaque. */
function TextoMarcado({ texto }: { texto: string }) {
  return (
    <>
      {segmentosNegrito(texto).map((segmento, indice) =>
        segmento.negrito ? (
          <strong key={indice} className="font-semibold text-foreground">
            {segmento.texto}
          </strong>
        ) : (
          <span key={indice}>{segmento.texto}</span>
        ),
      )}
    </>
  );
}

function Bloco({ bloco }: { bloco: BlocoManual }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return (
        <p className="text-sm leading-relaxed text-muted-foreground print:break-inside-avoid">
          <TextoMarcado texto={bloco.texto} />
        </p>
      );

    case 'destaque':
      return (
        <Alert variant="warning" className="print:break-inside-avoid">
          <AlertDescription>
            <TextoMarcado texto={bloco.texto} />
          </AlertDescription>
        </Alert>
      );

    case 'lista': {
      const Lista = bloco.ordenada ? 'ol' : 'ul';
      return (
        <Lista
          className={
            bloco.ordenada
              ? 'list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground'
              : 'list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground'
          }
        >
          {bloco.itens.map((item) => (
            <li key={item} className="print:break-inside-avoid">
              <TextoMarcado texto={item} />
            </li>
          ))}
        </Lista>
      );
    }

    case 'tabela':
      return (
        <div className="flex flex-col gap-2">
          {bloco.linhas.map((linha) => (
            <div
              key={linha.situacao}
              className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/40 px-3 py-2 print:break-inside-avoid"
            >
              <span className="text-sm font-semibold text-foreground">{linha.situacao}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                <TextoMarcado texto={linha.acao} />
              </span>
            </div>
          ))}
        </div>
      );
  }
}

/**
 * Manual da equipe de campo, para consulta e impressão no painel do cartório.
 * A classe `manual-impressao` aciona o ajuste de cores para papel (ver
 * `styles/index.css`), garantindo leitura mesmo com o tema escuro ativo.
 */
export function Manual() {
  return (
    <div className="manual-impressao mx-auto flex w-full max-w-3xl flex-col gap-6 print:mx-0 print:max-w-none print:gap-4">
      <PageHeader
        titulo={MANUAL_EQUIPE_CAMPO.titulo}
        descricao="Guia rápido entregue às equipes em campo. No celular, fica disponível dentro do app da equipe, sem internet."
        acoes={
          <Button className="print:hidden" onClick={() => window.print()}>
            <Printer />
            Imprimir
          </Button>
        }
      />

      <Alert variant="info" className="print:break-inside-avoid">
        <AlertDescription>{MANUAL_EQUIPE_CAMPO.resumo}</AlertDescription>
      </Alert>

      {MANUAL_EQUIPE_CAMPO.secoes.map((secao) => (
        <Card
          key={secao.id}
          className="print:break-inside-avoid print:border-neutral-400 print:shadow-none"
        >
          <CardHeader>
            <CardTitle>{secao.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            {secao.blocos.map((bloco, indice) => (
              <Bloco key={indice} bloco={bloco} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
