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
| A7 | Particle Transition | `DONE` | Canvas 120×120 grid, pbr→gan; touch/reduced-motion CSS fallback · **08-05 UX revize framů + dojezdu:** source je teď reálný Blender render (`cad_render.png`, dřív fotka `part_clean.png` = rozpor s labelem sekce), target `Image_0079` (stojí na výšku jako render + týž korozní defekt, takže se defekt během transformace „nehojí"), oba framy registrované na podíl plochy a centroid (52,4 / 52,5 %, IoU 0,72); oblouk dojíždí do 98 % místo 95 % (zmizelo ~9 vh mrtvého pinu), nástup 1,6 místo 2,2 (první desetina scrollu už není zmrazená), kolaps obráceným smoothstepem a pozice smootherstepem na témže okně → rozptyl i pozice dosednou spolu; krajní ostré framy se prolínají 2% rampou místo tvrdého přepnutí |
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

---

## PipelineBlender — redesign na rozložených assetech (2026-08-06)

**Návrh:** [blender-redesign-2026-08-06.md](blender-redesign-2026-08-06.md) — tři varianty kompozice, zvolena „Žebřík".

Sekce vkládala dva exporty prezentačních slidů (`scheme-hw` ze `scheme_1.png`, `pbr-render`
z `pbr.png`) se zapečenými popisky, šipkami a světlými panely. Nahrazeno kompozicí ze
rozložených assetů; všechny popisky jsou nativně v DOM.

**Čtyři příčky jednoho argumentu** na společném svislém railu (týž prvek jako `.cad-steps`
v DataGapu), jeden `<h2>`, `<h3>` na příčku sazbou jako mono label:

| # | příčka | nese |
|---|--------|------|
| 01 | Virtualization | `stand-real` (fotka standu) \| `scene-twin` (Blender) — TÝŽ rig, HW specs jako `<dl>` |
| 02 | Geometry → material | `material-split` (jeden díl, 40 % geometrie / 60 % PBR) + `mat-front` / `mat-back` |
| 03 | Scale | 8 front + 8 back dlaždic + 6 defect cropů, readout `1 / 6,000 / 2 / 0` |
| 04 | Verification | existující `.ab` blok, doslova nezměněný, `blender-bridge.js` dál běží |

**Rozhodnutí a jejich důvody**

| Rozhodnutí | Důvod |
|---|---|
| `chamber-render.png` (otevřený stage) NEPOUŽIT | jiné zařízení než uzavřená komora (dome light, bez krytu) → vedle sebe se čtou jako dva stroje. Zvolena komora, protože jen k ní existuje fotka reálné předlohy, takže příčka 01 je důkaz, ne tvrzení |
| split geometrie/materiál je STATICKÝ | clay pass (`front-untextured.jpg`) pokrývá jen x 0→986 z kádru 1920, díl leží na 833→1244 → wipe by mohl jezdit přes 37 % šířky dílu a zbytek by musel lhát |
| `material-split` složen v pipeline, ne vložen jak je | clay pass má pozadí luma 202 proti 28 u renderu; nová volba `compose` bere alfu z registrovaného `pbr-front-fingerprint` jako siluetu → světlé pozadí se odřízne a na `--bg-deep` zbyde jen díl |
| `back-untextured.jpg` nepoužit | naměřeno luma 177–226 na celém kádru = plochá deska bez rysů |
| dlaždice cropnuté 200×250 na naměřený střed | díl v nativních 480×300 zabíral 11 % plochy; po cropu 68 % výšky. Rotace ±25° zůstává, tvrzení o náhodné pozici nese readout |
| vizuální vrchol = příčka 03 | jediný prvek v plné šířce, jediný s 22 obrazy. Příčka 04 zůstává tichá — nese argumentační dopad, ne crescendo |
| readout `1 source scene` místo `auto pose · lighting` | slovo v sazbě `--fs-mono-lg` se vedle „6,000" čte jako chybějící hodnota; randomizace je tvrzení, ne metrika |

**Assety:** 27 nových záznamů v `build-assets.mjs`, zdroje v `.claude/context/context_images/decomposed/`.
Nová volba `compose { alphaFrom, over, splitX }` — jednoúčelová jako `alphaKey`, běží před
`crop`; do `recipe` hashe jdou i mtime compose zdrojů. `scheme-hw` ze `ASSETS` odešel
(nikdo ho nepoužívá), `pbr-render` zůstává — drží ho `Results.astro:7`.

**JS:** žádný nový soubor. Mřížka jede na existujícím `data-reveal-group` staggeru;
`lib/reveal.js` umí nově `data-reveal-stagger` na group (22 položek × 0.08 s = 1.76 s
bylo moc, 0.03 s dá 0.66 s a čte se to jako dávka generování).

**Verifikováno headless Chrome (CDP)** na 360, 768, 1366 a 1920 px:
žádný horizontální overflow uvnitř sekce, 29 obrázků má width/height (bez layout shiftu),
žádný se nezobrazuje nad nativní rozlišení, 22 dlaždic je `alt=""` (obsah nese sada,
tvrzení je v `<figcaption>`). Struktura `H2 + 4× H3`. Při `prefers-reduced-motion`
je viditelný veškerý obsah.

### Nález mimo zadání

`public/images/decomposed_svg/` (22 MB zdrojů včetně čtyř `_layout.svg` s embedded base64)
se z `public/` kopírovalo do `dist/` — třetina celého buildu. Adresář **přesunut**, ne
smazán, do `.claude/context/context_images/decomposed_svg_source/`; `dist` 64 MB → 42 MB.

Zbývá otevřené: page-level horizontální overflow na 360/768 px z **jiných** sekcí —
`DataGap` `.stat__glow` (`inset: -20 %` na radiálním glow, left −44 px) a `GuiDemo`
`.gui-btn` na 360 px. Existovalo před tímhle úkolem, v sekci Blender žádný prvek nepřetéká.

---

## Redesign sekce GAN — 2026-08-06

**Spouštěč:** mezi `<h2>` „Statistical learning: generative networks" a nadpisem
„Latent space navigator" visel `scheme-gan` — export prezentačního slidu se zapečeným
titulkem „AI-Based Predictions with Synth.Eye", šipkou, rámečky a Summary boxem
(6000 / >99 % / >95 %). Týž případ jako `scheme-hw` v sekci Blender: cizí font na světlém
panelu ztlumeném `opacity: 0.7`, a čísla, která web už drží nativně v `Results.astro`
a `DataGap.astro`.

**Co odešlo:** `scheme-gan` ze `ASSETS` i z `public/images/` (`scheme_3.png` zůstává
v kontextu). V `ASSETS` už není žádný export slidu kromě `gan-output` a `pbr-render`.

**Co přišlo místo něj — příčka 01 „Three generators":**

| Prvek | Obsah |
|---|---|
| mapa (inline SVG) | dvě dráhy: front + fingerprint → compositor → YOLO set, back **mimo** compositor |
| triptych | 3 karty `front.pkl` / `back.pkl` / `fingerprint.pkl`, každá 4 reálné výstupy + mono meta |

Dlaždice jsou existující výřezy z `public/images/latent/` (~7 KB/kus, zarovnané na centroid),
takže triptych nepřidal do budgetu nic a snímky jsou v cache navigátoru pod ním.
Klasifikace podle `latent/manifest.json`: `Image_0000–0039` back, `0040–0059` front,
`0060–0079` front **+ kompozit** fingerprintu (surové 128² residuum v assetech není —
popisek to říká přesně tak).

**Struktura:** sekce byla čtyři samostatné widgety pod jedním `<h2>`. Teď drží týž rail
s mono indexy jako `PipelineBlender.astro` (`.ladder` / `.rung`, 01 generators →
02 latent space → 03 compositing → 04 trade-off), takže obě poloviny Aktu II jsou
čitelně sourozenci. Framing dvou hlasů („Blender says / GAN says") byl dvakrát běžný
odstavec → dyptich s mono eyebrow, ztlumený Blender vs. GAN v `--text-primary` s accent
linkou. Srovnávací tabulka byla dvě karty s vlastními `<dl>` (oko muselo hledat, co je
proti čemu) → jedna osa vlastností a dvě kolony hodnot.

**Rozhodnutí a jejich důvody**

| Rozhodnutí | Důvod |
|---|---|
| mapa má DVĚ dráhy, ne 3→1 | předchozí schéma svádělo i `back.pkl` do compositoru — věcně špatně, back jde do YOLO tréninku bez kompozice (`REDSME-2.md`) |
| mapa zůstala SVG s vodorovným scrollem pod 620 px | zmenšit ji na šířku mobilu = sazba pod 9 px; DOM varianta by musela replikovat elbow spojnice v CSS |
| dvanáct dlaždic, ne 80 | 80 je práce navigátoru; karty tvrdí „tři distribuce", ne „hodně snímků". Readout pod nimi ten vztah pojmenuje |
| metriky se v sekci NEopakují | `>99 / >95 / 6 000` drží Results a DataGap; slide je tvrdil podruhé a to byl půl důvodu, proč působil jako cizí těleso |

### Nález mimo zadání — CompositingDeck

Deck bral všechny tři obrazové vrstvy z `gan-output.webp` (list „Example outputs:")
a řezal je `object-position`. `layer_1` s `0% 0%` padl přesně na zapečený titulek, takže
deck ukazoval „**Example outputs:**" jako vrstvu kompozice; YOLO boxy vrstvy `layer_4`
navíc visely mimo díl. Opraveno v `CompositingDeck.astro` + `build-assets.mjs`:

- tři nové assety `gan-front` / `gan-composite` / `gan-back` — kvadratické cropy 340²
  kolem naměřených bboxů dílů (jas > 60: `181–405`, `496–694`, `782–1032`, y `87–384`),
  titulek je mimo kádr
- kádr decku je `aspect-ratio: 1` (všechny reálné výstupy jsou 1:1; při 4/3 cover crop
  odřezával dílu horní hranu, a s ní i horní kótu bounding boxu)
- boxy naměřené na `gan-composite`: díl `20.5 / 6 / 59 / 88 %`, fingerprint (r − b > 55)
  `24.5 / 6 / 14.5 / 20.5 %`; labely dostaly `paint-order: stroke` kvůli čitelnosti
  nad světlým kovem

`initDiagramAnimation()` v `latent-navigator.js` navíc nerespektoval
`prefers-reduced-motion` — mapa se scrubovala i tam, kde má být nakreslená hotová.
Doplněn guard.

**Verifikováno headless Chrome (CDP)** na 360, 768 a 1440 px s `prefers-reduced-motion`:
`document.scrollWidth == innerWidth` na všech třech (mimo vlastní scroll container mapy),
struktura `H2 + 4× H3`, dlaždice `alt=""` s tvrzením ve `<figcaption>`, karty triptychu
mají shodnou výšku (594 px na 1440).

**Zbývá otevřené:** `Results.astro:5–6` bere `gan-output` s `object-position: 0% 0%`
a `50% 0%` — týž list se zapečeným titulkem. Nové assety `gan-front` / `gan-composite`
jsou přímo k tomu použitelné, ale je to jiná sekce, tak to nechávám na pokyn.
