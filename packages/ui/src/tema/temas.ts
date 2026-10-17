import {
  createDarkTheme,
  createLightTheme,
  type BrandVariants,
  type Theme,
} from '@fluentui/react-components';

/**
 * Identidade visual MontaJE — institucional moderno (índigo).
 *
 * Importante: o Fluent usa rampas de marca invertidas em relação ao senso comum
 * — o índice `10` é o tom mais escuro e o `160` o mais claro. A rampa abaixo
 * segue essa convenção e fica ancorada em:
 *
 *   - `80`  → `#4f46e5` (índigo principal do tema claro / marca do painel);
 *   - `110` → `#818cf8` (índigo claro usado como destaque no tema escuro).
 *
 * É a mesma rampa usada por `createLightTheme`/`createDarkTheme`, como o próprio
 * Fluent faz com `brandWeb`. Ajustes finos de contraste (índigo mais claro para
 * texto sobre fundo escuro, por exemplo) são aplicados depois, nos temas.
 */
export const marcaIndigo: BrandVariants = {
  10: '#0a091a',
  20: '#100e25',
  30: '#171536',
  40: '#1f1d4a',
  50: '#28255f',
  60: '#312e81',
  70: '#3730a3',
  80: '#4f46e5',
  90: '#5b52e8',
  100: '#6366f1',
  110: '#818cf8',
  120: '#a5b4fc',
  130: '#c7d2fe',
  140: '#e0e7ff',
  150: '#eef2ff',
  160: '#f5f7ff',
};

/** Tipografia: Inter self-hosted (PWA offline-first) com fallbacks do sistema. */
const fontes: Pick<Theme, 'fontFamilyBase' | 'fontFamilyNumeric'> = {
  fontFamilyBase: "'Inter Variable', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontFamilyNumeric: "'Inter Variable', 'Segoe UI', system-ui, -apple-system, sans-serif",
};

/** Cantos levemente maiores que o padrão do Fluent — visual mais moderno. */
const cantos: Pick<
  Theme,
  'borderRadiusSmall' | 'borderRadiusMedium' | 'borderRadiusLarge' | 'borderRadiusXLarge'
> = {
  borderRadiusSmall: '4px',
  borderRadiusMedium: '6px',
  borderRadiusLarge: '8px',
  borderRadiusXLarge: '12px',
};

/** Tema claro da marca MontaJE (índigo #4f46e5 sobre superfícies claras). */
export const temaClaro: Theme = {
  ...createLightTheme(marcaIndigo),
  ...fontes,
  ...cantos,
};

/**
 * Tema escuro da marca MontaJE. Além dos cantos e da fonte, eleva os
 * `colorBrandForeground*` para tons claros, garantindo legibilidade de links,
 * ícones e textos de marca sobre superfícies escuras.
 */
export const temaEscuro: Theme = {
  ...createDarkTheme(marcaIndigo),
  ...fontes,
  ...cantos,
  colorBrandForeground1: '#a5b4fc',
  colorBrandForeground2: '#c7d2fe',
  colorBrandForeground2Hover: '#e0e7ff',
  colorBrandForeground2Pressed: '#eef2ff',
};
