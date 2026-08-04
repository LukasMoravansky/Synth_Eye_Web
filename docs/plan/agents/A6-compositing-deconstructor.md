# A6 — Compositing Deconstructor

**Vlna 2 · paralelně · větev `feat/a6-compositing`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/CompositingDeck.astro`, `src/scripts/compositing-deck.js`
**Nesmíš editovat:** `PipelineGAN.astro` (patří A5 — už tvoji komponentu importuje), ani nic dalšího

---

## Cíl

**Wow moment #2 celého webu.** Technický showcase compositing pipeline Synth.Eye GAN:
uživatel může libovolnou vrstvu kompozice **„vytáhnout"** — chytit ji a posunout stranou —
a vidět, co je pod ní. Vrstvy se chovají jako fyzické karty naskládané na sobě.

Tvoje komponenta je vložená do GAN sekce (`PipelineGAN.astro`) pod nadpisem
`Compositing: five layers into one label`. Máš k dispozici full-width blok, ~70vh.

---

## Kontext

Synth.Eye GAN negeneruje finální snímek jedním průchodem. Skládá ho z výstupů tří StyleGAN2-ADA
modelů (`front.pkl`, `back.pkl`, `fingerprint.pkl`) přes compositing pipeline s alpha blendingem
a simulací přítlaku (pressure simulation u fingerprintů), a na konci vygeneruje YOLO anotace.
Tohle je právě ta část, kterou vizualizuješ — je to nejtechničtější kus celého webu a má působit
jako pohled „pod kapotu".

Technický kontext: `.claude/context/Claude_project/REDSME-2.md` — **přečti compositing část**,
aby labely vrstev odpovídaly realitě.

---

## Vrstvy (5, zdola nahoru)

| # | Vrstva | Monospace label |
|---|---|---|
| 0 | Zelené pozadí (camera background) | `layer_0 · camera_background · chroma green` |
| 1 | GAN-generated front side | `layer_1 · front.pkl → object` |
| 2 | GAN-generated fingerprint | `layer_2 · fingerprint.pkl → defect` |
| 3 | Alpha blending + pressure simulation | `layer_3 · alpha_blend + pressure_sim` |
| 4 | Final composite + YOLO label overlay | `layer_4 · composite + yolo_labels` |

Každá vrstva má label v `--font-mono` popisující **operaci**, ne jen jméno. Label je viditelný
u odtažené vrstvy, u vrstev ve stacku jen jako tenký „ušek" na hraně (jako záložka v kartotéce).

## Interakce

**Primární:** drag & drop. Uživatel chytí vrstvu (pointer down), posune ji stranou, uvolní —
vrstva se **spring animací vrátí do stacku**. Dokud ji drží, vidí, co je pod ní.

- **Parallax hloubka mezi vrstvami:** vrstvy ve stacku mají mírný offset (X/Y ~8–14px per vrstva)
  a jemný scale falloff (0.985^n), takže stack je vizuálně čitelný jako hloubka. Při pohybu myší
  nad celým deckem se offsety nepatrně mění (max ±6px) — dodá to prostorovost.
- **Spring physics na návratu:** GSAP `elastic.out(1, 0.6)` nebo custom spring, ~700ms.
  Ne lineární, ne pouhé `ease-out`.
- **Z-index management:** tažená vrstva je vždy nahoře (`--z` bump), po návratu se vrací
  na svoji pozici. Nesmí dojít k trvalému rozhození stacku po několika dragech.
- **Sekundární (doplňková, ne náhradní) interakce:** scroll přes sekci postupně „liftuje" vrstvy
  — ScrollTrigger `scrub`, vrstvy se rozestupují do vějíře a zase skládají. Uživatel ale může
  **kdykoli kteroukoli chytit** a prozkoumat samostatně; drag má přednost před scroll stavem
  (během dragu scroll-driven offset zamrzne).
- **Hover na vrstvě ve stacku:** vysune se o ~20px a rozsvítí se její label + `--border-hover`.

## Assety — degradovaný stav

5 separátních PNG vrstev **nemáme**. Viz [../assets.md](../assets.md) §2.3. Postav to takto:

- **Vrstva 0:** čistě **CSS** — zelené camera background (chroma green v tmavém laděním,
  `#1a3a1f` – `#245c2c` range, ne křiklavé `#00ff00`), s jemnou vinětací a grain.
- **Vrstvy 1 a 2:** cropy z `gan-output` assetu (`GAN_output.png`). Pokud je to grid,
  vezmi dvě různé buňky (přes `object-position` na `<img>`, žádný build skript nepotřebuješ).
  Vrstva 2 (fingerprint) dostane `mix-blend-mode: multiply` + masku, aby působila jako defekt
  na povrchu, ne jako druhý díl.
- **Vrstva 3:** **procedurální** — semi-transparentní SVG s radiálním gradientem
  a `mix-blend-mode: overlay`, plus tenké kontury naznačující tlakové pole
  (SVG `feTurbulence` s nízkou frekvencí). Reprezentuje alpha blend + pressure sim.
- **Vrstva 4:** vrstva 1 + **SVG bounding box overlay** s monospace labely
  (`Cls_Obj_Front_Side 93.15 %`, `Cls_Defect_Fingerprint 92.93 %`) — přesně jak by to udělal
  YOLO export.

Drag/z-index/spring fyzika je na assetech **nezávislá** → prvek je plně funkční i degradovaný.
Strukturu drž tak, aby výměna za reálné PNG byla jen změna `src` u vrstev 1–4.
Zapiš do `progress.md`, že sekce čeká na dodání 5 reálných vrstev.

---

## Technické constraints

- Markup + scoped CSS v `CompositingDeck.astro`; JS v `src/scripts/compositing-deck.js`
  (`export default function init(root)`), zapojení přes `whenVisible` z `lib/lazy-init.js`.
- **Pointer Events API** (`pointerdown`/`pointermove`/`pointerup` + `setPointerCapture`) —
  jedna implementace pro mouse i touch. Ne separátní mouse/touch handlery.
- `touch-action: none` **jen na vrstvách**, nikdy na celé sekci — jinak rozbiješ scroll stránky.
- GSAP z `lib/motion.js`. Transformace **jen** `transform` a `opacity` (GPU), nikdy `top/left`.
- Jediný rAF loop pro parallax, zastavený mimo viewport.
- `compositing-deck.js` < 4 KB gzip.
- `prefersReducedMotion()` → **statická „exploded view"**: všech 5 vrstev rozložených ve vějíři
  (nebo pod sebou) s labely, plně čitelných, bez dragu a bez spring animací. Drag může zůstat
  funkční, ale bez pružiny (okamžitý návrat).
- **Touch degradace:** drag funguje (Pointer Events), ale scroll-driven lift na touch **vypni**
  (kolize se scrollem). Přidej alternativu: **tap na vrstvu** ji vysune / zasune.
- Přístupnost:
  - každá vrstva je `<button>` nebo má `tabindex="0"` + `role="button"` s `aria-label`
    obsahujícím label vrstvy
  - **arrow keys** posouvají zaostřenou vrstvu, `Escape` ji vrátí do stacku, `Enter`/`Space`
    ji vysune/zasune
  - `aria-live="polite"` hlásí, která vrstva je odtažená
  - textový seznam všech 5 vrstev a jejich operací v `.sr-only` (informace nesmí být jen v dragu)

## Akceptační kritéria

- [ ] 5 vrstev, správné pořadí, každá s monospace labelem popisujícím operaci
- [ ] Drag: vrstvu lze chytit myší i prstem, posunout, a po uvolnění se **spring** animací vrátí
- [ ] Odtažená vrstva odhalí, co je pod ní; z-index je vždy konzistentní
- [ ] Po 10+ dragech v různém pořadí je stack stále správně složený
- [ ] Stack je vizuálně čitelný jako hloubka (offsety + scale falloff + parallax)
- [ ] Scroll přes sekci vrstvy postupně liftuje; drag během toho má přednost a nekoliduje
- [ ] Drag na vrstvě **nescrolluje** stránku; scroll mimo vrstvy funguje normálně
- [ ] Klávesnicí: vrstvy zaostřitelné, arrow keys posouvají, Escape vrací, stav ohlášen
- [ ] `prefers-reduced-motion`: statická exploded view, všech 5 vrstev čitelných
- [ ] Vrstva 4 obsahuje YOLO bounding box overlay s reálnými confidence hodnotami
- [ ] 360 / 768 / 1440px ověřeno; na mobilu tap-to-lift funguje
- [ ] `compositing-deck.js` < 4 KB gzip, rAF loop zastaven mimo viewport
- [ ] `git status` obsahuje jen `CompositingDeck.astro`, `compositing-deck.js`, `progress.md`

## Co NEDĚLAT

- **Nepředělávej to na scroll-driven layer reveal** — koncept ten původní návrh zamítl,
  scroll lift je jen doplňková interakce, drag je primární.
- Nepoužij drag&drop knihovnu (interact.js, Draggable z GSAP clubu, dnd-kit) — vanilla
  Pointer Events. GSAP `Draggable` je club plugin → **není k dispozici**.
- Nedávej `touch-action: none` na sekci nebo `body`.
- Neanimuj `top`/`left`/`width` — jen `transform`/`opacity`.
- Nepoužij křiklavou zelenou `#00ff00` pro camera background — musí sedět do tmavého tématu.
- Nesahej na `PipelineGAN.astro`, `index.astro`, `tokens.css`, `global.css`.
