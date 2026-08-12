# A4 — Blender Pipeline + Defect Revealer

**Vlna 1 · paralelně · větev `feat/a4-blender`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/PipelineBlender.astro`, `src/scripts/defect-revealer.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

První polovina Aktu II: **fyzikální simulace**. Ukázat, že Synth.Eye virtualizuje celou
inspekční komoru — kameru, objektiv, osvětlení, materiály — a fyzikální renderování v Blenderu
vytváří snímky nerozlišitelné od reality.

A uvnitř **wow moment #1 celého webu: Defect Revealer.**

Heading sekce: **First principles: physical simulation**

---

## Kontext a narativní framing

Web vypráví příběh dvou generací řešení. Tato sekce je „Blender říká: *Vím přesně, jak realita
vypadá, a zrekonstruuji ji od nuly.*" — first principles, fyzikální zákony, optika, materiály.
Druhá generace (GAN, statistical learning) přijde později a implementuje ji jiný agent.

**Vizuální jazyk této sekce je „engineered":** schémata hardwaru, wireframy, fyzikální diagramy,
technická přesnost, chladnější tóny. (Kontrast: GAN sekce bude „organic".)

Zdroj technického kontextu: `.claude/context/Claude_project/README-1.md` (Synth.Eye Blender
pipeline — PBR rendering, procedurální defekty). Přečti si ho pro věcnou správnost textů.

---

## Layout

**Asymetrický split, ne 50/50:**
- **Levá strana (~45 %):** schéma virtualizace HW — asset `scheme-hw` (`scheme_1.png`),
  **přestylované pro web**: nesmí to vypadat jako vložený screenshot z prezentace.
  Zasaď ho do rámce s `.viewfinder` závorkami (utility od A0), pozadí `--bg-elevated`,
  jemný `--border`, a k jednotlivým částem schématu přidej **monospace anotace** v `--text-muted`
  s tenkými vodicími linkami (`--border-hover`):
  ```
  camera      Basler a2A1920-51gcPRO
  lens        16 mm  ·  f/4.0
  lighting    diffuse dome  +  directional
  material    PBR  ·  brushed aluminium
  renderer    Cycles  ·  512 samples
  ```
  Anotace se odhalují staggered při scroll revealu.
- **Pravá strana (~55 %):** výstup — `pbr-render` (PBR render vs. raw geometry).
  Pod ním klíčová zpráva jako blockquote / lead text:

  > We virtualize the entire inspection chamber — camera, lens, lighting, materials.
  > Physical rendering in Blender produces images indistinguishable from reality.

- Volitelně sekundární schéma `scheme-pipeline` (`scheme_2.png`) jako menší vizuál v toku sekce,
  pokud kompozice nezhoustne. Pokud ano, vynech ho a zapiš to do `progress.md`.

---

## Interaktivní prvek — DEFECT REVEALER (wow moment #1)

**Pozor:** koncept **explicitně odmítl** klasický before/after split slider jako generický prvek.
Neimplementuj slider.

### Chování

- Uživatel vidí **čistý kovový díl**.
- Při pohybu kurzoru nad dílem se **v kruhovém radiusu kolem kurzoru odhalují defekty pod
  povrchem** — fingerprint residue, olejové skvrny, stopy obrábění.
- Metafora: **UV lampa na forenzní analýze.** „Defekty jsou všude, jen je nevidíte — dokud
  nemáte správný nástroj."

### Implementace

Dvě překrývající se vrstvy:
- spodní: **defected** varianta
- horní: **clean** varianta s `clip-path: circle(<r> at <x> <y>)` invertovanou maskou
  (nebo `mask-image: radial-gradient(...)` na spodní vrstvě — vyber to, co dá **měkčí falloff**;
  ostrý kruh vypadá levně)

Detaily, které rozhodují o kvalitě efektu:
- radius ~160–200px, měkký falloff (10–15 % šířky přechodu)
- kurzor sleduj **lerpovaně** (~0.15), ne 1:1 — dodá to hmotnost
- kolem reveal kruhu tenký kruhový obrys v `--accent` s nízkou opacity + crosshair marker
  ve středu (viewfinder motiv)
- lehké `backdrop-filter: brightness(1.1) saturate(0.85)` v reveal oblasti = „UV světlo"
- při vstupu kurzoru na díl radius plynule naroste z 0, při odchodu se stáhne (GSAP tween)
- **jediný `requestAnimationFrame` loop**, pozastavený mimo viewport (`lazy-init.js` `onExit`)

Pod Defect Revealerem caption:
> Can you spot the defect? The AI can. Every time.

### Assety — degradovaný stav

Párové snímky (stejný díl, stejný úhel, clean vs. defected) **nemáme**. Viz
[../assets.md](../assets.md) §2.1.

Implementuj takto:
- `part-front` jako **clean** vrstvu
- **defected** vrstvu vytvoř jako procedurální overlay nad kopií clean snímku: fingerprint
  residue jako radiální noise mask (SVG `feTurbulence`, `--nok` tint, opacity 0.25–0.4),
  olejové skvrny jako 2–3 blurované elipsy s `mix-blend-mode: overlay`, stopy obrábění
  jako tenké směrové linky s nízkou opacity
- Drž defected vrstvu jako **samostatný element s vlastní `src`/overlay strukturou**, aby
  výměna za reálný snímek byla změna jednoho atributu
- Zapiš do `progress.md`, že sekce čeká na dodání párových snímků

---

## Technické constraints

- Markup + scoped CSS v `PipelineBlender.astro`; JS v `src/scripts/defect-revealer.js`
  (`export default function init(root)`), zapojení přes `whenVisible` z `lib/lazy-init.js`.
- GSAP/ScrollTrigger importuj z `lib/motion.js`. Reveal animace textu přes `data-reveal`
  (`lib/reveal.js`), nepiš vlastní observer.
- Obrázky přes `Picture.astro` (A0), `loading="lazy"`.
- `isFinePointer()` false (touch) → **tap-to-inspect**: tap na díl umístí reveal kruh na dané
  místo a nechá ho tam (s krátkou animací příchodu); drag prstem ho posouvá. Žádné continuous
  tracking.
- `prefersReducedMotion()` → **statická varianta:** clean snímek a defected snímek vedle sebe
  (nebo defected s trvale odhaleným kruhem uprostřed) s labely `clean` / `defect: fingerprint`.
  Žádný pohyb, ale informace zůstává plně přítomná.
- Přístupnost: kontejner revealeru dostane `tabindex="0"` a `aria-label` popisující, co ukazuje;
  po fokusu se dá reveal kruh posouvat **arrow keys**. Textová alternativa v `.sr-only`.
- Díl dostane `data-inspectable data-label="Cls_Defect_Fingerprint" data-confidence="92.93"`
  — inspection cursor implementuje A11, ty jen atributy.
- JS pod **4 KB gzip**.

## Akceptační kritéria

- [ ] Sekce má asymetrický layout, schéma je **přestylované**, ne vložený raw screenshot
- [ ] Monospace anotace u schématu se odhalují staggered a mají vodicí linky
- [ ] Defect Revealer: pohyb kurzoru odhaluje defekty v měkkém kruhu, s viditelným tlumením
- [ ] Kruh má obrys v `--accent` + crosshair; při vstupu/odchodu kurzoru plynule roste/mizí
- [ ] **Není** to before/after split slider
- [ ] Caption „Can you spot the defect?…" je pod prvkem
- [ ] Na touch: tap-to-inspect funguje, žádné continuous tracking
- [ ] Klávesnicí: element lze zaostřit a reveal posouvat arrow keys
- [ ] `prefers-reduced-motion`: statická varianta ukazuje clean i defect stav, nulový pohyb
- [ ] 360 / 768 / 1440px ověřeno, žádný horizontální scroll
- [ ] `defect-revealer.js` < 4 KB gzip, rAF loop se zastaví mimo viewport
- [ ] `git status` obsahuje jen `PipelineBlender.astro`, `defect-revealer.js`, `progress.md`

## Co NEDĚLAT

- **Neimplementuj before/after split slider** — koncept ho explicitně zamítl.
- Nevkládej `scheme_1.png` jako neupravený obrázek na světlém pozadí — musí sedět do dark theme.
- Neimplementuj particle transition (to je A7) ani GAN obsah (A5/A6).
- Nepoužij Canvas — clip-path/mask řešení je lehčí a přístupnější.
- Žádný ostrý kruhový cut bez falloffu.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
