# Progress board

> Živý dokument. Statusy: `BACKLOG` · `IN PROGRESS` · `BLOCKED` · `DONE`

Poslední aktualizace: **2026-08-10** (Measurement přepracován na reálné snímky a jednu škálu gauge — viz „A8-r1" níže; Results přestavěna na párovou evidence matici — viz „A9-r1" níže)

---

## Vlna 0 — Foundation

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A0 | Scaffold, tokeny, fonty, Base layout, stuby, shared utils, asset pipeline | `DONE` | Astro 7 scaffold, tokens/global/fonts, Picture.astro, lib/*, scroll-setup+Lenis, Nav, index.astro, build-assets.mjs. GSAP 3.15.0 + ScrollTrigger z npm OK (No Charge). Fonty: Clash+Satoshi+JetBrains self-hosted v public/fonts/ |

## Vlna 1

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A1 | Hero — Inspection Chamber | `DONE` | Parallax ±5°, HUD fragments, kinetic decode, counter, CTA scroll. **QA 2026-08-05:** hero asset přesměrován z GUI screenshotu na centrovaný crop `Image_004`; 17 vad opraveno (P0: mrtvý parallax po scrollu, šedý rámec místo světelného kužele, rozpadlý nadpis „D n a") — viz [QA report](visual-qa-hero-2026-08-05.md) |
| A2 | GUI Demo | `DONE` | Degradace vyřešena 08-07 — 15 reálných snímků (`insp-back-01–05` OK, `insp-front-01–05` OK, `insp-defect-01–05` NOK) z `.claude/context/gui_demo/`, `gui-demo-frames.js` přepsán na plnou sadu. Plná simulace CAPTURE/ANALYZE/MEASURE/CLEAR |
| A3 | The Data Gap | `DONE` | 3 editorial bloky, ratio bar scrub, CAD wireframe, counters · 08-05: blok 1 na reálný pár `part-clean`/`part-defected`, bar překlopen na full-width, opraven mizející NOK segment, defekt orámován dvěma změřenými YOLO boxy |
| A4 | Blender | `DONE` | Redesignováno 08-06 na žebřík 4 příček (viz [blender-redesign-2026-08-06.md](blender-redesign-2026-08-06.md)) — samostatný „Defect Revealer" s SVG overlayem zanikl, párové snímky defektu nese A3/DataGap |

## Vlna 2

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A5 | GAN + Latent Navigator | `DONE` | Degradace vyřešena — `public/images/gan_generated/` doplněno (80 reálných GAN výstupů). `scripts/slice-latent.mjs` z nich staví plný 10×8 grid (viz `[r]-[c].webp`), `latent-navigator.js` COLS/ROWS aktualizováno na 10/8. Custom SVG diagram + plný 2D navigator s reálnými snímky |
| A5-r1 | Latent Navigator — UX revize | `DONE` (2026-08-04) | Viz „A5-r1" níže. Layout viewer + panel side-by-side od 800px, výška řízená `--lv-size` (46vh cap) → celá podsekce se vejde na 1366×768 i 360×640. Efekt: lattice seřazená podle orientace/jasu + centrovaná (`slice-latent.mjs`), korektní bilineární alpha, crossfade band + detent snap na nejbližší node |
| A6 | Compositing Deconstructor | `DONE` | Degradace vyřešena 08-07 — `CompositingDeck.astro` celý přepsán na reálný compositor run (seed 0050) s `lane-a-bg/print/alpha/composite` assety, `compositing-deck.js` nový interakční model (scrub/drag/label sync) s přesnými YOLO-derived labely |
| A7 | Particle Transition | `DONE` | Canvas 120×120 grid, pbr→gan; touch/reduced-motion CSS fallback · **08-05 UX revize framů + dojezdu:** source je teď reálný Blender render (`cad_render.png`, dřív fotka `part_clean.png` = rozpor s labelem sekce), target `Image_0079` (stojí na výšku jako render + týž korozní defekt, takže se defekt během transformace „nehojí"), oba framy registrované na podíl plochy a centroid (52,4 / 52,5 %, IoU 0,72); oblouk dojíždí do 98 % místo 95 % (zmizelo ~9 vh mrtvého pinu), nástup 1,6 místo 2,2 (první desetina scrollu už není zmrazená), kolaps obráceným smoothstepem a pozice smootherstepem na témže okně → rozptyl i pozice dosednou spolu; krajní ostré framy se prolínají 2% rampou místo tvrdého přepnutí |
| A8 | Measurement + gauges | `DONE` | Přepracováno 08-10 (viz [„A8-r1" níže](#a8-r1--measurement-na-reálných-snímcích-a-jedné-škále-2026-08-10)) — snímky přesměrovány ze screenshotů GUI na makro cropy reálných snímků z komory, kóty generované z naměřené geometrie, opravena rozdvojená škála gauge, back side má reálná data. Degradace uzavřena. |

## Vlna 3

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A9 | Results | `DONE` | 3 metriky + evidence **matice 3×2**, zero extra JS. Přepracováno 08-10 (viz [„A9-r1" níže](#a9-r1--evidence-matice-na-reálných-assetech-2026-08-10)) — dvě nezávislé galerie nahrazeny párovou maticí (sloupec = třída dílu, řada = origin dat), všech 6 dlaždic na reálných assetech s naměřenými boxy |
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

1. **Assety** — viz assets.md (avatary+loga zbývají; GAN sada, GUI snímky, párové defekty a compositing vrstvy už dodané)
2. **HuggingFace URL** — modely a dataset pro A10 karty
3. **Doména** — aktuálně `synth-eye-web.vercel.app` v site.js
4. **Analytics** — Plausible doporučeno, neimplementováno
5. **Token requests z QA** — A6→A0 chroma green (od 08-10 na něm sedí i Measurement — makro cropy nesou zelenou plotnu komory); A4→A0 defect tint; Y-009→A0 `--text-muted` kontrast; higher-opacity glow overlays
6. **Osiřelé assety po A9-r1** — `gan-output`, `pbr-render` a `part-front` už nedrží žádná
   komponenta (evidence matice je nahradila cropy `gan-front/composite/back` a `evid-*`).
   `gan-output` navíc není zdroj těch cropů (tím je `GAN_output.png`), takže jsou to tři
   mrtvé záznamy v `build-assets.mjs` + 9 souborů v `public/images/`. Odregistrovat lze
   kdykoli, ale mazání souborů skript nedělá — čeká na pokyn.
7. **Horizontální overflow na 768 px** — `SPAN.stat__glow` v sekci Data Gap je 989 px široký
   a přetéká dokument o 111 px (naměřeno CDP, 768×1200). Není to Results (ta má
   `sectionOverflow: 0` na 1440 / 768 / 390), ale zbytek stránky se kvůli tomu na tabletu
   dá posunout do strany. Patří A3.

### Vyřešené

- **GSAP licence** — ✅ vyřešeno: npm balíček obsahuje ScrollTrigger bez club membership, No Charge license pro OSS/prezentaci (greensock.com/licensing)
- **Fonty** — ✅ částečně: staženo do `public/fonts/` (Fontshare API + jsDelivr JetBrains). Spusť `npm run fonts` po clean checkoutu.
- **Visual QA P0 fix batch** — ✅ QA-001–006 ověřeno v kódu (GuiDemo grid reset per breakpoint, ScrollTrigger.refresh + invalidateOnRefresh, scrollToSection export + reduced-motion fallback, latent navigator jediný `whenVisible` init, skip link + focus ring, tabindex na `inspectable` v `Picture.astro`). QA-007 (focus na Defect Revealer) je obsoletní — komponenta zanikla v redesignu A4 08-06.

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

**Zbývá otevřené:** ~~`Results.astro:5–6` bere `gan-output` s `object-position: 0% 0%`
a `50% 0%` — týž list se zapečeným titulkem.~~ Vyřešeno 08-10 v A9-r1 níže.

---

## Log — 2026-08-07: GUI Demo + Compositing Deconstructor na reálných assetech

**Commit `8e648b0`** „Add lane-A assets; overhaul compositing & GUI demo" — dvě dosud
otevřené degradace (assets.md §2.2 a §2.3) vyřešeny dodáním reálných assetů, beze
změny plánu do teď.

**A2 GUI Demo:** `.claude/context/gui_demo/Image_*.png` (15 snímků z reálné inspekční
sady, ne z `Image_004.png` crops jako předtím) → `insp-back-01–05` (OK), `insp-front-01–05`
(OK), `insp-defect-01–05` (NOK) v `build-assets.mjs`. `gui-demo-frames.js` a `gui-demo.js`
přepsány na plnou sadu s bohatší CAPTURE/ANALYZE/MEASURE flow, SVG kótami a vykreslovaným
grafem. Degradace „3 snímky" (assets.md §2.2) je tím zavřená.

**A6 Compositing Deconstructor:** `CompositingDeck.astro` celý přepsán — místo CSS
zeleného pozadí + procedurálního SVG blendu skládá reálný compositor run (seed 0050)
ze čtyř `lane-a-*` assetů (`background.png`, `fingerprint-raw.png` invertovaný přes
nový `negate` krok v `build-assets.mjs`, `fingerprint-alpha.png` s `alphaKey`, hotový
`composite.png`). `compositing-deck.js` nový interakční model (scrub, drag, label sync),
přesná geometrie a a11y/reduced-motion handling. Degradace „5 vrstev, 2 procedurální"
(assets.md §2.3) je tím zavřená — labely teď vycházejí z reálně naměřených plates,
ne z vykreslených čísel přes obrázek.

**Bonus fix mimo zadání:** `initDiagramAnimation()` a duplicitní `whenVisible` volání
z QA-004 zůstávají vyřešené (viz „Vyřešené" výše), stejně QA-001/002/003/005/006 z
`fix-p0-qa-batch.md` — ověřeno přímo v kódu, viz odpovídající řádky v `src/scripts/`.

**Perf fix (nekomitnuto v době QA, commit `5b517ec` „Optimize nav blur and grain
overlay for 4K"):** `.nav--scrolled` `backdrop-filter: blur(12px)` → `blur(6px)` +
vyšší opacity pozadí (0.72→0.85) — na 4K viewportu musí blur při každém scroll frame
resamplovat mnohem víc pixelů přes celou šířku navu, silnější plná barva drží stejný
„frosted" look levněji. `.grain-overlay` ztratil `mix-blend-mode: overlay` (kompenzováno
`opacity: 0.04→0.05`) — blend mode na fullscreen vrstvě nutil repaint celé scrollující
stránky na hlavním vlákně místo levné compositor vrstvy.

**Nezasáhlo plán:** A4 Defect Revealer degradace (assets.md §2.1) — ten prvek zanikl
už v redesignu 08-06 (žebřík místo revealeru), takže se sem nemá co swapovat; poznámka
u A4 v tabulce nahoře opravena.


---

## A8-r1 — Measurement na reálných snímcích a jedné škále (2026-08-10)

Sekce „From pixel to millimeter" byla po review nejslabším místem webu. Dva P0 nálezy
a několik odchylek od zadání A8, všechny opravené v tomhle průchodu.

### P0-1 — snímky nebyly fotky dílu

`measure-front` / `measure-back` se generovaly z `context_images/measurement.png` a
`measurement_back.png`. To ale nejsou fotky dílu s kótami: jsou to **screenshoty celé PyQt
aplikace ve světlém theme** (Camera View + System Logger + Productivity Graph, 1009×634).
Následky: do tmavé sekce šel světlý panel (porušení „tmavé téma"), pod živým GUI demem
stál mrtvý screenshot téhož GUI (pacing), díl zabíral ~15 % plochy v levé horní čtvrtině,
takže SVG kóty s hardcoded pozicemi `x 15/75/35/55` padaly na text loggeru, a v loggeru
byly vypálené tytéž hodnoty, které vedle tvrdí gauges. Týž případ jako `Image_5.png`
u hera (opraveno 08-05), jen neodhalený.

**Řešení bez nové dodávky assetu:** makro cropy reálných snímků z inspekční komory, tedy
z téže sady, ze které losuje GUI demo:

| Tab | Zdroj | Crop (v kádru 1920×1200) | Výsledek | Proč |
|---|---|---|---|---|
| front | `gui_demo/Image_189.png` (= `insp-front-03`) | `270,23 784×980` | 784×980 | díl téměř osově zarovnaný, broušený povrch, díry se zahloubením |
| back | `gui_demo/Image_001.png` (= `insp-back-01`) | `629,0 832×1040` | 800×1000 | naklopený ~22°, hrubý oxidovaný povrch, průchozí díra **bez** zahloubení → přepnutí tabu je vizuálně čitelné |

Oba cropy jsou 4:5, takže přepnutí strany nepřelije layout. Zdroj i crop drží
`src/scripts/data/measure-sides.js` a sdílí je `build-assets.mjs` (extract) i `viewBox`
SVG overlaye — kóty jsou v **nativních** souřadnicích kádru a viewBox je crop okno, takže
se crop a kóty nemohou rozejít.

### P0-2 — jehla a tolerance band měřily na jiné škále

`.gauge__band` měl pevný `inset: 0 20%` (pásmo 20–80 % dráhy), kdežto JS mapoval
`ref ± tol` na **celou** dráhu 0–100 %. Height 62.08 tedy stálo na 84,7 % dráhy, tedy
vpravo **za** zeleným pásmem, a přitom hlásilo `PASS ✓`. Na metrologické sekci ta nejdražší
možná chyba věrohodnosti.

Nová škála je jedna pro obojí: dráha pokrývá `ref ± 1,5·tol`, zelené pásmo tedy leží mezi
16,667 % a 83,333 % a nominál je ryskou přesně ve středu. Pozice jehly se počítá staticky
v Astru (`50 + dev/(3·tol)·100`) a vypisuje se do inline stylu — sekce je správná i bez JS
a animace jen dorovnává z nominálu na hodnotu.

### Kóty jsou teď odvozené, ne nakreslené

`src/scripts/lib/dim-geometry.js` (build-time, do prohlížeče nejde) staví kóty z `outline`
a `holes` v `gui-demo-frames.js`: vynášecí čáry od prvku, kótovací linka odsazená mimo díl,
45° ryskové zakončení, hodnota v mono orientovaná s linkou a s halo tahem v `--bg-deep`.
Rozvržení nekoliduje: šířka nahoře, výška vpravo, rozteč děr vlevo (vynášecí čáry ze středů
děr, jako ve výkresu), průměr vyvedený spodní hranou doprava. Ověřeno rasterizací overlaye
přes hotové assety, ne odhadem.

### Reálná back-side data — otevřená otázka #4 uzavřena

Hodnoty ležely nepoužité v loggeru na `measurement_back.png`:
`[16:21:37] … on back side` → **61.65 / 40.78 / 6.09 / 25.23 mm**, rotation 90.3°.
Kanonická front sada z konceptu (62.08 / 41.02 / 6.10 / 25.20, logger `measurement.png`,
`[16:18:54] … on front side`) přitom v `gui-demo-frames.js` omylem sedla na `back-01`.
Přerovnáno: front sada na `front-03`, back sada na `back-01`. `angle` se **nepřerovnával** —
ten je odečtený z pózy dílu na konkrétním snímku, ne z běhu měření. GUI demo a Measurement
tím čtou z jednoho zdroje a nemohou tvrdit dvě různá čísla o témže snímku.

### Ostatní opravy proti zadání A8

- **Front/back toggle mění i hodnoty.** Dřív měnil jen obrázek a `method:` label. Panel teď
  nese snímek, kóty, gauges i readout jako jeden uzel, takže se hodnoty nemohou rozejít se
  snímkem. Neaktivní panel je `display: none`, tedy i mimo tab order.
- **Odchylka místo čtyř identických PASS.** Každý gauge navíc ukazuje `Δ +2.08` a **podíl
  vyčerpané tolerance** (výška 69 %, šířka 34 %, ⌀ 3 %, rozteč 7 % na front). Čtyři shodné
  „PASS" nic neříkají; tohle ano — a je to pořád reálné číslo.
- **Kóty jsou ovladatelné klávesnicí** (`role="button"`, `tabindex`, Enter/Space) a mají
  neviditelný `stroke-width: 34` hit target, aby se do tenké linky dalo trefit myší.
- **Hover/fokus propojuje oba směry** (dřív jen klik jedním). Klik je zámek, hover napovídá
  a po odjetí se vrací k zamčenému rozměru.
- **Tabs jsou ovladatelné arrow keys / Home / End** s roving tabindexem.
- **`aria-pressed`** na gauges (chybělo), `aria-label` s odchylkou a verdiktem místo
  zadrátovaného „pass".
- **`Picture.astro` nepropouští `hidden`** (props se nespreadují), takže se do doběhnutí
  lazy JS renderovaly **oba** snímky pod sebou. Přepnutí strany teď řeší CSS na panelu,
  atribut `hidden` se nepoužívá — `Picture.astro` (A0) se nemusel měnit.
- **Nominální ryska** ve středu dráhy (zadání ji chtělo, chyběla), `--nok` větev pro FAIL
  je nasazená v CSS i v aria labelu, i když na reálných datech všech 8 rozměrů projde.
- **`method` / `rotation` / `scale px/mm`** jako mono readout pod snímkem — měřítko
  (front 9.44, back 9.61 px/mm) se počítá z delší hrany a naměřené výšky, tedy doklad,
  že kóty a hodnoty popisují týž snímek.

### Změněné soubory

`src/components/Measurement.astro` (přepsán), `src/scripts/measurement-gauges.js` (přepsán),
`src/scripts/lib/dim-geometry.js` (nový), `src/scripts/data/measure-sides.js` (nový),
`src/scripts/data/gui-demo-frames.js` (measured u `front-03` / `back-01`),
`scripts/build-assets.mjs` (registrace `measure-*` z `MEASURE_CROPS`),
`docs/plan/assets.md` (§1 řádky, nová §2.8, §3 tabulka).

**Build:** ✅ `npx astro build` — 1 page, bez varování.

### Zbývá zvážit

- **Volitelný upgrade assetu:** makro snímek dílu z bližší vzdálenosti. Digitální crop
  z 1920×1200 dává na kótování 784×980 px, což na 4K displeji vychází na ~1,3× DPR.
  Není to blocker, ale je to strop, na který sekce naráží.
- **Redundance s GUI demem:** obě sekce ukazují kóty na dílu. Rozlišení je teď v režii
  (demo = operátor dostane verdikt, Measurement = metrologický detail s odchylkou proti
  toleranci), ne v assetech. Kdyby sekce měla dál růst, tohle je místo, kde se rozhoduje.

---

## A9-r1 — Evidence matice na reálných assetech (2026-08-10)

Sekce Results byla zaseknutá na assetech z první vlny, přestože sada, kterou potřebovala,
mezitím vznikla (GAN cropy 08-06, reálné snímky z komory 08-07). Otevřený bod „Results
bere `gan-output` s `object-position`" byl přitom jen jedním ze šesti problémů — audit
dlaždice po dlaždici našel toto:

| Dlaždice | Původní slug | Co se skutečně vykreslovalo |
|---|---|---|
| synthetic 1 | `gan-output` @ `0% 0%` | celý 3-up list se zapečeným titulkem „Example outputs:" |
| synthetic 2 | `gan-output` @ `50% 0%` | **týž list znovu** — `object-position` neměl efekt |
| synthetic 3 | `pbr-render` | export slidu „Comparison: Raw Geometry vs…" se šipkami a leader lines |
| real 1 | `part-front` | 1920×1200, díl na ~10 % plochy u pravé hrany — a **defektní**, přesto `OK 99.15 %` |
| real 2 | `measure-front` | screenshot celého PyQt5 GUI na bílém pozadí |
| real 3 | `measure-back` | dtto, druhý screenshot GUI |

Proč `object-position` nefungoval: `.picture-img` má `height: auto; object-fit: contain`,
takže se obrázek nikam nepřiřezává a není co posouvat. Navíc scoped selektor
`.evidence__img-wrap img` na interní `img` cizí komponenty nedosáhne — Astro scope by
potřeboval `:global()`. Dvě identické dlaždice v jedné řadě přímo porušovaly akceptační
kritérium A9 („žádný snímek se v jedné řadě neopakuje").

Sedmý nález byl overlay: `.evidence__box` kreslil **pevný rect `22,18,52,64` u všech šesti
dlaždic** bez ohledu na obsah — na `part-front` ležel v prázdném pozadí, na GUI screenshotu
obtahoval System Logger. A byl to druhý overlay: `Picture` už dostával `box`/`defects` pro
inspection cursor, takže se anotace na hover zdvojovala.

### Co se změnilo koncepčně

Dvě nezávislé galerie → **matice 3×2**: sloupec = třída dílu, řada = origin dat.
Pointa sekce je sloupcová dvojice (nahoře snímek, na kterém se model učil, pod ním reálný
snímek téže třídy s predikcí), a tu původní layout vůbec nenesl — sloupce nic neznamenaly.

Druhá změna je v povaze anotace, ne jen v assetech:

- **SYNTHETIC** — box je **ground truth**, ne predikce. Compositor ví, kam otisk položil,
  label vzniká zadarmo. Confidence u něj nemá význam, takže tam žádná není: badge `LABEL`,
  linka přerušovaná. Dřív tu byly dopsané verdikty `OK 93.15 %` u generovaných snímků,
  což tvrdilo, že na nich běžela detekce.
- **REAL** — box je predikce s confidence a verdiktem `OK`/`NOK`.

Tím ze sekce odpadla poslední vymyšlená čísla. Ground truth se od predikce liší i **tvarem
linky**, ne jen barvou.

### Assety a naměřená geometrie

| Sloupec | SYNTHETIC | REAL | Verdikt |
|---|---|---|---|
| front side | `gan-front` | `evid-front` | OK 96.02 % |
| front + fingerprint | `gan-composite` | `evid-defect` | NOK 93.74 % |
| back side | `gan-back` | `evid-back` | OK 94.31 % |

`gan-front/composite/back` jsou hotové 340² cropy z GAN redesignu (08-06) — bez zapečeného
titulku, díl plní kádr. `evid-*` jsou **nové** 800² cropy týchž tří snímků z inspekční
komory, které používá GUI demo (`Image_174` / `Image_131` / `Image_001`).

Strana 800 není zvolená kulatostí: v GAN cropech plní díl 86–87 % výšky kádru, a 800 je
nejmenší strana, při které díl vyplní 79–87 % i v reálné řadě a přitom se vejde bez clampu.
První odhad 900 dával 70–77 %, takže syntetická řada vypadala v matici o pár procent „blíž"
a dvojice se nečetla jako týž díl ve dvou původech. Cropy vycházejí přesně na střed
naměřeného bboxu (okraje 50/50, 88/89, 107/107 px).

Souřadnice boxů (v % rozměru snímku) jsou naměřené, ne odhadnuté:

- GAN cropy — prahování jasu > 60 na hotovém assetu; u `gan-composite` navíc segmentace
  hnědého residua (`r > 95 && r−b > 40 && r−g > 14`) + spojité komponenty se sléváním do
  12 px: jediná skupina 1203 px, tedy ten otisk vlevo nahoře.
- `evid-*` — bbox z `outline` v `gui-demo-frames.js` (min/max čtyř rohů v nativním kádru
  1920×1200) minus offset cropu, děleno 800. Defekty a confidence tamtéž, takže čísla
  v sekci jsou z logu reálné inspekce.

Oba kádry jsou 1:1, takže % souřadnic boxů = % rámu dlaždice a řady mají shodnou výšku bez
hacku (původní `.evidence__box` měl `height: calc(100% - 2rem)`, aby maskoval ragged výšky
čtyř různých aspectů).

### Implementace

- **Jeden zdroj geometrie:** statický SVG overlay parsuje **tentýž string**, který jde do
  `data-box` / `data-defects` pro inspection cursor (helper `boxes()`), takže se obě
  vykreslení nemohou rozejít. Hover jen přidá mono chip s labelem, geometrii nepřekresluje.
- **Layout:** gutter s labely origin + 3 sloupce tříd, pozice **explicitní** (`grid-row`
  podle třídy prvku, `grid-column` přes inline `--col`). Auto-placement tu nejde použít —
  první label třídy by sklouzl do prázdné buňky gutteru.
- `.tile__frame` má `aspect-ratio: 1` a `:global(.picture-img)` `object-fit: cover`; to
  `:global` je nutné, jinak scoped CSS na `img` v `Picture.astro` nedosáhne (viz výše).
- Reveal staggeruje jen dlaždice (`data-reveal-stagger="0.09"`), osy matice jsou vidět od
  začátku — jinak by pár chvíli neměl co pojmenovat.
- **Zero extra JS zůstává**, `results.js` nevznikl.
- A11y: verdikt je text, ne barva; `sr-only` prefix v každém `figcaption` říká origin
  i povahu anotace („Ground-truth label, no prediction:" / „Model prediction:"), takže
  matice není jediný nosič významu; osové labely jsou `aria-hidden`.

### Responsive

- **>768** matice s gutterem, 3 sloupce po 375 px, řady zarovnané (naměřeno CDP: synth
  `y=785`, real `y=1201` u všech tří sloupců).
- **≤768** gutter zmizí, pár zůstane párem: dvě kolony (train vlevo, test vpravo), label
  třídy přes celou šířku, origin se stěhuje do captionu dlaždice (`train` / `test`).
- **≤480** jedna kolona, dlaždice 349 px — nad prahem `TAG_MIN_IMAGE_WIDTH` (220 px), takže
  tap-to-inspect chip zůstává čitelný.

### Verifikace

Headless Chrome přes CDP na 1440 / 768 / 390 px: `sectionOverflow: 0` na všech třech,
6/6 obrázků dekódovaných, captiony a confidence odpovídají `gui-demo-frames.js`, zarovnání
řad ověřené z `getBoundingClientRect`. Boxy zkontrolované i renderem do PNG mimo prohlížeč
(překryv rect × snímek) — objektové boxy sedí na dílu, oba defect boxy na obou fingerprint
plochách. `npx astro build` bez varování.

### Změněné soubory

`src/components/Results.astro` (blok `.evidence` a jeho CSS; metriky nedotčené),
`scripts/build-assets.mjs` (3 nové záznamy `evid-*`), `public/images/evid-*`,
`src/data/images.json`, `src/data/lqip.json`.

### Nález mimo zadání

`SPAN.stat__glow` v sekci Data Gap je na 768 px široký 989 px a přetéká dokument o 111 px
(sekce Results má na témže breakpointu overflow 0). Patří A3, nesahal jsem na to.
