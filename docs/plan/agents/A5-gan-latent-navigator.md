# A5 — GAN Pipeline + Latent Space Navigator

**Vlna 2 · paralelně · větev `feat/a5-gan`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/PipelineGAN.astro`, `src/components/LatentNavigator.astro`,
`src/scripts/latent-navigator.js`
**Nesmíš editovat:** `src/components/CompositingDeck.astro` (patří A6 — ty ho jen importuješ,
stub už existuje od A0), ani nic dalšího

---

## Cíl

Druhá polovina Aktu II: **statistical learning**. GAN nesmí vypadat jako „verze 2, co nahradila
verzi 1" — je to **evoluce**, jiný přístup ke stejnému problému, s jinými silnými stránkami.

Heading sekce: **Statistical learning: generative networks**

Framing:
> Blender says: *„I know exactly what reality looks like, and I will reconstruct it from scratch."*
> GAN says: *„Show me 130 examples and I will learn what they have in common — and generate thousands more."*

---

## Kontext

Synth.Eye GAN používá **StyleGAN2-ADA** se třemi modely: `front.pkl`, `back.pkl`,
`fingerprint.pkl`. Výstupy se kompozitují do finálního snímku s YOLO anotacemi.
Vstup: ~130 reálných fotek. Zdroj technického kontextu:
`.claude/context/Claude_project/REDSME-2.md` — **přečti ho** pro věcnou správnost.

**Vizuální shift proti Blender sekci (povinný):** Blender část je „engineered" (schémata,
wireframy, chladné tóny). GAN část je **„organic"** — gridy generovaných obrázků,
noise→image přechody, latent space vizualizace, měkčí data-driven vizuální jazyk, více variace.
Tenhle kontrast je narativní pointa, ne dekorace.

---

## Struktura sekce (3 části + srovnávací tabulka)

### 1. GAN Architecture Diagram

Zjednodušený, **ne akademický**. Tři generátory → compositor → labeled output:

```
front.pkl  ─┐
back.pkl   ─┼─►  compositor  ─►  alpha blend + pressure sim  ─►  labeled output (YOLO)
fingerprint.pkl ─┘
```

- Postav ho jako **inline SVG** (ne obrázek) — nodes jako obdélníky s `--bg-surface` pozadím
  a `--border`, labely v `--font-mono`, spojnice jako `<path>`.
- **Animovaný flow:** data „tečou" diagramem při scrollu — animuj `stroke-dashoffset` na
  spojnicích (ScrollTrigger `scrub: true`), nodes se rozsvěcují postupně (`--accent-glow`
  na aktivním).
- U každého modelu monospace metadata: `StyleGAN2-ADA · 512×512` (velikosti souborů doplň
  jen pokud je znáš z `REDSME-2.md`, jinak vynech — **nevymýšlej čísla**).
- Asset `scheme-gan` (`scheme_3.png`) můžeš použít jako doplňkový vizuál pod diagramem,
  ale **hlavní diagram je custom SVG** — vložený screenshot nestačí.
- `aria-hidden="true"` na dekorativních částech SVG + textová alternativa v `.sr-only`.

### 2. Latent Space Navigator

**Nejdřív udělej toto:** otevři `.claude/context/context_images/GAN_output.png` a **zjisti,
jestli je to grid (sample sheet) nebo jediný snímek**. Podle toho vyber variantu níže a
**zapiš zjištění do `progress.md`**.

#### Cílové chování (koncept)

Uživatel pohybuje bodem v **2D latent space** (vizualizovaném jako 2D mapa / gradient field)
a v reálném čase se mění generovaný obrázek. Evokuje „nekonečnou variabilitu z jednoho modelu".
Pod navigátorem: `seed: <dynamická hodnota> → unique composite` v `--font-mono`.

#### Varianta A — `GAN_output.png` JE grid (preferovaná)

- Napiš build-time skript, který ho rozřeže na buňky → `public/images/latent/<r>-<c>.webp`.
  **Skript umísti do `scripts/slice-latent.mjs`** a přidej ho jako `npm run assets:latent`
  (do `package.json` **nezasahuj**, pokud tam A0 nenechal místo — v tom případě skript vytvoř
  a spuštění zdokumentuj v `progress.md`).
- Postav grid **N×N** (kolik buněk reálně vyjde, ideálně 4×4 nebo 5×5).
- Interakce: pozice kurzoru v ploše navigátoru → **bilineární interpolace mezi 4 nejbližšími
  snímky** gridu, realizovaná crossfade opacitami 4 překrytých `<img>`. Ne canvas pixel blending
  — opacity crossfade je levnější a hladší.
- Pod plochou 2D gradient mapa (canvas nebo CSS gradient) s markerem aktuální pozice
  (crosshair, viewfinder motiv) a mřížkou bodů gridu.

#### Varianta B — je to jediný snímek (degradace)

- Degraduj na **1D seed slider**: horizontální dráha, 4–6 stavů derivovaných z jednoho snímku
  (různé cropy / mírné transformace), crossfade mezi nimi.
- **Gradient mapa vizuálu zůstane** (je to canvas/CSS, ne asset) — jen navigace je jednoosá.
- Explicitně to zapiš do `progress.md` jako čekající na dodání 50–100 GAN výstupů.

V obou variantách: `seed` hodnota pod navigátorem se mění s pozicí (deterministicky odvozená
z souřadnic, ne `Math.random()`), formát `seed: 0x4F2A91 → unique composite`.

### 3. Compositing Deconstructor — **NEIMPLEMENTUJEŠ**

Importuj stub komponentu, kterou vlastní A6:

```astro
import CompositingDeck from './CompositingDeck.astro';
...
<CompositingDeck />
```

Zajisti jen, že má v layoutu **dost prostoru** (full-width blok, min-height ~70vh)
a je zasazená do toku sekce s nadpisem H3 `Compositing: five layers into one label`.
**Do souboru `CompositingDeck.astro` nesahej.**

### 4. Srovnávací tabulka Blender vs. GAN

Vizuální, ne nudná — **dva sloupce jako elegantní karty**, ne HTML tabulka s bordery
(nebo semanticky `<table>`, ale vizuálně jako karty):

| | Blender | GAN |
|---|---|---|
| Speed | ~seconds / frame | ~ms / frame |
| Input | CAD + physical setup | ~130 real photos |
| Control | Explicit (scene parameters) | Implicit (data distribution) |
| Output | Deterministic | Stochastic |

Karty: `--bg-surface`, `--border`, monospace hodnoty, hover `--border-hover` + jemný
`--accent-glow`. Blender karta chladnější tón, GAN karta s jemnou variací — pokračování
engineered vs. organic kontrastu.

---

## Technické constraints

- Markup + scoped CSS v `PipelineGAN.astro` a `LatentNavigator.astro`. JS **jen** v
  `src/scripts/latent-navigator.js` (`export default function init(root)`), zapojený přes
  `whenVisible`. Architecture diagram animuj ze stejného modulu (ScrollTrigger scrub).
- GSAP/ScrollTrigger z `lib/motion.js`, reveal přes `data-reveal`.
- Obrázky přes `Picture.astro` (A0); snímky latent gridu **preloaduj až při vstupu do viewportu**
  (přes `lazy-init.js`) a limituj celkovou váhu gridu na **< 600 KB**.
- Kurzor → interpolace: **lerpovaný** rAF loop (~0.12), zastavený mimo viewport.
- `isFinePointer()` false (touch) → navigátor ovládaný **dragem** po ploše (pointer events),
  ne hoverem.
- `prefersReducedMotion()` → navigátor je **statický grid** všech dostupných snímků (mozaika)
  s labely, plus jeden reprezentativní velký snímek. Žádný crossfade, žádný flow po spojnicích
  diagramu (nakresli je jako hotové).
- Přístupnost: plocha navigátoru `tabindex="0"`, `role="application"`, `aria-label`, ovládání
  arrow keys po gridu, aktuální pozice ohlášena v `aria-live="polite"`.
- Reprezentativní GAN snímky dostanou `data-inspectable data-label="Cls_Obj_Front_Side"
  data-confidence="93.15"` (A11 to použije).
- `latent-navigator.js` < 4 KB gzip.

## Akceptační kritéria

- [ ] V `progress.md` zapsáno, jestli `GAN_output.png` je grid, a která varianta se implementovala
- [ ] Architecture diagram je **custom inline SVG**, ne screenshot, a při scrollu jím „tečou" data
- [ ] Latent Navigator reaguje na kurzor/drag plynule, bez viditelného skákání mezi snímky
- [ ] `seed:` hodnota se mění deterministicky s pozicí
- [ ] Vizuální jazyk sekce je zřetelně **organic** proti engineered Blender sekci
- [ ] Srovnávací tabulka vypadá jako dvě karty, ne jako výchozí HTML tabulka
- [ ] `CompositingDeck` je importovaný a má v layoutu dost prostoru; soubor **nezměněn**
- [ ] Grid snímků se načítá lazy, celkem < 600 KB
- [ ] Klávesnicí: navigátor ovladatelný arrow keys, pozice ohlášena
- [ ] `prefers-reduced-motion`: statický grid + hotový diagram, plná informace, nulový pohyb
- [ ] 360 / 768 / 1440px ověřeno
- [ ] `git status` obsahuje jen tvoje 3 soubory + `progress.md`

## Co NEDĚLAT

- Nedělej z navigátoru jednoduchý seed slider, **pokud** je grid k dispozici (koncept slider
  explicitně zamítl a nahradil ho 2D navigátorem).
- Neimplementuj Compositing Deconstructor ani do něj nesahej — je to A6.
- Neimplementuj particle transition (A7).
- Nepoužívej Three.js/PixiJS ani žádnou novou závislost.
- Nevymýšlej si velikosti modelů, počty parametrů ani metriky — ber jen to, co je v `REDSME-2.md`.
- Žádné generic „neural network" vizuály s propojenými kruhy a vrstvami.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
