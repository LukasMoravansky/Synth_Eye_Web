# Synth.Eye Web — Multiagentní development plán v1

> Tento dokument je vstupní bod pro **Cursor agenty**. Než napíšeš první řádek kódu,
> přečti **tento soubor**, potom [CONTRACT.md](CONTRACT.md), a potom **jen svůj vlastní**
> soubor v [agents/](agents/). Nečti cizí agent soubory — obsahují detaily, které tě jen zmatou.

---

## Co stavíme

Jednorázový prezentační web pro **Synth.Eye** — platformu pro syntetická data pro průmyslovou
vizuální inspekci (Blender rendering → StyleGAN2-ADA → PyQt5 inspekční GUI). Cílová skupina:
investoři, průmysloví inženýři, výzkumníci. Open source (MIT), vyvíjeno v JIC.

**Single page**, 8 sekcí, 11 interaktivních prvků, tmavé téma, fialový accent.
Stack: **Astro** (statický, zero-JS default) + **vanilla JS** + **GSAP/ScrollTrigger** + **Lenis**.
Žádný React/Vue/Svelte, žádný Tailwind, žádná charting knihovna. JS budget **< 50 KB gzip**.

Zdroje pravdy (číst odsud, ne z paměti):
- `.claude/context/Claude_project/Synth-eye-web-concept-v2.md` — narativ, sekce, design tokeny
- `.claude/context/Claude_project/Tech-stack.md` — stack a odůvodnění
- `.claude/context/Synth.Eye - html/synth_eye_gui_template.html` — referenční mockup reálného GUI
- `.claude/context/context_images/` — reálné assety

---

## Model spolupráce

14 agentů, 5 vln. **Uvnitř vlny běží agenti paralelně** a nikdy nesahají na stejný soubor —
vlastnictví souborů je exkluzivní a vynucené v [CONTRACT.md](CONTRACT.md).

```
VLNA 0  (sekvenčně, 1 agent — blokuje všechny ostatní)
  A0  Foundation: scaffold, tokeny, fonty, Base layout, stuby VŠECH komponent, shared utils

VLNA 1  (paralelně, 4 agenti — vysoké riziko / vysoký vizuální dopad)
  A1  Hero — Inspection Chamber
  A2  GUI Demo — signature moment, nejvíc kódu
  A3  The Data Gap — 3 bloky problému
  A4  Blender pipeline + Defect Revealer

VLNA 2  (paralelně, 4 agenti)
  A5  GAN pipeline + Latent Space Navigator
  A6  Compositing Deconstructor
  A7  Particle Field Transformation
  A8  Measurement + tolerance gauges

VLNA 3  (paralelně, 3 agenti — potřebují stabilní layout)
  A9   Results — metriky + evidence grid
  A10  Open Source bento grid + Footer
  A11  Inspection Cursor (průřezový)

VLNA 4  (sekvenčně, 2 agenti — jediní, kdo smí editovat cizí soubory)
  A12  Responsive + performance + a11y audit
  A13  SEO, OG image, Vercel deploy
```

Paralelní běh **v rámci vlny** je bezpečný, protože A0 předem vytvoří všechny soubory jako stuby
a zapojí je do `index.astro`. Žádný agent z vln 1–3 nikdy nemodifikuje `index.astro`,
`tokens.css`, `global.css`, `Base.astro` ani cizí komponentu.

### Vstup do vlny

Vlna začíná, až když **všechny** úkoly předchozí vlny mají v [progress.md](progress.md)
status `DONE` a build (`npm run build`) prochází bez chyb. Integrace a merge je práce
člověka / projektového managera, ne agentů.

---

## Roster agentů

| ID | Úkol | Vlna | Vlastní soubory | Prompt |
|---|---|---|---|---|
| A0 | Foundation & scaffold | 0 | scaffold, `tokens.css`, `global.css`, `fonts.css` (dnes `data/fonts.js`), `Base.astro`, `Nav.astro`, `index.astro`, `scroll-setup.js`, `scripts/lib/*`, asset pipeline | [A0](agents/A0-foundation.md) |
| A1 | Hero — Inspection Chamber | 1 | `Hero.astro`, `hero-chamber.js` | [A1](agents/A1-hero.md) |
| A2 | GUI Demo | 1 | `GuiDemo.astro`, `gui-demo.js`, `data/gui-demo-frames.js` | [A2](agents/A2-gui-demo.md) |
| A3 | The Data Gap | 1 | `DataGap.astro`, `data-gap.js` | [A3](agents/A3-data-gap.md) |
| A4 | Blender pipeline + Defect Revealer | 1 | `PipelineBlender.astro`, `defect-revealer.js` | [A4](agents/A4-blender-defect-revealer.md) |
| A5 | GAN pipeline + Latent Navigator | 2 | `PipelineGAN.astro`, `LatentNavigator.astro`, `latent-navigator.js` | [A5](agents/A5-gan-latent-navigator.md) |
| A6 | Compositing Deconstructor | 2 | `CompositingDeck.astro`, `compositing-deck.js` | [A6](agents/A6-compositing-deconstructor.md) |
| A7 | Particle Field Transformation | 2 | `PipelineTransition.astro`, `particle-transition.js` | [A7](agents/A7-particle-transition.md) |
| A8 | Measurement + gauges | 2 | `Measurement.astro`, `measurement-gauges.js` | [A8](agents/A8-measurement.md) |
| A9 | Results | 3 | `Results.astro`, `results.js` | [A9](agents/A9-results.md) |
| A10 | Open Source + Footer | 3 | `OpenSource.astro`, `Footer.astro` | [A10](agents/A10-opensource-footer.md) |
| A11 | Inspection Cursor | 3 | `inspection-cursor.js`, `styles/cursor.css` | [A11](agents/A11-inspection-cursor.md) |
| A12 | Responsive / perf / a11y | 4 | vše (audit pass) | [A12](agents/A12-responsive-perf-a11y.md) |
| A13 | SEO / OG / deploy | 4 | `Base.astro` (meta), `vercel.json`, `public/og-image.png`, `robots.txt` | [A13](agents/A13-seo-deploy.md) |

---

## Jak agenta spustit (Cursor)

1. Otevři nový Cursor agent (Composer / Agent mode) v rootu repozitáře.
2. Vlož jako první zprávu:
   ```
   Přečti docs/plan/README.md a docs/plan/CONTRACT.md, potom docs/plan/agents/<TVŮJ-SOUBOR>.md
   a implementuj přesně to, co je v tvém souboru. Nesahej na soubory, které nevlastníš.
   ```
3. Po dokončení agent aktualizuje **jen svůj řádek** v [progress.md](progress.md).

---

## Dokumenty plánu

- [CONTRACT.md](CONTRACT.md) — **povinné pro každého agenta**: tokeny, vlastnictví souborů, konvence, akceptační pravidla
- [assets.md](assets.md) — inventura assetů, chybějící sady, degradované varianty
- [progress.md](progress.md) — živý board: Backlog / In progress / Done / Rozhodnutí
