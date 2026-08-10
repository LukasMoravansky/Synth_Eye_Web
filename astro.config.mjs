// @ts-check
import { defineConfig } from 'astro/config';

// Dva cíle deploye. Vercel staví do rootu domény (výchozí hodnoty níž),
// GitHub Pages do https://<user>.github.io/<repo>/ — tam workflow
// .github/workflows/deploy.yml nastaví SITE_URL + BASE_PATH.
const site = process.env.SITE_URL || 'https://synth-eye-web.vercel.app';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
});
