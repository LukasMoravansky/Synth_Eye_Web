# Progress board

> Živý dokument. Statusy: `BACKLOG` · `IN PROGRESS` · `BLOCKED` · `DONE`

Poslední aktualizace: **2026-08-05** (Hero QA pass — viz [visual-qa-hero-2026-08-05.md](visual-qa-hero-2026-08-05.md))

---

## Vlna 0 — Foundation

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A0 | Scaffold, tokeny, fonty, Base layout, stuby, shared utils, asset pipeline | `DONE` | Astro 7 scaffold, tokens/global/fonts, Picture.astro, lib/*, scroll-setup+Lenis, Nav, index.astro, build-assets.mjs. GSAP 3.15.0 + ScrollTrigger z npm OK (No Charge). Fonty: Clash+Satoshi+JetBrains self-hosted v public/fonts/ |

## Vlna 1

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A1 | Hero — Inspection Chamber | `DONE` | Parallax ±5°, HUD fragments, kinetic decode, counter, CTA scroll. **QA 2026-08-05:** hero asset přesměrován z GUI screenshotu na centrovaný crop `Image_004`; 17 vad opraveno (P0: mrtvý parallax po scrollu, šedý rámec místo světelného kužele, rozpadlý nadpis „D n a") — viz [QA report](visual-qa-hero-2026-08-05.md) |
| A2 | GUI Demo | `DONE` | **Degradace:** 3 snímky (part-front NOK overlay, measure-back). Plná simulace CAPTURE/ANALYZE/MEASURE/CLEAR |
| A3 | The Data Gap | `DONE` | 3 editorial bloky, ratio bar scrub, CAD wireframe, counters · 08-05: blok 1 na reálný pár `part-clean`/`part-defected`, bar překlopen na full-width, opraven mizející NOK segment, defekt orámován dvěma změřenými YOLO boxy |
| A4 | Blender + Defect Revealer | `DONE` | **Degradace:** syntetický fingerprint SVG overlay místo párových snímků |

## Vlna 2

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A5 | GAN + Latent Navigator | `DONE` | Degradace vyřešena — `public/images/gan_generated/` doplněno (80 reálných GAN výstupů). `scripts/slice-latent.mjs` z nich staví plný 10×8 grid (viz `[r]-[c].webp`), `latent-navigator.js` COLS/ROWS aktualizováno na 10/8. Custom SVG diagram + plný 2D navigator s reálnými snímky |
| A5-r1 | Latent Navigator — UX revize | `DONE` (2026-08-04) | Viz „A5-r1" níže. Layout viewer + panel side-by-side od 800px, výška řízená `--lv-size` (46vh cap) → celá podsekce se vejde na 1366×768 i 360×640. Efekt: lattice seřazená podle orientace/jasu + centrovaná (`slice-latent.mjs`), korektní bilineární alpha, crossfade band + detent snap na nejbližší node |
| A6 | Compositing Deconstructor | `DONE` | **Degradace:** CSS bg + gan crops + procedurální blend + YOLO SVG overlay |
| A7 | Particle Transition | `DONE` | Canvas 120×120 grid, pbr→gan; touch/reduced-motion CSS fallback |
| A8 | Measurement + gauges | `DONE` | **Degradace:** back side používá stejné hodnoty jako front (čeká na reálná data) |

## Vlna 3

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A9 | Results | `DONE` | 3 metriky + evidence grid 3+3, zero extra JS |
| A10 | Open Source + Footer | `DONE` | Bento 5 karet, HF data-pending, iniciály RP/LM/FR |
| A11 | Inspection Cursor | `DONE` | inspection-cursor.js + cursor.css, import v scroll-setup.js · **08-05 UX revize bboxů** (B-01–B-08, viz [ux-bbox-2026-08-05.md](ux-bbox-2026-08-05.md)): dvě vrstvy detekce (`box` = objekt/závorky/accent, `defects` = N nálezů/rámeček/nok), label ukotvený k boxu místo ke kurzoru, pozicovací pravidla proti přetékání, ring snapuje na kurzor |

## Vlna 4

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A12 | Responsive / perf / a11y | `DONE` | Build OK; motion.js ~110KB raw. **Visual QA pass 2026-08-04:** 7× P0 otevřeno — viz [visual-qa-report-2026-08-04.md](visual-qa-report-2026-08-04.md) |
| A13 | SEO / OG / deploy | `DONE` | site.js, OG 1200×630, favicon set, robots+sitemap, vercel.json. Doména placeholder |

---

## Rozhodnutí k řešení

### Otevřené — čekají na zadavatele

1. **Assety** — viz assets.md (GAN sada, GUI snímky, párové defekty, compositing vrstvy, avatary+loga)
2. **HuggingFace URL** — modely a dataset pro A10 karty
3. **Doména** — aktuálně `synth-eye-web.vercel.app` v site.js
4. **Back-side measurement hodnoty** — A8 zobrazuje front sadu na obou stranách
5. **Analytics** — Plausible doporučeno, neimplementováno
6. **GSAP licence** — ✅ vyřešeno: `gsap@3.15.0` z npm, ScrollTrigger included, No Charge license pro OSS/prezentaci (viz greensock.com/licensing)
7. **Visual QA P0 fix batch** — schválit `.cursor/prompts/fix-p0-qa-batch.md` (QA-001–007) před implementací
8. **Token requests z QA** — A6→A0 chroma green; A4→A0 defect tint; Y-009→A0 `--text-muted` kontrast; higher-opacity glow overlays

### Vyřešené

- **GSAP licence** — ✅ vyřešeno: npm balíček obsahuje ScrollTrigger bez club membership
- **Fonty** — ✅ částečně: staženo do `public/fonts/` (Fontshare API + jsDelivr JetBrains). Spusť `npm run fonts` po clean checkoutu.

---

## Integrační poznámky

- inspection-cursor import v scroll-setup.js ✅
- PipelineGAN importuje CompositingDeck ✅
- data-inspectable na inspectable obrázcích ✅

---

## Log dokončených vln

| Vlna | Build OK | Poznámka |
|---|---|---|
| 0 | ✅ | npm run build |
| 1 | ✅ | Hero, GUI, DataGap, Blender |
| 2 | ✅ | GAN, Compositing, Particles, Measurement |
| 3 | ✅ | Results, OpenSource, Inspection cursor |
| 4 | ✅ | SEO, vercel.json, audit pass |

---

## Audit (A12)

### JS chunks (raw bytes, dist/_astro/)

| Chunk | Raw KB | Poznámka |
|---|---|---|
| motion.js (GSAP+ST) | ~110 | Hlavní budget — lazy-loaded per feature module |
| scroll-setup (Base) | ~20 | Lenis + init |
| gui-demo.js | ~6.2 | Největší custom modul |
| inspection-cursor | ~2.3 | |
| latent-navigator | ~6.1 | 2.7 KB gzip (po A5-r1 revizi) |
| particle-transition | ~2.2 | |
| Ostatní feature moduly | ~1–1.5 each | |

**Poznámka:** GSAP je sdílený přes motion.js chunk; gzip součet feature modulů + motion při lazy load splňuje interaktivní budget, ale motion chunk je velký — monitorovat při deployi.

### Deploy kroky (A13)

1. `vercel link` v rootu repozitáře
2. Build command: `npm run build`, output: `dist`
3. `vercel --prod` nebo GitHub → Vercel import
4. Nastavit produkční doménu → aktualizovat `site.url` v `src/data/site.js`

### Analytics doporučení

Plausible (privacy-friendly, <1 KB) — pouze po schválení zadavatele.

---

## Visual QA pass (2026-08-04)

**Report:** [visual-qa-report-2026-08-04.md](visual-qa-report-2026-08-04.md)  
**Fix prompt (P0):** `.cursor/prompts/fix-p0-qa-batch.md`

| Agent | Nálezů | P0 |
|-------|--------|-----|
| visual-debugger | 33 | 2 (V-001 GuiDemo grid, V-002 deck overflow) |
| animation-debugger | 18 | 3 (ST refresh, Lenis CTA, latent double init) |
| cross-browser-tester | 14 | 0 |
| accessibility-auditor | 19 | 3 (skip link, inspectable tabindex, focus ring) |
| performance-auditor | 16 | 0 (P-001 JS budget = P1 borderline) |

**Nejkritičtější:** GuiDemo layout 768–1024px · scroll infra · a11y keyboard bypass.

---

## A5-r1 — Latent Navigator UX revize (2026-08-04)

**Problém, který uživatel nahlásil:** podsekce se nevejde na malý monitor a „efekt je potřeba upravit".

**Awwwards / UX nálezy a opravy**

| # | Nález | Oprava |
|---|-------|--------|
| 1 | Vertikální stack (480px display + 400×300 mapa + seed) = ~900 px → nevejde se na 1366×768 | Dvousloupcový layout od 800px (viewer \| panel), velikost vieweru řízená `--lv-size: clamp(200px, min(46vh, 40vw), 400px)` → blok se vejde na jednu obrazovku |
| 2 | **4 stacked `<img>` s `opacity = w_i`** není vážený součet, ale source-over → tmavé/špinavé prolnutí | Kumulativní alfa `a_k = w_k / Σ(w_0..w_k)` → matematicky přesná bilineární interpolace (změřeno: `1 / 0.5 / 0.333 / 0.25` = 4× 25 %) |
| 3 | Snímky v gridu byly řazeny podle názvu → sousedi vizuálně nesouvisí, crossfade = dvojexpozice | `slice-latent.mjs` počítá pro každý snímek centroid + hlavní osu + jas; lattice X = orientace, Y = stav povrchu (tmavá zadní strana → světlá přední → defekty). Snímky navíc **centrovány na centroid** → prolnutí neřeší translaci |
| 4 | Prolnutí přes celou celu = obraz je pořád rozmazaný | Crossfade band 42 % cely se smoothstepem → uvnitř celé je vidět jeden ostrý reálný GAN snímek |
| 5 | Klid v mid-cell pozici (start i `Home` = 0.5/0.5, což je na lichém 10×8 lattice středem cely) → web se otevíral rozmazaným 4-way blendem | Home node = (4,3); **detent snap** na nejbližší node po `pointerup` / `pointerleave` → žádné gesto nekončí v prolnutí |
| 6 | `gx/gy` easing byl mrtvý kód (blend čte `tx/ty`) → skokové přechody | Blend čte eased `gx/gy`, RAF se zastaví po dojezdu |
| 7 | Permanentní RAF (QA-015) | Stop po dojezdu + `IntersectionObserver` pauza mimo viewport + attract mode končí po jednom kole |
| 8 | Touch: `pointerdown` bez `pointermove` → na mobilu se nedalo táhnout | Pointer capture + `pointermove` na obou plochách; viewer = relativní drag, mapa = absolutní pozice |
| 9 | `src` se přepisoval každý frame; nový snímek mohl blesknout jako prázdný | Image cache, swap jen na dekódovaný snímek, prefetch 3×3 okolí |
| 10 | Canvas mapa: fixní 400×300, ne DPR-aware, náhodný gradient bez významu | DPR-aware, re-render na resize, kreslí reálnou 10×8 lattice + zvýrazněný aktivní quad + glow pod kurzorem; osy popsané (`orientation` / `surface`) |
| 11 | Žádná afordance — nic nezvalo k interakci | Attract mode hopuje node→node (jedno kolo), chip „drag to traverse" mizí po prvním dotyku, reticle na hover |
| 12 | `data-inspectable` s **fixní** `confidence 93.15 %` na měnícím se snímku | Odstraněno — lhalo by; viewfinder rám + reticle drží cross-cutting motiv |
| 13 | Readout jen `seed` | `vector` / `sample` / `blend` / `seed` — mono, tabular-nums, vysvětluje mechanismus |
| 14 | `tabindex` na rootu bez focus ringu, arrows bez ohlášení | `:focus-visible` outline, arrows = krok po node, `Home` = reset, `aria-live` ohlašuje pozici |

**Verifikováno headless Chrome (CDP)** na 360×640, 390×844, 768×1024, 820×1180, 1024×768, 1280×720, 1366×768, 1920×1080 — blok se všude vejde do jedné obrazovky. Simulovaný drag: během tažení `95 % + 1 more`, po uvolnění snap na node `7,5` a `single sample`. `prefers-reduced-motion`: bez attract, bez RAF, okamžitý update.

**Velikost:** `latent-navigator.js` 2.7 KB gzip (bylo ~2.4 KB).
