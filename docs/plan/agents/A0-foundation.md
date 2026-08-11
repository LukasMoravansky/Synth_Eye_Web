# A0 — Foundation & Scaffold

**Vlna 0 · sekvenčně · blokuje všechny ostatní agenty · větev `feat/a0-foundation`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

---

## Cíl

Postavit kompletní skelet Astro projektu tak, aby **9 dalších agentů mohlo pracovat paralelně
bez konfliktů**. Tvůj výstup je infrastruktura, ne obsah. Žádnou sekci neimplementuješ do finální
podoby — vytváříš jejich **stuby** a všechno společné, co budou používat.

Pokud tvoje práce nebude hotová správně, celý paralelní model se zhroutí. Ber vlastnictví
souborů a stabilitu API utilit jako hlavní akceptační kritérium.

---

## Kontext projektu (co stavíme)

Prezentační web pro **Synth.Eye** — platformu pro syntetická data pro průmyslovou vizuální
inspekci (Blender rendering → StyleGAN2-ADA → PyQt5 inspekční GUI). Single page, 8 sekcí,
tmavé industriální téma, fialový accent, 11 interaktivních prvků. Open source (MIT).

Stack je **daný a neměnný**: Astro (statický, zero-JS default) + vanilla JS + GSAP/ScrollTrigger
+ Lenis + Canvas 2D + custom SVG. Žádný React/Vue/Svelte, **žádný Tailwind**, žádná charting
knihovna, žádný CMS.

---

## Úkoly

### 1. Scaffold

```
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict
npm i
npm i gsap lenis
npm i -D sharp
```

- `astro.config.mjs`: statický output, žádné integrace frameworků. Zapni build-time image
  optimalizaci (Astro built-in `image` service se `sharp`).
- `package.json` scripts: `dev`, `build`, `preview` (+ `assets` viz bod 6).
- `.gitignore`: `node_modules`, `dist`, `.astro`, `.vercel`.
- **Ověř GSAP verzi z npm** a zapiš do `progress.md`, jestli je `gsap` + `ScrollTrigger`
  dostupné v npm balíčku bez club membership. Pokud ne, zapiš to jako blokující rozhodnutí
  a **neinstaluj alternativu** — jen to nahlas.

### 2. `src/styles/tokens.css`

Všechny tokeny z [../CONTRACT.md](../CONTRACT.md) sekce 2 jako CSS custom properties na `:root`:
barvy, fonty, typografické clamp škály (`--fs-h1` … `--fs-body`, `--fs-mono-*`), spacing scale
`--space-1` … `--space-12` (4/8/12/16/24/32/48/64/96/128/160/200px), `--section-py`,
`--content-max: 1440px`, `--gutter: clamp(1.25rem, 4vw, 5rem)`,
radiusy `--radius-sm: 2px` / `--radius-md: 4px` / `--radius-lg: 8px` (poslední používej výjimečně),
tranzice `--ease-out: cubic-bezier(.16,1,.3,1)`, `--dur-fast: 180ms`, `--dur-base: 400ms`,
`--dur-slow: 900ms`, `--z-*` škála (grain 100, cursor 9999).

### 3. `src/styles/fonts.css`

> **Neaktuální (2026-08-10):** `fonts.css` byl při zprovoznění GitHub Pages odstraněn.
> `url()` v CSS neumí projít přes `withBase()`, a pod Pages web běží na `/<repo>/`, ne
> v rootu. `@font-face` se teď generuje v `Base.astro` ze seznamu v `src/data/fonts.js`
> a vkládá inline; odtud se berou i preload linky. Zbytek sekce (které váhy, `font-display`,
> `unicode-range`, zákaz Google Fonts) platí beze změny.

`@font-face` deklarace pro self-hosted fonty. **Žádné Google Fonts, žádné CDN.**
- **Clash Display** (headings) a **Satoshi** (body) — Fontshare, free, self-hostable
- **JetBrains Mono** (data/logger/metriky) — open source

Postup: stáhni woff2 do `public/fonts/`, deklaruj s `font-display: swap`, `unicode-range`
pro latin + latin-ext (české znaky). Váhy: Clash Display 600+700, Satoshi 400+500+700,
JetBrains Mono 400+500. **Nic víc** — každá váha je KB.
Pokud fonty nemůžeš stáhnout (offline prostředí), deklaruj `@font-face` s očekávanými cestami,
nastav funkční fallback stack (`'Space Grotesk', system-ui`) a zapiš do `progress.md` požadavek
na dodání souborů. **Nepoužij Google Fonts jako workaround.**

### 4. `src/styles/global.css`

- Moderní reset (box-sizing, margin reset, `img { display:block; max-width:100% }`,
  `button`/`input` font inherit, `text-rendering`).
- `html { background: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body) }`
- Typografické base styly pro `h1`–`h3`, `p`, `a`, `code`.
- `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }`, nikde `outline: none`.
- **Grain overlay** — celostránkový, `position: fixed`, `inset: 0`, `pointer-events: none`,
  `opacity: 0.04`, `z-index: var(--z-grain)`, `mix-blend-mode: overlay`. **Statický, ne animovaný.**
  Implementuj jako inline SVG `feTurbulence` v `data:` URI nebo malý tileable PNG v `public/images/`.
  Preferuj SVG (menší, žádný request).
- Utility třídy: `.container` (max-width + gutter), `.section` (padding), `.mono`
  (font-mono + tabular-nums), `.sr-only`, `.viewfinder` (rohové závorky ⌜⌝⌞⌟ jako `::before`/`::after`
  pseudo-elementy — **cross-cutting motiv, ostatní agenti ho budou používat, zdokumentuj ho komentářem**).
- `@media (prefers-reduced-motion: reduce)` — globální `scroll-behavior: auto`,
  `animation-duration: 0.01ms !important` pro dekorativní animace.

### 5. `src/layouts/Base.astro`

HTML shell: `lang="en"`, charset, viewport, základní meta (title, description — A13 je doplní),
import `fonts.css` → `tokens.css` → `global.css` v tomto pořadí, preload kritických fontů
(Clash Display 700, Satoshi 400), grain overlay div, `<slot />`, a script tag inicializující
`scroll-setup.js`.

> **Neaktuální (2026-08-10):** `fonts.css` se neimportuje — `Base.astro` staví `@font-face`
> i preload linky ze `src/data/fonts.js` (viz poznámka u bodu 3). Cesty k souborům
> z `public/` (favicony, fonty) jdou přes `withBase()` ze `src/lib/base.js`, canonical
> a OG URL z `Astro.site` + base.

### 6. Asset pipeline

Skript `scripts/build-assets.mjs` (Node + sharp), spouštěný jako `npm run assets`:
- Čte zdrojové obrázky z `.claude/context/context_images/` a `.claude/context/Synth.Eye - html/`
- Resize: max delší strana **2400px** (hero), **1600px** (obsahové), **800px** (thumbnails)
- Výstup do `public/images/<slug>.{avif,webp,png}` — AVIF q50, WebP q78, PNG optimalizovaný
- Generuje **LQIP**: 20px wide blurred base64 → zapiš do `src/data/lqip.json` jako
  `{ "<slug>": "data:image/webp;base64,…", … }`
- Vygeneruj `src/data/images.json` s metadaty `{ slug, width, height, aspect }` pro každý asset
- Mapování slugů (**použij přesně tyto slugy**, ostatní agenti na ně budou linkovat):

  | Zdroj | slug | varianta |
  |---|---|---|
  | `Synth.Eye - html/Image_004.png` | `part-front` | 2400 |
  | `context_images/Image_5.png` | `part-hero` | 2400 |
  | `context_images/pbr.png` | `pbr-render` | 1600 |
  | `context_images/GAN_output.png` | `gan-output` | 1600 |
  | `context_images/scheme_1.png` | `scheme-hw` | 1600 |
  | `context_images/scheme_2.png` | `scheme-pipeline` | 1600 |
  | `context_images/scheme_3.png` | `scheme-gan` | 1600 |
  | `context_images/measurement.png` | `measure-front` | 1600 |
  | `context_images/measurement_back.png` | `measure-back` | 1600 |
  | `context_images/industry.png` | `industry` | 1600 |
  | `context_images/Logo_white.png` | `logo-white` | 800 |
  | `Synth.Eye - html/logo.svg` | `logo.svg` | kopie 1:1 |

- Skript musí být **idempotentní** (přeskočí, co už existuje se stejným mtime) a odolný vůči
  chybějícímu zdroji (warning, ne crash).
- Commituj i vygenerované `public/images/` — build na Vercelu nemá přístup k `.claude/`.

### 7. `src/components/Picture.astro`

Malá reusable komponenta, kterou budou používat **všichni ostatní agenti** — proto ji navrhni
stabilně a zdokumentuj props v komentáři nahoře:

```astro
---
// props: slug, alt, class?, loading? ('lazy'|'eager'), sizes?, inspectable? (bool),
//        label? (string), confidence? (number), fetchpriority?
---
```
Renderuje `<picture>` s `<source type="image/avif">`, `<source type="image/webp">`, `<img>` PNG
fallback, `width`/`height` z `images.json` (zabránit CLS), LQIP jako `background-image` na
wrapperu, a při `inspectable` přidá `data-inspectable`, `data-label`, `data-confidence`.

### 8. `src/scripts/lib/` — shared utils (stabilní API, ostatní na tom staví)

**`motion.js`**
```js
export { gsap, ScrollTrigger };            // už zaregistrované
export function prefersReducedMotion();     // boolean, live (matchMedia)
export function isFinePointer();            // '(hover:hover) and (pointer:fine)'
export function onMotionChange(cb);         // reakce na změnu preference
```

**`lazy-init.js`**
```js
// Najde selektor, a když je element poprvé aspoň 15 % ve viewportu (rootMargin 200px),
// zavolá loader(), await výsledek, a spustí jeho default export jako init(el).
// Vrací handle s destroy(). Init proběhne max 1×. Podporuje více matchů selektoru.
export function whenVisible(selector, loader, opts?);
```

**`counter.js`**
```js
// Scroll-triggered počítadlo s easingem, tabular-nums, respektuje reduced-motion
// (skočí přímo na cílovou hodnotu). Formátování: thousands separator, decimals, prefix/suffix.
export function animateCounter(el, { to, from?, decimals?, duration?, prefix?, suffix? });
export function initCounters(root);  // najde [data-counter] a napojí na ScrollTrigger
```

**`reveal.js`**
```js
// Standardní scroll reveal (fade + translateY 24px, stagger). Reduced-motion = okamžitě viditelné.
export function initReveals(root, opts?);  // hledá [data-reveal], [data-reveal-group]
```

### 9. `src/scripts/scroll-setup.js`

- Inicializuj **Lenis** (jedna globální instance, `lerp: 0.09`, `wheelMultiplier: 1`) a propoj
  s GSAP tickerem + `ScrollTrigger.scrollerProxy` / `lenis.on('scroll', ScrollTrigger.update)`.
- `gsap.registerPlugin(ScrollTrigger)`, `ScrollTrigger.config({ ignoreMobileResize: true })`.
- Při `prefers-reduced-motion: reduce` **Lenis vůbec nezakládej** — nativní scroll.
- Zavolej `initReveals(document)` a `initCounters(document)` globálně.
- Vystav `window.__lenis` pro debug (jen v dev).

### 10. `src/components/Nav.astro`

Minimální fixní navigace: logo (`logo.svg`) vlevo, odkazy **GitHub** a **HuggingFace** vpravo
v `--font-mono`, uppercase, malý tracking. Průhledné pozadí, na scroll > 100px jemný
`backdrop-filter: blur(12px)` + `background: rgba(8,8,12,0.72)` + spodní `--border`.
Bez hamburgeru — na mobilu jen logo + dvě zkrácené ikony/labely.
Odkazy: `https://github.com/rparak/Synth_Eye`, `https://github.com/LukasMoravansky/Synth_Eye_GAN`,
HuggingFace URL zatím **není známá** → zapiš do `progress.md` a odkaz zatím veď na GitHub org.

### 11. Stuby VŠECH sekcí — **klíčový krok pro paralelismus**

Vytvoř `src/components/` soubory níže. Každý stub obsahuje:
- správný root element `<section id="…" class="section …" aria-labelledby="…">`
- `<h2>` s finálním anglickým textem (nebo `<h1>` v Hero)
- komentář `{/* OWNER: A<N> — implementuje <co> */}`
- minimální `<style>` s vertikálním paddingem a background tokenem, aby stránka scrollovala
- **žádnou** interaktivní logiku

| Soubor | id | Vlastník | Heading (EN) |
|---|---|---|---|
| `Hero.astro` | `hero` | A1 | `Train on synthetic. Deploy on real.` |
| `DataGap.astro` | `data-gap` | A3 | `The data gap` |
| `PipelineBlender.astro` | `blender` | A4 | `First principles: physical simulation` |
| `PipelineTransition.astro` | `transition` | A7 | *(bez headingu — jen scroll canvas)* |
| `PipelineGAN.astro` | `gan` | A5 | `Statistical learning: generative networks` |
| `LatentNavigator.astro` | — | A5 | *(sub-komponenta)* |
| `CompositingDeck.astro` | — | A6 | *(sub-komponenta)* |
| `GuiDemo.astro` | `gui-demo` | A2 | `See what the operator sees` |
| `Measurement.astro` | `measurement` | A8 | `From pixel to millimeter` |
| `Results.astro` | `results` | A9 | `Trained on synthetic. Proven on real.` |
| `OpenSource.astro` | `open-source` | A10 | `Everything is open` |
| `Footer.astro` | `footer` | A10 | *(footer)* |

`LatentNavigator.astro` a `CompositingDeck.astro` importuj **uvnitř** `PipelineGAN.astro`
(stub A5 vlastní) — tím A5 a A6 nikdy nekolidují.

### 12. `src/pages/index.astro`

Použij `Base.astro`, importuj a vlož **všechny** sekce v tomto pořadí:

```
Nav · Hero · DataGap · PipelineBlender · PipelineTransition · PipelineGAN ·
GuiDemo · Measurement · Results · OpenSource · Footer
```

**Tento soubor po tobě nikdo needituje.** Musí být hotový a finální.

---

## Akceptační kritéria

- [ ] `npm run dev` běží, stránka scrolluje přes všech 11 bloků, každý viditelně oddělený
- [ ] `npm run build` prochází, `dist/` obsahuje jeden HTML soubor
- [ ] Fonty se načítají self-hosted (Network tab: žádný request na fonts.googleapis.com)
- [ ] Grain overlay je vidět přes celou stránku, nezachytává klikání
- [ ] Smooth scroll funguje (Lenis), s `prefers-reduced-motion` se vypne a scroll je nativní
- [ ] `npm run assets` vytvoří `public/images/` s AVIF+WebP+PNG pro všech 12 slugů a `lqip.json`
- [ ] `Picture.astro` renderuje bez CLS (má width/height) a přijímá `inspectable` props
- [ ] Statické sekce posílají **0 KB JS** — zkontroluj `dist/` (jediné JS chunky jsou GSAP+Lenis+scroll-setup)
- [ ] Focus outline viditelný na navigačních odkazech
- [ ] V `progress.md` zapsáno: verze GSAP a licenční zjištění, stav fontů, chybějící HuggingFace URL

## Co NEDĚLAT

- Neimplementuj žádnou sekci obsahově — jsi infrastruktura.
- Neinstaluj Tailwind, PostCSS pluginy, žádný UI kit, žádný framework adapter.
- Nepoužij Google Fonts ani font CDN.
- Nevytvářej terminálový preloader (byl z konceptu odstraněn) — stránka startuje okamžitě.
- Nedávej `border-radius: 8px` na všechno; default je ostrá hrana nebo 2–4px.
- Nezakládej druhou Lenis nebo ScrollTrigger konfiguraci nikde jinde.
