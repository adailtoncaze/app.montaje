import { useEffect, useState } from 'react';
import { ExternalLink, ImageOff, Maximize2, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ROTULO_MOTIVO, type Desvio } from '@montaje/core';
import { cn } from '@/lib/utils';

/** Dados de uma foto preparados para o visualizador em tela cheia. */
export interface FotoAberta {
  url: string;
  titulo: string;
  numero: number | null;
  capturada: string | null;
  coords: string | null;
  observacao: string | null;
  desvio: Desvio | null;
}

/**
 * Escalas de zoom relativas ao tamanho nativo da imagem (`1` = 100%, ou seja,
 * um pixel do arquivo para um pixel da tela). É a única forma de enxergar o
 * detalhe real da evidência — ampliar além disso só borrado a foto.
 */
const PASSOS_ZOOM = [0.5, 0.75, 1, 1.5, 2, 3] as const;

/**
 * Visualizador de evidência em tela cheia.
 *
 * Mostra a **foto original** (não a miniatura de 320px usada na lista) e permite
 * ir até 100% do tamanho nativo, além de abrir o arquivo em outra aba para
 * inspeção a qualquer ampliação. Fecha por Esc e por clique fora.
 */
export function VisualizadorFoto({
  foto,
  onFechar,
}: {
  foto: FotoAberta | null;
  onFechar: () => void;
}) {
  /** `null` = modo "Ajustar" (o quadro inteiro cabe na área disponível). */
  const [zoom, setZoom] = useState<number | null>(null);
  const [nativo, setNativo] = useState<{ largura: number; altura: number } | null>(null);
  const [erroImagem, setErroImagem] = useState(false);

  // Cada foto começa ajustada às dimensões da própria imagem — nada vaza da anterior.
  const url = foto?.url;
  useEffect(() => {
    setZoom(null);
    setNativo(null);
    setErroImagem(false);
  }, [url]);

  function aumentar() {
    if (zoom === null) {
      setZoom(1);
      return;
    }
    const proximo = PASSOS_ZOOM.find((passo) => passo > zoom + 0.001);
    setZoom(proximo ?? PASSOS_ZOOM[PASSOS_ZOOM.length - 1]);
  }

  function diminuir() {
    if (zoom === null) return;
    const anterior = [...PASSOS_ZOOM].reverse().find((passo) => passo < zoom - 0.001);
    // Abaixo da menor escala volta ao "Ajustar", que é a leitura normal.
    setZoom(anterior ?? null);
  }

  return (
    <Dialog open={foto !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        className="h-[92vh] max-w-[min(1500px,97vw)] p-0"
        // Diferente dos formulários, o visualizador fecha por clique fora e por Esc.
        onInteractOutside={() => undefined}
        onEscapeKeyDown={() => undefined}
      >
        {foto && (
          <>
            <div className="border-b border-border p-5 pr-14">
              <DialogTitle>{foto.titulo}</DialogTitle>
              <DialogDescription>
                {foto.numero != null ? `Foto #${foto.numero} · ` : ''}
                {foto.capturada ?? 'Data não informada'}
                {foto.coords ? ` · ${foto.coords}` : ''}
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {erroImagem
                  ? 'Imagem indisponível'
                  : nativo
                    ? `${nativo.largura} × ${nativo.altura} px`
                    : 'Carregando imagem…'}
              </span>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={diminuir}
                  disabled={!zoom}
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut />
                </Button>
                <span className="w-16 text-center text-xs font-semibold tabular-nums">
                  {zoom === null ? 'Ajustar' : `${Math.round(zoom * 100)}%`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={aumentar}
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  disabled={!zoom}
                  onClick={() => setZoom(null)}
                >
                  <Maximize2 />
                  Ajustar
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={foto.url} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    Abrir original
                  </a>
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'min-h-0 flex-1 overflow-auto bg-muted/60',
                zoom === null ? 'flex items-center justify-center p-4' : 'p-4',
              )}
            >
              {erroImagem ? (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="size-6" />
                  <span className="text-sm">
                    Não foi possível carregar a foto. Atualize a página para gerar um novo link.
                  </span>
                </div>
              ) : (
                <img
                  src={foto.url}
                  alt={foto.titulo}
                  onLoad={(evento) => {
                    const alvo = evento.currentTarget;
                    setNativo({ largura: alvo.naturalWidth, altura: alvo.naturalHeight });
                    setErroImagem(false);
                  }}
                  onError={() => setErroImagem(true)}
                  className={cn(
                    'block rounded-md shadow-teams-4',
                    zoom === null ? 'max-h-full max-w-full object-contain' : 'mx-auto',
                  )}
                  style={
                    zoom !== null && nativo
                      ? { width: `${Math.round(nativo.largura * zoom)}px` }
                      : undefined
                  }
                />
              )}
            </div>

            {(foto.observacao || foto.desvio) && (
              <div className="flex flex-col gap-2 border-t border-border p-5">
                {foto.observacao && (
                  <p className="text-sm text-foreground">Obs.: {foto.observacao}</p>
                )}
                {foto.desvio && (
                  <Alert variant="warning">
                    <AlertIcon>
                      <TriangleAlert />
                    </AlertIcon>
                    <AlertDescription>
                      <strong className="block">Desvio: {ROTULO_MOTIVO[foto.desvio.motivo]}</strong>
                      {foto.desvio.observacao?.trim() || 'Sem observação.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
