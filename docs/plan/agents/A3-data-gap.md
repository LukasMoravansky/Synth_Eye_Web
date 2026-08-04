# A3 — Sekce „The Data Gap"

**Vlna 1 · paralelně · větev `feat/a3-data-gap`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/DataGap.astro`, `src/scripts/data-gap.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

Vybudovat **napětí, než ukážeme řešení**. Tato sekce odpovídá na „proč to vůbec někdo dělá?"
Tři bloky problému, každý s vlastním vizuálním treatmentem a vlastním interaktivním momentem.

Heading sekce: **The data gap**

---

## Kontext

Synth.Eye generuje syntetická data pro trénink AI modelů průmyslové vizuální inspekce.
Problém, který řeší: v kvalitní výrobě jsou reálné defekty vzácné, jejich záměrná výroba je
drahá a neškálovatelná, a ruční anotace snímků je bottleneck. Cílová skupina sekce: průmyslový
inženýr, který ten problém zná, a investor, který ho zná ještě nezná.

**Layout sekce: editorial styl, NE generic „text vlevo, obrázek vpravo" u všech tří bloků.**
Každý blok má jinou kompozici — asymetrie je záměr. Velkorysý whitespace mezi bloky
(`--space-11` / `--space-12`).

---

## Blok 1 — „Real defects are rare"

**Copy (EN, použij tuto formulaci):**
> In quality manufacturing, defects occur in single-digit percentages. To train an AI model
> to detect a fingerprint on a metal part, you need hundreds to thousands of defective samples.
> Producing them on purpose is expensive and does not scale.

**Vizuál:** dva díly vedle sebe — **clean** a **defected**. Pod nimi se **scrollem vyplňuje
poměrový bar**: `1 defect : 130 clean parts`.
- Bar se plní zleva v `var(--ok)` (scroll-scrubbed přes ScrollTrigger `scrub: true`)
- Teprve **na samém konci** zablikne jediný červený pixel/segment v `var(--nok)` s krátkým
  glow pulzem — vizuální zdůraznění nepoměru
- Nad barem monospace label `1 : 130`, pod ním `defect : clean parts` v `--text-muted`
- Bar je tenký (4–6px), široký (min 60 % šířky bloku), ostré hrany

**Assety:** `part-front` jako clean. Defected variantu vytvoř jako **SVG/CSS overlay**
(fingerprint residue = radiální noise mask v `--nok` odstínu s nízkou opacity) — párové snímky
nemáme, viz [../assets.md](../assets.md) §2.1. Overlay drž v samostatném elementu, aby se dal
později nahradit reálným obrázkem záměnou `src`.

---

## Blok 2 — „The product may not exist yet"

**Copy:**
> What if you want the inspection system ready before production even starts? Before the first
> batch? For a part that exists only as a CAD model?

**Vizuál:** **CAD wireframe → fotorealistický render**, scroll-driven transformace.
- Vrstvy se postupně „nanášejí" na geometrii: wireframe → base geometry → textury → osvětlení
- Scroll řídí **fázi** transformace (ScrollTrigger `scrub`, pinning **nepoužívej** — jen scrub
  přes výšku bloku)
- Implementace: `pbr-render` (finální render) jako spodní vrstva + nad ní **SVG/CSS wireframe
  vrstva** (kterou vytvoříš proceduálně: mřížka + obrysové linky v `--accent` s `stroke-dasharray`),
  která se s progressem odmaskovává (`clip-path` shora dolů nebo `opacity` + `filter`)
- Fázové labely vedle vizuálu v monospace, aktivní fáze v `--accent`:
  ```
  01  CAD geometry
  02  Material assignment
  03  PBR textures
  04  Physical lighting
  05  Rendered frame
  ```
- Cílený parallax **jen na těchto vrstvách**, nikde jinde

---

## Blok 3 — „Manual annotation is the bottleneck"

**Copy:**
> Every image needs a bounding box, a label, a quality check. That is hours of manual work.
> Synth.Eye generates the data and the annotations automatically.

**Vizuál:** tři animovaná čísla vedle sebe, scroll-triggered:

```
6,000            0                 < 1 hr
images       manual labels    generation time
```

- Použij `animateCounter` / `initCounters` z `src/scripts/lib/counter.js` (A0) —
  **nepiš vlastní counter**
- `var(--font-mono)`, tabular-nums, velká čísla (`clamp(2.5rem, 6vw, 5rem)`)
- **Prostřední nula zůstane vizuálně největší a nejvýraznější** — je to hlavní pointa sekce
  (`--accent` nebo výrazně větší size, s `--accent-glow` pozadím). Nula se **nenapočítává**
  (počítat od 0 do 0 nemá smysl) — místo toho se objeví s krátkým scale/glow pulzem.
- Labely pod čísly v `--text-muted`, 12–13px, uppercase, tracking 0.08em
- `< 1 hr` není číselný counter — objeví se s reveal animací

Volitelně: v pozadí bloku 3 velmi jemně (`opacity: 0.06`) použij `industry` asset jako
industriální kontext, s `--bg-primary` overlayem. Jen pokud to nezhorší čitelnost.

---

## Technické constraints

- Markup + scoped CSS v `DataGap.astro`, veškerý JS v `src/scripts/data-gap.js`
  (`export default function init(root)`), zapojený přes `whenVisible` z `lib/lazy-init.js`.
- ScrollTrigger importuj z `lib/motion.js`. Pro bar a wireframe použij `scrub: true`;
  pro countery nech práci na `lib/counter.js`.
- **Žádný pinning sekcí** v této sekci — informační bloky musí scrollovat přirozeně.
- Reveal animace textových bloků: použij `data-reveal` atributy, které obsluhuje `lib/reveal.js` (A0)
  — nepiš vlastní IntersectionObserver.
- `prefers-reduced-motion`: bar je vyplněný ve finálním stavu, wireframe transformace ukazuje
  **finální render** (žádný prázdný stav), countery na cílových hodnotách, žádný parallax.
- Responsive: pod 768px bloky stacked, tři countery pod sebou (nebo 1+2 grid),
  wireframe transformace se **degraduje na 2 statické snímky vedle sebe s labelem** —
  scroll-scrubbed vrstvení nefunguje dobře na krátkém mobilním viewportu.
- Obrázky přes `Picture.astro` (A0), `loading="lazy"`, `data-inspectable` na obou dílech
  v bloku 1 (`label="Cls_Obj_Front_Side" confidence={99.15}` na clean,
  `label="Cls_Defect_Fingerprint" confidence={92.93}` na defected).

## Akceptační kritéria

- [ ] Tři bloky, každý s **vizuálně odlišnou** kompozicí (žádné 3× stejné „text | obrázek")
- [ ] Blok 1: bar se plní se scrollem, červený segment zablikne až na konci
- [ ] Blok 2: scroll plynule mění fázi wireframe → render, fázové labely se přepínají
- [ ] Blok 3: 6,000 se napočítá, `0` je vizuálně dominantní a nepočítá se, `< 1 hr` se odhalí
- [ ] Whitespace mezi bloky je velkorysý, sekce nepůsobí stlačeně
- [ ] Veškerý text je v angličtině
- [ ] 360 / 768 / 1440px ověřeno, žádný horizontální scroll
- [ ] `prefers-reduced-motion` — vše čitelné a v cílovém stavu, nulový pohyb
- [ ] `git status` obsahuje jen `DataGap.astro`, `data-gap.js`, `progress.md`

## Co NEDĚLAT

- Nepoužij stock fotky ani ilustrace „průmyslu" zvenčí — jen assety z projektu.
- Žádné generic „AI brain / data flow" vizuály.
- Nepiš vlastní counter, reveal, ani IntersectionObserver — utility jsou v `lib/`.
- Nepinuj sekci, nedělej plošný parallax.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
- Neimplementuj inspection cursor (A11) — jen `data-inspectable` atributy.
