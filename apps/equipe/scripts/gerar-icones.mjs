// Gera os ícones PNG da PWA a partir do SVG de origem.
// O Chrome exige ícones PNG 192x192 e 512x512 no manifest para permitir a instalação.
// Uso: npm run gerar-icones  (dentro de apps/equipe)
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const publico = resolve(aqui, '..', 'public');
const svg = readFileSync(resolve(publico, 'icone.svg'));
const MARCA = '#4f46e5';

/** Arredonda o conteúdo sobre um fundo cheio (para maskable e apple-touch). */
async function sobreFundo(tamanho, fracao, destino) {
  const lado = Math.round(tamanho * fracao);
  const interno = await sharp(svg).resize(lado, lado).png().toBuffer();
  await sharp({
    create: { width: tamanho, height: tamanho, channels: 4, background: MARCA },
  })
    .composite([{ input: interno, gravity: 'centre' }])
    .png()
    .toFile(destino);
}

async function principal() {
  await sharp(svg).resize(192, 192).png().toFile(resolve(publico, 'pwa-192x192.png'));
  await sharp(svg).resize(512, 512).png().toFile(resolve(publico, 'pwa-512x512.png'));
  await sharp(svg).resize(64, 64).png().toFile(resolve(publico, 'pwa-64x64.png'));

  // Maskable: conteúdo dentro da zona segura (80%) sobre fundo cheio da marca.
  await sobreFundo(512, 0.8, resolve(publico, 'maskable-icon-512x512.png'));

  // iOS não lida bem com transparência; usa fundo cheio.
  await sobreFundo(180, 1, resolve(publico, 'apple-touch-icon-180x180.png'));

  console.log('Ícones gerados em', publico);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
