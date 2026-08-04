# A2 — Interaktivní GUI Demo („Try the Inspector")

**Vlna 1 · paralelně · větev `feat/a2-gui-demo` · největší úkol v projektu**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/GuiDemo.astro`, `src/scripts/gui-demo.js`,
`src/scripts/data/gui-demo-frames.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

**Signature moment celého webu.** Zjednodušená, ale **funkční (simulovaná)** verze reálné
PyQt5 inspekční aplikace Synth.Eye, přímo v browseru. Ne screenshot — uživatel klikne
CAPTURE, ANALYZE, MEASURE a vidí, jak systém pracuje.

Heading: *„See what the operator sees"*
Subtext: *„This is a simulation of the real Synth.Eye inspection interface. Click CAPTURE and ANALYZE to inspect a part."*

---

## Zdroj pravdy — referenční mockup

`.claude/context/Synth.Eye - html/synth_eye_gui_template.html` je **reálný mockup inspekčního GUI**
(light theme, vanilla JS, včetně funkčního SVG grafu). **Otevři ho a přečti celý** — je to tvůj
strukturní a obsahový základ.

Přeneseš z něj:
- **Layout:** Camera View card (viewport + toolbar), System Logger card (log lines + metriky
  Total Logs / OK Detections / NOK Detections), Brand card s logem, Camera Info rows
  (Camera / Resolution / Last Update / System), Productivity Graph card se SVG křivkou
- **Toolbar buttony:** `DISCONNECT`, `CAPTURE`, `ANALYZE`, `MEASURE`, `CLEAR` — včetně SVG ikon
  (zkopíruj inline SVG paths z mockupu, neshazuj je za ikonovou knihovnu)
- **Reálné log zprávy** — použij přesné formulace z mockupu, například:
  ```
  Capture button pressed. Performing camera scan.
  Image successfully captured with resolution 1600x1200 in RGB format.
  Analyze button pressed. Performing SynthEye AI analysis of the RGB image.
  Detected front side of the metallic object on the image. Confidence: 93.15 %.
  Detected defect in the area of fingerprint on the front side of the metallic object. Confidence: 92.93 %.
  The result of the SynthEye AI analysis is OK. Confidence: 99.86 %.
  The SynthEye AI analysis has been completed.
  ```
- **SVG graf** — přestyluj existující implementaci, nepřepisuj ji na knihovnu

**Přestylování je povinné:** mockup je light theme, web je dark. Převeď na:
- karta: `var(--bg-elevated)`, nested elementy `var(--bg-surface)`
- bordery `var(--border)`, hover `var(--border-hover)`
- text `var(--text-primary)` / `--text-secondary` / labely `--text-muted`
- **zachovej** `var(--ok)` zelenou a `var(--nok)` červenou (průmyslová semantika)
- **zachovej monospace** (`var(--font-mono)`) pro logger, metriky, timestampy, hodnoty
- accent `var(--accent)` pro aktivní stavy a scanline
- radiusy 2–4px, ne 8px na všem

---

## Co musí fungovat (simulovaně)

### `CAPTURE`
Swapne obrázek v camera view z předpřipravené sady + krátký **flash efekt** (bílý overlay,
90ms, ease-out) simulující capture. Zaloguje 2 řádky (capture pressed + resolution).
Aktualizuje `Last Update` timestamp.

### `ANALYZE`
Sekvence (celkem ~2.2 s, GSAP timeline):
1. **Scanline** přejede přes snímek shora dolů — fialová/bílá, poloprůhledná, 1–2px linka
   s glow (`var(--accent)`), ~900ms
2. **Progress indikátor** — tenký bar nebo procenta v monospace
3. **Bounding boxy** se overlayují se confidence scores (staggered, `--ok` / `--nok` podle typu)
4. **OK / NOK výsledek** naskočí — velký badge, `--ok-glow` / `--nok-glow` pozadí
5. **Logger** se plní timestampovanými zprávami postupně (ne všechny naráz), auto-scroll dolů
6. **Productivity Graph** — přibude bod, křivka se plynule prodlouží, nový bod „přistane"
   s bounce efektem. Counter vedle grafu se inkrementuje. Metriky Total/OK/NOK se aktualizují.

`ANALYZE` je disabled, dokud neproběhl `CAPTURE` (a po `CLEAR`).

### `MEASURE`
Aktivní jen po `ANALYZE`. Zobrazí na dílu **rozměrové kóty** (SVG overlay: vodicí linky +
hodnoty v monospace) a malé tolerance indikátory. Hodnoty z reálného projektu:
`Height 62.08 mm (60.0 ±3.0) ✓` · `Width 41.02 mm (40.0 ±3.0) ✓` ·
`Hole ⌀ 6.10 mm (6.0 ±3.0) ✓` · `Hole dist. 25.20 mm (25.0 ±3.0) ✓`

### `CLEAR`
Resetuje vše s fade-out animací: viewport na idle stav, boxy a kóty pryč, výsledek pryč.
**Logger a graf zůstávají** (jako v reálné app — je to historie), ale zaloguje se clear událost.

### `DISCONNECT` / `CONNECT`
**Záměrně nefunkční.** Na klik zobraz tooltip / inline zprávu:
*„Connect a Basler camera to use this feature"* — je to call to action pro reálné použití,
ne chyba. Stylizuj jako informační, ne error.

### System Logger
Plní se automaticky timestampovanými zprávami jako reálná aplikace. Monospace, scrollovatelný,
timestamp v `--text-muted`, zpráva v `--text-secondary`, confidence hodnoty zvýrazněné.
Nový řádek má krátký fade-in. Cap na ~200 řádků (staré odmazávej).

---

## Data — oddělená od logiky (důležité)

Veškerý obsah sekvence patří do `src/scripts/data/gui-demo-frames.js`:

```js
export const frames = [
  {
    id: 'frame-01',
    slug: 'part-front',              // slug pro Picture.astro / /images/<slug>.avif
    side: 'front',
    verdict: 'OK',                   // 'OK' | 'NOK'
    confidence: 99.86,
    boxes: [
      { label: 'Cls_Obj_Front_Side', confidence: 93.15, x: 0.24, y: 0.18, w: 0.52, h: 0.64, type: 'object' },
    ],
    measurements: [
      { name: 'Height', ref: 60.0, tol: 3.0, value: 62.08 },
      /* … */
    ],
    logs: [ /* pole stringů v pořadí, s relativním delay */ ],
  },
  /* … */
];
```

Souřadnice boxů jsou **normalizované 0–1** vůči obrázku, aby fungovaly responsivně.
Přidání dalších snímků později = přidání položek do arraye, **nula změn v `gui-demo.js`**.

### Assety — degradovaný stav

Máme **1** reálný snímek dílu (`part-front`), koncept chce 6–8. Viz [../assets.md](../assets.md) §2.2.
Postav sekvenci nad **3 stavy**: `part-front` jako OK front side, tentýž snímek s CSS/SVG
fingerprint overlayem jako NOK, a `measure-back` crop jako OK back side. Do `progress.md` zapiš,
že sekce čeká na dodání 5 dalších snímků.

---

## Technické constraints

- Markup + scoped CSS v `GuiDemo.astro` (zero JS v komponentě kromě `whenVisible` zapojení).
  Logika v `src/scripts/gui-demo.js` s `export default function init(root)`.
- **Custom SVG graf** — žádná charting knihovna (D3, Chart.js zakázané). Křivka jako `<path>`
  s animovaným `d` nebo `stroke-dashoffset` draw efektem přes GSAP.
- GSAP timeline pro sekvence (importuj `gsap` z `lib/motion.js`, ne přímo z npm).
- Tohle je největší JS soubor projektu — drž se **pod 8 KB gzip**. Žádné duplicity, žádné
  utility, které už jsou v `lib/`.
- Buttony jsou `<button>` s `aria-disabled` / `disabled`, ne `<div onclick>`. Celé demo
  ovladatelné klávesnicí. Změny stavu ohlas přes `aria-live="polite"` region (logger je
  přirozený kandidát).
- Canvas nepoužívej — bounding boxy a scanline jako DOM/SVG overlay (lépe se stylují a jsou
  přístupné).
- Responsive: desktop = grid podle mockupu (camera view dominantní vlevo, logger vpravo,
  info karty dole). Pod 1024px → 2 kolony, pod 768px → **stacked** (camera view, toolbar,
  výsledek, logger, graf). Toolbar na mobilu horizontálně scrollovatelný, ne zalomený.
- `prefers-reduced-motion`: scanline se nepřejíždí (jen krátce blikne), bounce na grafu vypnutý,
  boxy se zobrazí okamžitě, flash efekt vypnutý. **Všechna funkcionalita zůstává** — jen bez
  pohybu.

Pod GUI demo: odkaz na GitHub pro reálnou verzi (`https://github.com/rparak/Synth_Eye`),
v `--font-mono`, ne tlačítko s gradientem.

## Akceptační kritéria

- [ ] Layout věrně odpovídá `synth_eye_gui_template.html`, ale v dark theme s tokeny projektu
- [ ] CAPTURE swapne snímek s flash efektem a zaloguje 2 zprávy
- [ ] ANALYZE přehraje celou sekvenci: scanline → progress → boxy → OK/NOK → logy → nový bod v grafu
- [ ] MEASURE zobrazí 4 kóty s reálnými hodnotami a PASS indikací
- [ ] CLEAR resetuje viewport, ale zachová logger a graf
- [ ] DISCONNECT zobrazí zprávu o Basler kameře, nic nerozbije
- [ ] Metriky Total Logs / OK / NOK se aktualizují konzistentně s průběhem
- [ ] Graf: každý ANALYZE přidá bod, křivka se prodlouží plynule, counter se inkrementuje
- [ ] Opakované klikání v libovolném pořadí nerozbije stav (ANALYZE bez CAPTURE je disabled)
- [ ] Celé demo ovladatelné jen klávesnicí, focus vždy viditelný
- [ ] Na 768px a 360px stacked layout, vše čitelné, žádný horizontální scroll stránky
- [ ] `prefers-reduced-motion` — plná funkčnost bez pohybových animací
- [ ] `gui-demo.js` < 8 KB gzip
- [ ] `git status` obsahuje jen tvoje 3 soubory + `progress.md`

## Co NEDĚLAT

- Nepoužij charting knihovnu ani ikonovou knihovnu — SVG inline, custom.
- Nedělej z toho screenshot ani video — musí to být interaktivní DOM.
- Nesnaž se simulovat real-time kamerový feed (není potřeba a je to nevěrohodné).
- Nevymýšlej si confidence hodnoty a log formulace — ber je z reálného mockupu.
- Nezaváděj React ani žádnou state knihovnu; scripted sekvence nepotřebuje reaktivní state.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
- Neimplementuj inspection cursor nad snímkem — to je A11. Jen přidej `data-inspectable`
  atributy tam, kde má smysl.
