# Synth.Eye — Tech Stack Decision
 
> Kontext pro development plán. Výběr stacku s odůvodněním pro každou vrstvu.
 
---
 
## Klíčové faktory
 
**Povaha projektu:** Jednorázový prezentační web, žádný backend, žádný CMS, žádné dynamické API. Obsah je statický — mění se jen při redesignu. Cílem je vizuální wow, ne content pipeline.
 
**Interaktivní komplexita:** Web má 11 interaktivních prvků (viz koncept v2) — od jednoduchých scroll-triggered counterů po Canvas/WebGL particle system a draggable compositing deconstructor. To je těžká interaktivní vrstva nad jinak statickým obsahem.
 
**Performance:** FCP <1.5s, LCP <2.5s s particle systémy a desítkami obrázků. Potřebujeme granulární kontrolu nad tím, co se načítá kdy.
 
---
 
## Doporučený stack
 
### Framework: Astro (statický build, zero JS by default)
 
Proč Astro a ne čistý HTML nebo Next.js:
 
Čistý HTML + vanilla JS by fungoval, ale s 8+ sekcemi, sdílenými komponentami (viewfinder motiv, inspection cursor), a potřebou code-splittingu pro těžké interaktivní prvky (particle system, GUI demo) by se projekt rychle stal neudržitelným single-file monstrem. Na druhou stranu Next.js je overkill — není tu SSR potřeba, žádné API routes, žádný routing (single page). React hydration by přidala zbytečný JS overhead.
 
Astro je mezi tím: component-based DX, zero-JS default (HTML+CSS jde na klienta bez frameworku), a selektivní hydratace jen tam, kde je interakce. Particle system se načte jen když je viditelný. GUI demo se hydratuje lazy. Statické sekce nepošlou ani byte JS.
 
Konkrétně: Astro s `.astro` komponentami pro statické sekce, vanilla JS `<script>` tagy pro interakce. Žádný React/Vue/Svelte layer — jen Astro templating + raw JS. Tím eliminujeme framework runtime úplně.
 
### Animace: GSAP + ScrollTrigger
 
GSAP je de facto standard pro scroll-driven animace na prezentačních webech. ScrollTrigger řeší: scroll-triggered reveals, pinning sekcí (hero transformation), scrub animace (particle transition, defect revealer progress). Alternativy (Motion One, Framer Motion, CSS scroll-driven animations) nemají srovnatelnou robustnost pro komplexní timeline orchestraci.
 
Projekt je open source (MIT) — GSAP má free tier pro non-commercial use, což by mělo pokrýt prezentační web pro výzkumný projekt. Pokud by nastal licenční problém, fallback je Motion One + Intersection Observer, ale s výrazně vyšší implementační náročností.
 
### Smooth scroll: Lenis
 
Lehký (< 5 KB), kompatibilní s GSAP ScrollTrigger, řeší momentum scrolling a normalizaci napříč prohlížeči. Alternativa je nativní `scroll-behavior: smooth`, ale ta neřeší momentum ani integraci s ScrollTrigger scrub animacemi.
 
### Particle system (Blender→GAN transition): Canvas 2D API
 
WebGL (Three.js/PixiJS) je overkill pro 2D pixel-particle efekt. Canvas 2D s requestAnimationFrame zvládne tisíce částic při 60fps. Three.js by přidala ~150 KB gzipped jen pro jeden efekt. Pokud by se ukázalo, že Canvas 2D nezvládá počet částic na slabších zařízeních, upgrade na PixiJS (WebGL 2D renderer) je přímočarý — API je podobná.
 
Fallback pro `prefers-reduced-motion` a slabé GPU: CSS crossfade dissolve s grid fragmentation (čistě dekorativní alternativa bez particle physics).
 
### Chart (GUI demo productivity graph): Custom SVG
 
Stávající `synth_eye_gui_template.html` už má funkční SVG graf s vanilla JS. Ten přestylujeme do dark theme a přidáme animaci (GSAP pro morph/draw efekty na nových bodech). Žádná charting knihovna — D3/Chart.js by přidaly dependence pro jeden animovaný line chart.
 
### Fonty: Fontshare (self-hosted)
 
Clash Display (headings), Satoshi (body), JetBrains Mono (data/logger) — to jsou 3 fonty, z toho 2 z Fontshare (free, self-hostable) a JetBrains Mono je open source. Self-hosting eliminuje FOUT a Google Fonts dependency. Subsetting přes `glyphhanger` nebo `fonttools` pro redukci velikosti (jen latin + české znaky pokud potřeba).
 
### Obrázky: AVIF → WebP → PNG fallback chain
 
Většina assetů jsou PNG screenshoty a rendery. Build-time konverze přes `sharp` (Astro integration existuje). Lazy loading přes native `loading="lazy"` + Intersection Observer pro těžší sekce (GUI demo snímky, latent space grid). Placeholder: LQIP (low-quality image placeholder) generovaný při buildu — malý blurhash inline v HTML.
 
### Hosting: Vercel
 
Statický Astro build, edge CDN, preview deploys z Git větví, automatický HTTPS. GitHub Pages by fungovalo, ale Vercel má lepší cache headers a preview URL pro iteraci. Netlify je ekvivalentní alternativa.
 
### Build tooling
 
Inherentní v Astro — používá Vite pod kapotou: HMR pro development, tree-shaking, code splitting, CSS minifikace. Žádná další konfigurace build tools potřeba.
 
---
 
## Co stack NEOBSAHUJE (a proč)
 
**React/Vue/Svelte** — žádná komponenta na webu nevyžaduje reaktivní state management složitější než vanilla JS event listeners. GUI demo je scripted sekvence (ne reaktivní formulář). Latent space navigator je mouse position → image swap. Compositing deconstructor je drag + z-index. Všechno zvládne vanilla JS s GSAP, a ušetříme celý framework runtime.
 
**Tailwind CSS** — koncept explicitně zakazuje "Bootstrap / Tailwind UI bez heavy customizace" a design systém je custom (vlastní tokeny, specifické spacing, nestandardní layout). Tailwind by přidalo vrstvu abstrakce bez benefitu — custom CSS s CSS custom properties (tokeny z konceptu) je přímočařejší a dává plnou kontrolu.
 
**CMS (Sanity, Contentful, Storyblok)** — obsah se nemění dynamicky. Texty, obrázky, metriky jsou fixní. CMS by přidalo komplexitu bez hodnoty. Pokud se v budoucnu ukáže potřeba (např. blog sekce), Astro má content collections.
 
**i18n** — koncept je v češtině, web bude pravděpodobně anglicky. Pokud se ukáže potřeba češtiny, Astro podporuje i18n routing, ale to je edge case — zatím single-language.
 
**Analytics** — mimo scope stacku, ale doporučuji Plausible (lightweight, privacy-friendly, <1KB script) místo Google Analytics.
 
---
 
## Dependency budget
 
| Závislost | Velikost (gzip) | Účel |
|---|---|---|
| GSAP + ScrollTrigger | ~30 KB | Všechny animace |
| Lenis | ~5 KB | Smooth scroll |
| JetBrains Mono (subset) | ~15 KB | Monospace font |
| Clash Display (subset) | ~20 KB | Heading font |
| Satoshi (subset) | ~18 KB | Body font |
| **Celkem runtime JS** | **~35 KB** | (bez fontů) |
 
Particle system a GUI demo logika je custom JS — odhaduji 8–15 KB gzipped celkem. Celkový JS budget webu: **pod 50 KB gzipped**, což je výborné pro LCP <2.5s i na 3G.
 
---
 
## Struktura projektu
 
```
synth-eye-web/
├── src/
│   ├── layouts/
│   │   └── Base.astro              # HTML shell, meta, fonty, grain overlay
│   ├── components/
│   │   ├── Nav.astro               # Minimální navigace (logo + GitHub/HF links)
│   │   ├── Hero.astro              # Inspection Chamber hero
│   │   ├── DataGap.astro           # Sekce 2 — problém
│   │   ├── PipelineBlender.astro   # Sekce 3a — Blender pipeline + Defect Revealer
│   │   ├── PipelineTransition.astro # Particle Field Transformation
│   │   ├── PipelineGAN.astro       # Sekce 3b — GAN pipeline + Navigator + Deconstructor
│   │   ├── GuiDemo.astro           # Sekce 4 — interaktivní GUI
│   │   ├── Measurement.astro       # Sekce 5 — měření + gauges
│   │   ├── Results.astro           # Sekce 6 — metriky + evidence grid
│   │   ├── OpenSource.astro        # Sekce 7 — bento grid s repo kartami
│   │   └── Footer.astro            # Sekce 8 — tým, instituce
│   ├── scripts/
│   │   ├── inspection-cursor.js    # Průřezový inspection cursor
│   │   ├── hero-chamber.js         # Hero parallax + HUD fragmenty
│   │   ├── defect-revealer.js      # Clip-path cursor mask
│   │   ├── particle-transition.js  # Canvas 2D particle system
│   │   ├── latent-navigator.js     # 2D interpolace GAN výstupů
│   │   ├── compositing-deck.js     # Drag & drop layer deconstructor
│   │   ├── gui-demo.js             # Scripted CAPTURE/ANALYZE sekvence
│   │   ├── measurement-gauges.js   # Animované tolerance gauges
│   │   └── scroll-setup.js         # GSAP + Lenis init, globální scroll triggers
│   ├── styles/
│   │   ├── tokens.css              # CSS custom properties (barvy, typo, spacing)
│   │   ├── global.css              # Reset, grain overlay, base styles
│   │   └── fonts.css               # @font-face deklarace
│   └── pages/
│       └── index.astro             # Single page — skládá všechny sekce
├── public/
│   ├── fonts/                      # Self-hosted font soubory
│   ├── images/                     # Optimalizované assety (AVIF/WebP/PNG)
│   └── og-image.png                # Open Graph preview
├── astro.config.mjs
└── package.json
```
 
---
 
## Implementační pořadí
 
1. **Scaffold + design tokens + global styles** — Astro projekt, fonty, barvy, grain, Lenis + GSAP setup
2. **Hero (Inspection Chamber)** — parallax, HUD fragmenty, kinetická typografie — nastavuje tón celého webu
3. **GUI Demo** — nejvíce kódu, scripted sekvence, SVG graf animace — signature moment
4. **Defect Revealer** — relativně jednoduchý clip-path efekt, ale silný vizuální dopad
5. **Pipeline story (Blender + GAN sekce)** — narativní páteř, statičtější layout s scroll reveals
6. **Compositing Deconstructor** — drag interakce, z-index, spring physics
7. **Particle Transition** — Canvas 2D, scroll-scrubbed, fallback pro reduced-motion
8. **Latent Space Navigator** — závisí na dostupnosti GAN výstupů (50–100 snímků)
9. **Measurement + Results + Open Source + Footer** — informační sekce, jednodušší
10. **Inspection Cursor** — průřezový, implementovat po stabilizaci layoutu všech sekcí
11. **Responsive + performance audit + a11y** — finální polish
 
---
 
## Rizika a mitigace
 
**Assety:** Koncept vyžaduje specifické párové snímky (Defect Revealer), 50–100 GAN výstupů (Latent Navigator), 5 compositing vrstev, 6–8 GUI demo snímků. Pokud nebudou k dispozici, příslušné interaktivní prvky se degradují na statičtější alternativy. Latent Space Navigator je na tomto nejzávislejší — bez dostatku snímků se zredukuje na jednoduchý seed slider.
 
**GSAP licence:** Projekt je open source, web je prezentační (ne komerční produkt). GSAP No Charge license by měla stačit. Pokud ne, alternativa je Web Animations API + Intersection Observer — funkčně ekvivalentní pro jednoduché reveals, ale výrazně pracnější pro scrub animace a timeline orchestraci.
 
**Performance na mobilech:** Particle system a inspection cursor jsou náročné na mobilu. Mitigation: deaktivace particle physics na touch zařízeních (CSS crossfade fallback), zjednodušení inspection cursoru na tap-to-inspect místo continuous tracking.