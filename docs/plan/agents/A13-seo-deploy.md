# A13 — SEO, OG image, Deploy

**Vlna 4 · sekvenčně, po A12 · větev `feat/a13-deploy`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/layouts/Base.astro` (jen `<head>` / meta část), `vercel.json`,
`public/robots.txt`, `public/og-image.png`, `scripts/build-og.mjs`, `src/data/site.js`
**Nesmíš měnit:** komponenty sekcí, styly, interaktivní skripty

Předpoklad: A12 je hotový a jeho report je v `progress.md`. Pokud web nesplňuje performance
budget, **deploy stejně připrav**, ale zapiš to jako blokující poznámku.

---

## Cíl

Poslední krok: web je hotový, teď musí být **nalezitelný, sdílitelný a nasazený**.
Tohle je jediná sekce plánu, která se týká toho, co se stane po `npm run build`.

---

## 1. `src/data/site.js` — jedno místo pro metadata

```js
export const site = {
  name: 'Synth.Eye',
  title: 'Synth.Eye — Train on synthetic. Deploy on real.',
  description: 'Synthetic data for industrial visual inspection. Physically-based Blender rendering and StyleGAN2-ADA generation train defect detection models that reach >99% classification and >95% defect detection on real production images — with zero manually labeled real data.',
  url: 'https://<DOMÉNA>',        // viz bod 5 — zapiš do progress.md, pokud není známá
  locale: 'en',
  author: 'Roman Parak, Lukas Moravansky, Filip Rusnak',
  organization: 'JIC · INTEMAC',
  license: 'MIT',
  repos: {
    blender: 'https://github.com/rparak/Synth_Eye',
    gan: 'https://github.com/LukasMoravansky/Synth_Eye_GAN',
    stylegan: 'https://github.com/LukasMoravansky/stylegan2-ada-pytorch',
  },
};
```

Description drž **pod 160 znaků pro `<meta name="description">`** — pokud je delší, udělej
dvě varianty (`description` pro meta, `descriptionLong` pro OG/schema).

## 2. `<head>` v `Base.astro`

Doplň (a nic jiného v `Base.astro` neměň):

- `<title>` a `<meta name="description">` ze `site.js`
- **Open Graph:** `og:type=website`, `og:title`, `og:description`, `og:image` (absolutní URL),
  `og:image:width=1200`, `og:image:height=630`, `og:url`, `og:site_name`, `og:locale=en`
- **Twitter:** `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`
- `<link rel="canonical">`
- `<meta name="theme-color" content="#08080c">`
- **Favicon set:** `favicon.svg` (z `logo.svg`), `favicon.ico` fallback,
  `apple-touch-icon.png` 180×180. Vygeneruj z `.claude/context/Synth.Eye - html/logo.svg`
  přes sharp — logo na `#08080c` pozadí s malým paddingem (samotné logo bez pozadí by
  na světlém prohlížečovém tabu zmizelo).
- **JSON-LD structured data** — `SoftwareSourceCode` nebo `SoftwareApplication` +
  `Organization`. Uveď: name, description, license (`https://opensource.org/licenses/MIT`),
  codeRepository, programmingLanguage, author, applicationCategory.
  **Nevkládej metriky ani hodnocení** (`aggregateRating` apod.) — nemáme je čím podložit.
- `<meta name="robots" content="index, follow">`

Pořadí v `<head>`: charset → viewport → title → meta → preload fontů → CSS.
**Nepřesouvej ani nemaž font preloady a CSS importy, které tam nechal A0.**

## 3. OG image

Skript `scripts/build-og.mjs` (sharp), spouštěný jako `npm run og`,
vygeneruje `public/og-image.png` **1200×630**:

- pozadí `#08080c` s velmi jemným grainem
- vlevo: claim **„Train on synthetic. Deploy on real."** v Clash Display
  (načti woff2/ttf z `public/fonts/` — pokud sharp nezvládne text s custom fontem, vyrenderuj
  text jako SVG s embedovaným fontem a composituj)
- vpravo: snímek dílu (`public/images/part-front.webp`), tmavě vinětovaný
- vlevo dole: `Synth.Eye` wordmark + `MIT · JIC · INTEMAC` v JetBrains Mono
- rohové viewfinder závorky v `#7B6EF6` s nízkou opacity
- **žádný gradient**, žádné stock prvky

Ověř, že výsledek je čitelný ve **zmenšení na ~300px šířky** (tak ho vidí náhled ve Slacku
a na Twitteru) — pokud claim není čitelný, zvětši ho.

## 4. `robots.txt` a sitemap

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://<DOMÉNA>/sitemap-index.xml
```

Sitemap: web je single page, takže full sitemap integrace je overkill. Vytvoř statický
`public/sitemap.xml` s jedinou URL. **Neinstaluj `@astrojs/sitemap`** kvůli jedné stránce
(dependency budget) — pokud ho chceš přesto, zapiš to jako rozhodnutí do `progress.md`
a nech rozhodnout zadavatele.

## 5. Vercel deploy

`vercel.json`:
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/images/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

- Build command `npm run build`, output `dist`, framework preset Astro (autodetekce).
- **Doména není známá.** Použij v `site.js` placeholder a zapiš do `progress.md` požadavek na
  doménu. Do nasazení funguje `*.vercel.app` URL — s ní OG absolutní URL fungují,
  takže deploy neblokuj.
- **Deploy sám neprováděj**, pokud k tomu nemáš explicitní pokyn a přístup — připrav
  konfiguraci a do `progress.md` napiš **přesné kroky** (`vercel link`, `vercel --prod`,
  nebo GitHub import), aby to zadavatel provedl jedním krokem.

## 6. Analytics — pouze návrh, neimplementuj

Do `progress.md` napiš doporučení: **Plausible** (lightweight, privacy-friendly, < 1 KB),
ne Google Analytics. **Nevkládej žádný tracking script bez explicitního schválení** —
je to rozhodnutí zadavatele (GDPR, cookie banner).

---

## Akceptační kritéria

- [ ] `site.js` existuje a `Base.astro` čerpá všechna metadata z něj (žádné duplikované stringy)
- [ ] `<meta name="description">` je pod 160 znaků, `<title>` pod 60
- [ ] OG a Twitter tagy kompletní, `og:image` je **absolutní URL**
- [ ] `public/og-image.png` je 1200×630, claim čitelný i ve zmenšení na 300px, žádný gradient
- [ ] Favicon set: SVG + ICO + apple-touch-icon, logo je viditelné na světlém i tmavém tabu
- [ ] JSON-LD validní (ověř na validator.schema.org), **bez fake ratings a metrik**
- [ ] `robots.txt` a `sitemap.xml` na místě
- [ ] `vercel.json` s immutable cache pro fonty/obrázky/`_astro` a security headery
- [ ] `npm run build` prochází, `dist/` obsahuje og-image, favicony, robots, sitemap
- [ ] Lighthouse **SEO ≥ 95** (produkční build přes `npm run preview`)
- [ ] Náhled odkazu ověřen (opengraph.xyz nebo lokální kontrola tagů)
- [ ] Do `progress.md` zapsáno: chybějící doména, kroky k deployi, doporučení analytics
- [ ] V `Base.astro` jsi změnil **jen `<head>`** — font preloady a CSS importy od A0 nedotčené

## Co NEDĚLAT

- Nevkládej tracking / analytics script bez schválení.
- Nevymýšlej metriky do structured data, nepoužívej `aggregateRating`.
- Neinstaluj `@astrojs/sitemap` ani jiné integrace kvůli jedné stránce bez rozhodnutí.
- Nedeployuj do produkce bez explicitního pokynu.
- Neměň komponenty sekcí, styly ani skripty — na to byl A12.
- Nepoužij gradient v OG image (pravidlo z konceptu platí i tady).
