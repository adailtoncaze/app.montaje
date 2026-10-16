/**
 * Pontos de quebra do design system (mobile-first).
 *
 * Use dentro de `makeStyles` como chave de at-rule:
 *
 *   const useClasses = makeStyles({
 *     lista: {
 *       gridTemplateColumns: '1fr',
 *       [`@media ${pontoTablet}`]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
 *     },
 *   });
 *
 * O Griffel (motor de estilo do Fluent) suporta `@media` nativamente.
 */

/** Tablets (retrato/paisagem) e celulares grandes. */
export const pontoTablet = '(min-width: 720px)';

/** Tablets grandes e desktops. */
export const pontoDesktop = '(min-width: 1080px)';

/** Telas amplas. */
export const pontoAmplo = '(min-width: 1440px)';
