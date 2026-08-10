/* Self-hosted fonty (Fontshare + JetBrains Mono), subsetted na latin + latin-ext.
 *
 * Seznam je zdrojem pravdy pro @font-face i preload linky v Base.astro. Dřív to
 * byl statický src/styles/fonts.css, jenže url() v CSS neumí projít přes
 * withBase() — a pod GitHub Pages web běží na /<repo>/, ne v rootu. Generuje se
 * tedy z JS, kde base prefix aplikovat jde. */
export const UNICODE_RANGE = 'U+0000-00FF, U+0100-024F, U+1E00-1EFF';

export const fonts = [
  { family: 'Clash Display', file: 'ClashDisplay-Semibold.woff2', weight: 600 },
  { family: 'Clash Display', file: 'ClashDisplay-Bold.woff2', weight: 700, preload: true },
  { family: 'Satoshi', file: 'Satoshi-Regular.woff2', weight: 400, preload: true },
  { family: 'Satoshi', file: 'Satoshi-Medium.woff2', weight: 500 },
  { family: 'Satoshi', file: 'Satoshi-Bold.woff2', weight: 700 },
  { family: 'JetBrains Mono', file: 'JetBrainsMono-Regular.woff2', weight: 400 },
  { family: 'JetBrains Mono', file: 'JetBrainsMono-Medium.woff2', weight: 500 },
];
