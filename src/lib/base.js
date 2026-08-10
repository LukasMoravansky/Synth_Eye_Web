/**
 * Base-path helper.
 *
 * Vercel deployuje web do rootu domény (`base: '/'`), GitHub Pages ale do
 * podadresáře `/<repo>/`. Root-absolutní cesty typu `/images/x.webp` by pod
 * Pages ukazovaly mimo web, takže každý odkaz na soubor z `public/` musí projít
 * přes `withBase()`. Funguje jak v `.astro` (build time), tak v klientských
 * skriptech — Vite `import.meta.env.BASE_URL` inlinuje do bundlu.
 */
const raw = import.meta.env.BASE_URL || '/';

/** Base bez koncového lomítka: '' pro root, '/Synth_Eye_Web' pro Pages. */
export const BASE = raw.endsWith('/') ? raw.slice(0, -1) : raw;

/** @param {string} path cesta od rootu webu, včetně úvodního lomítka */
export const withBase = (path) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
