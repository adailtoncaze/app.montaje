import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

/**
 * URL pública do app da equipe (PWA). O padrão segue o deploy documentado em
 * `docs/DEPLOY-vercel.md`; pode ser trocada pela variável de build
 * `VITE_URL_EQUIPE` (na Vercel) sem mexer no código.
 */
const URL_EQUIPE =
  import.meta.env.VITE_URL_EQUIPE?.trim() || 'https://montaje-equipe.vercel.app';

const PASSOS = [
  'Abra a câmera do celular e aponte para o código.',
  'Toque no link que aparecer para abrir o MontaJE no navegador.',
  'Toque em "Instalar app" (Android/Chrome) ou em Compartilhar → "Adicionar à Tela de Início" (iPhone).',
  'Entre com a matrícula e o código do cartório.',
];

/** APP-29 — QR code do app da equipe para instalar/entregar às equipes (e imprimir). */
export function AppEquipe() {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(URL_EQUIPE);
      setCopiado(true);
      toast.success('Link copiado', { description: URL_EQUIPE });
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error('Não foi possível copiar', { description: 'Anote o link exibido na tela.' });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="App da equipe"
        descricao="Mostre ou imprima o código para a equipe instalar o MontaJE no celular."
        acoes={
          <>
            <Button variant="outline" onClick={copiar}>
              {copiado ? <Check /> : <Copy />}
              {copiado ? 'Link copiado' : 'Copiar link'}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer />
              Imprimir
            </Button>
          </>
        }
      />

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:hidden">
          <div className="flex flex-col gap-0.5">
            <CardTitle>Instalar o aplicativo</CardTitle>
            <CardDescription>
              Basta a câmera do celular — fora o login, não há nada para digitar.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="gap-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-teams-2 print:border-neutral-300 print:shadow-none">
              <QRCodeSVG
                value={URL_EQUIPE}
                size={232}
                level="M"
                marginSize={1}
                bgColor="#FFFFFF"
                fgColor="#000000"
                title="Link para instalar o aplicativo da equipe"
              />
              <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-neutral-900">
                <QrCode className="size-4" />
                MontaJE · Equipe
              </span>
            </div>

            <ol className="flex flex-1 flex-col gap-4">
              {PASSOS.map((passo, indice) => (
                <li key={passo} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-subtle-foreground">
                    {indice + 1}
                  </span>
                  <span className="pt-0.5">{passo}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="break-all text-xs text-muted-foreground">{URL_EQUIPE}</p>
        </CardContent>
      </Card>
    </div>
  );
}
