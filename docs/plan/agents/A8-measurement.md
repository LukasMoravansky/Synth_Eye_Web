# A8 — Measurement + Precision Gauges

**Vlna 2 · paralelně · větev `feat/a8-measurement`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/Measurement.astro`, `src/scripts/measurement-gauges.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

Kratší sekce, která ukazuje, že Synth.Eye **není jen detekce, ale i dimensionální kontrola**.

Heading: **From pixel to millimeter**
Klíčová zpráva: *„From pixel to millimeter. Every part is measured, every tolerance verified."*

---

## Layout

**Split, ne 50/50:**
- **Vlevo:** snímek dílu s **overlayed kótami** — assety `measure-front` (`measurement.png`)
  a `measure-back` (`measurement_back.png`), přestylované do dark theme. Pokud zdrojové snímky
  už kóty obsahují vypálené, překryj je vlastním **SVG overlayem** s vodicími linkami a hodnotami
  v `--font-mono` (a původní kóty potlač tmavým overlayem / cropem) — kóty musí být **interaktivní
  elementy**, ne pixely v obrázku, protože se rozsvěcují na klik.
- **Vpravo:** interaktivní tolerance gauges (viz níže).

Front/back **přepínací toggle** nad vizuálem: mění snímek i měřené hodnoty.
- `front` → Hough circles (detekce děr)
- `back` → contour analysis
- Metoda se zobrazuje jako monospace label pod togglem: `method: hough_circles` /
  `method: contour_analysis`

---

## Interaktivní prvek — Measurement Precision Gauges

**Ne tabulka s čísly.** Interaktivní vizualizace:

### Data (reálné hodnoty projektu, použij přesně tyto)

**Front side:**

| Dimension | Reference | Tolerance | Measured | Result |
|---|---|---|---|---|
| Height | 60.0 mm | ±3.0 mm | 62.08 mm | PASS |
| Width | 40.0 mm | ±3.0 mm | 41.02 mm | PASS |
| Hole ⌀ | 6.0 mm | ±3.0 mm | 6.10 mm | PASS |
| Hole dist. | 25.0 mm | ±3.0 mm | 25.20 mm | PASS |

**Back side:** použij stejné rozměry s mírně odlišnými měřenými hodnotami, ale **jen pokud
je znáš z kontextu projektu**. Pokud ne, zobraz pro back side stejnou sadu a do `progress.md`
zapiš požadavek na dodání reálných back-side hodnot. **Nevymýšlej čísla, která budou vypadat
jako měřicí protokol.**

### Chování gauge

Každý měřený rozměr má **„živý" gauge**:
- **Tolerance band** jako horizontální dráha (`--bg-surface`), uvnitř zelené pásmo
  (`--ok-glow` výplň, `--ok` hranice) reprezentující `reference ± tolerance`, s centrální
  nominální ryskou
- **Jehla / marker** ukazuje měřenou hodnotu. Scroll-triggered se **ustálí na hodnotě
  s fyzikální simulací: overshoot + settle** (GSAP `elastic.out(1, 0.5)` nebo tlumená pružina,
  ~900ms, stagger 120ms mezi gauges)
- Po ustálení se tolerance band **rozsvítí** zeleně (`PASS`) nebo červeně (`FAIL` —
  `--nok` / `--nok-glow`)
- Hodnoty vedle gauge v `--font-mono`, tabular-nums, měřená hodnota **napočítaná** utilitou
  `animateCounter` z `lib/counter.js` (2 desetinná místa), reference a tolerance staticky
  v `--text-muted`
- **Kliknutím na konkrétní rozměr** se na snímku dílu **rozsvítí odpovídající kóta** —
  propojení dat a vizuálu. Zvýrazněná kóta: `--accent` linka + zvětšený label + jemný glow.
  Kliknutí je toggle; aktivní může být jedna kóta.
- **Opačný směr taky:** hover/klik na kótu v obrázku zvýrazní odpovídající gauge.
  (Toto je ta věc, která z informační sekce dělá zážitek — nevynechávej ji.)

---

## Technické constraints

- Markup + scoped CSS v `Measurement.astro`; JS v `src/scripts/measurement-gauges.js`
  (`export default function init(root)`), zapojení přes `whenVisible` z `lib/lazy-init.js`.
- Gauges postav jako **inline SVG nebo čisté CSS** (ne canvas) — musí být přístupné a stylovatelné.
- Data drž v jednom objektu na začátku modulu (nebo jako `data-*` atributy v markupu — preferováno,
  protože pak jsou hodnoty v HTML a čitelné bez JS). **Preferuj `data-*` atributy.**
- Propojení gauge ↔ kóta přes shodné `data-dim="height|width|hole-diameter|hole-distance"`.
- Obrázky přes `Picture.astro` (A0), `loading="lazy"`, `data-inspectable`
  (`label="Cls_Obj_Front_Side" confidence={99.15}`).
- GSAP z `lib/motion.js`, countery z `lib/counter.js`, reveal přes `data-reveal`.
- `prefersReducedMotion()` → gauges jsou **okamžitě na cílových hodnotách** bez overshootu,
  countery skočí na hodnotu, tolerance bandy hned obarvené. Klik-propojení **zůstává funkční**
  (je to informace, ne animace).
- Toggle front/back je `<button>` páry v `role="tablist"` / `role="tab"` (nebo radiogroup),
  ovladatelný arrow keys.
- Přístupnost:
  - gauges jsou `<button>` (klikací) s `aria-pressed` a `aria-label` typu
    `„Height: measured 62.08 mm, reference 60.0 mm, tolerance ±3.0 mm, pass"`
  - hodnoty jsou v DOM jako text, ne jen ve SVG `<path>` — čitelné screen readerem
  - PASS/FAIL **nesmí být rozlišené jen barvou** — přidej textový label `PASS` / `FAIL`
    a ikonu (✓ / ✕ jako inline SVG)
- Responsive: pod 900px stacked (snímek nahoře, gauges pod ním). Gauges na mobilu full-width,
  label / dráha / hodnota v jednom řádku nebo pod sebou. Pod 480px snímek s kótami může
  potřebovat pinch-zoom — přidej `data-inspectable` a nechej ho v přirozené velikosti,
  nezmenšuj kóty pod čitelnost.

## Akceptační kritéria

- [ ] Split layout, **není** symetrický 50/50
- [ ] 4 gauges s tolerance bandy, jehla dojede s viditelným overshootem a ustálí se
- [ ] Gauges se animují staggered při scrollu do viewportu, ne všechny naráz
- [ ] Měřené hodnoty se napočítají na 2 desetinná místa, tabular-nums (čísla neposkakují)
- [ ] Klik na rozměr rozsvítí odpovídající kótu na snímku; klik na kótu zvýrazní gauge
- [ ] Front/back toggle mění snímek, hodnoty i monospace label metody
- [ ] PASS/FAIL je čitelné bez barvy (text + ikona)
- [ ] Kóty jsou SVG/DOM elementy, ne vypálené pixely v obrázku
- [ ] Klávesnicí: toggle i gauges ovladatelné, focus viditelný
- [ ] `prefers-reduced-motion`: hodnoty a bandy v cílovém stavu, klik-propojení funguje
- [ ] 360 / 768 / 1440px ověřeno
- [ ] `git status` obsahuje jen `Measurement.astro`, `measurement-gauges.js`, `progress.md`

## Co NEDĚLAT

- Nedělej z toho statickou tabulku čísel — koncept to explicitně odmítá.
- Nevymýšlej si měřené hodnoty pro back side.
- Nepoužij charting/gauge knihovnu — inline SVG / CSS.
- Nepoužívej canvas (ztratíš přístupnost a klikatelnost kót).
- Nerozlišuj PASS/FAIL jen barvou.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
- Neimplementuj inspection cursor (A11) — jen `data-inspectable` atributy.
