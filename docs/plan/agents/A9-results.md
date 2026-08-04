# A9 — Results (metriky + evidence grid)

**Vlna 3 · paralelně · větev `feat/a9-results`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/Results.astro`, `src/scripts/results.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

**Credibility moment.** Sekce, kde web dokazuje, že to funguje. Dominují velká čísla a vizuální
důkaz. Cílovka: investor, který chce jedno číslo, a inženýr, který chce vidět snímky.

Heading: **Trained on synthetic. Proven on real.**

---

## Layout

Full-bleed dark sekce (`var(--bg-deep)` — tmavší než okolní sekce, aby vizuálně „dosedla").
Dominují velká čísla.

### Tři velké metriky (scroll-triggered animated counters)

```
>99%                     >95%                     6,000
object classification    defect detection         synthetic images
on real images           on real images           zero manual labels
```

- `var(--font-mono)`, tabular-nums, `clamp(3rem, 8vw, 7rem)`, weight 500
- Použij `animateCounter` / `initCounters` z `src/scripts/lib/counter.js` (A0) —
  **nepiš vlastní counter**
- `>` prefix je statický, animuje se jen číslo (`99`, `95`, `6000` s thousands separatorem)
- Easing: rychlý start, pomalý dojezd (`--ease-out`). Stagger ~150ms mezi metrikami.
- Pod každým číslem dvouřádkový context label: první řádek `--text-secondary`,
  druhý `--text-muted`, 12–13px, uppercase, tracking 0.08em
- **Asymetrie:** nedělej tři identické centrované sloupce. Např. mírně odlišné vertikální
  offsety nebo první metrika větší (je to hlavní číslo webu).

### Evidence Grid

**Ne akademická tabulka — „evidence wall" vibe.** Vizuální důkaz, že synteticky trénovaný model
funguje na reálných datech.

Layout: **dvě řady**
- Horní: label `SYNTHETIC (train)` — generované snímky
- Spodní: label `REAL (test)` — reálné snímky **s overlayed predictions**

Každá dlaždice:
- snímek dílu
- **SVG bounding box overlay** s monospace labelem a confidence score
  (`Cls_Obj_Front_Side 93.15 %`, `Cls_Defect_Fingerprint 92.93 %`)
- verdict badge `OK` / `NOK` v `--ok` / `--nok`
- `.viewfinder` rohové závorky (utility od A0)
- `data-inspectable` s labelem a confidence

Řady mají v labelu monospace prefix a tenkou linku přes celou šířku
(`SYNTHETIC (train) ─────────`).

Doplňkový text pod gridem:
> Trained entirely on synthetic data. Tested on real production images from the factory floor.
> No real images were labeled during training.

### Assety

Dostupné: `gan-output` (syntetické — pokud je to grid, použij různé buňky přes `object-position`),
`part-front`, `measure-front`, `measure-back`, `pbr-render` (reálné/renderované).

Cíl: **3–4 dlaždice v každé řadě**. Pokud nemáš dost různých snímků, udělej **3+3** a do
`progress.md` zapiš požadavek na dodání dalších párů synthetic/real. **Nepoužívej dvakrát
identický snímek ve stejné řadě** — okamžitě to prozradí, že je to placeholder. Radši méně dlaždic.

Viz [../assets.md](../assets.md).

---

## Technické constraints

- Markup + scoped CSS v `Results.astro`; JS v `src/scripts/results.js`
  (`export default function init(root)`), zapojení přes `whenVisible`.
- Countery obsluhuje `lib/counter.js` — tvůj `results.js` řeší jen reveal gridu (staggered
  fade-in dlaždic) a případné hover chování boxů. Pokud nakonec nepotřebuje nic navíc,
  **soubor nevytvářej** a vystač si s `data-reveal` + `data-counter` (zero JS je lepší výsledek
  než prázdný modul) — zapiš to do `progress.md`.
- Bounding boxy jako inline SVG s normalizovanými souřadnicemi (viewBox 0 0 100 100 + procenta),
  aby držely pozici při resize.
- Obrázky přes `Picture.astro`, `loading="lazy"`.
- `prefersReducedMotion()` → countery na cílových hodnotách, dlaždice okamžitě viditelné.
- Přístupnost: metriky jako `<dl>` (`<dt>` číslo, `<dd>` label) nebo `<figure>`/`<figcaption>`;
  čísla musí být čitelná screen readerem i před animací (`aria-label` s finální hodnotou na
  wrapperu, nebo `data-counter` s inicializační hodnotou = cílová a JS ji jen animuje odspodu).
  **Nikdy nenech screen reader přečíst `0`.**
- Verdict OK/NOK **nesmí být rozlišený jen barvou** — text `OK` / `NOK` je součástí badge.
- Responsive: metriky pod 768px pod sebou (nebo 1 velká + 2 menší). Evidence grid:
  desktop 4 kolony, tablet 2, mobil 1–2 (dlaždice musí zůstat čitelné s bounding boxy —
  pod 480px raději 1 kolona než nečitelné miniatury).

## Akceptační kritéria

- [ ] Tři metriky se napočítají se staggerem, tabular-nums (čísla neposkakují)
- [ ] Kompozice metrik **není** tři identické centrované sloupce
- [ ] Evidence grid má dvě jasně labelované řady: SYNTHETIC (train) / REAL (test)
- [ ] Každá dlaždice má bounding box overlay s monospace labelem a confidence
- [ ] Žádný snímek se v jedné řadě neopakuje
- [ ] Verdict OK/NOK čitelný bez barvy
- [ ] Doplňkový text pod gridem je přítomen v uvedeném znění
- [ ] Screen reader přečte finální hodnoty metrik, ne nuly
- [ ] Bounding boxy drží pozici při změně šířky okna
- [ ] `prefers-reduced-motion`: vše v cílovém stavu, nulový pohyb
- [ ] 360 / 768 / 1440px ověřeno
- [ ] `git status` obsahuje jen `Results.astro` (+ případně `results.js`) a `progress.md`

## Co NEDĚLAT

- Nedělej z evidence gridu akademickou tabulku s bordery.
- Nepiš vlastní counter — je v `lib/counter.js`.
- Nepoužij stejný snímek dvakrát v jedné řadě.
- Nevymýšlej si metriky ani confidence hodnoty — používej ty z projektu
  (>99 %, >95 %, 6 000, 93.15 %, 92.93 %, 99.86 %).
- Nedávej `border-radius: 8px` na všechny dlaždice.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
