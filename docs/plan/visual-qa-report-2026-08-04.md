# Visual QA Report — 2026-08-04

Orchestrátor pass po vlnách 0–4. **Build OK.** Dev server: `http://localhost:4321`.

Subagenti: [visual-debugger](210bdc63-934b-4fa3-943f-e634c1aeb389) · [animation-debugger](cab11e16-a68c-4e76-a5b6-ad396a5bfe39) · [cross-browser-tester](14b5eea3-f27c-4de7-8e75-b4263c8f5c50) · [accessibility-auditor](adb2155c-acd4-4913-895a-b00037f1917c) · [performance-auditor](63b9edca-f0c2-4fdb-89e1-ac99824c18fa)

---

## Executive summary

| Severity | Počet (deduplikováno) |
|----------|----------------------|
| **P0** | 7 |
| **P1** | ~28 |
| **P2** | ~23 |

**Kritické sekce:** GuiDemo (768–1024px grid), scroll infra (ST refresh, Lenis CTA), Latent Navigator (double init), Measurement (CLS), a11y bypass (skip link, inspectable focus).

**Console:** 0 errors při normálním scroll passu. `markers: true` = 0.

---

## P0 — Blocker

| ID | Sekce | Popis | Agent | Soubor |
|----|-------|-------|-------|--------|
| QA-001 | GuiDemo | Grid neresetuje row/col na tablet → překryvy | V-001 | `GuiDemo.astro` |
| QA-002 | Global | Chybí `ScrollTrigger.refresh()` po lazy-init | A-001 | `lazy-init.js` |
| QA-003 | Hero | CTA: `__lenis` jen DEV → produkční desync | A-002 | `scroll-setup.js`, `hero-chamber.js` |
| QA-004 | PipelineGAN | Dvojitá init `latent-navigator.js` | A-003, P-010 | `PipelineGAN.astro`, `LatentNavigator.astro` |
| QA-005 | Global | Chybí skip link, `<main>` bez id | Y-001 | `Base.astro`, `index.astro` |
| QA-006 | Cross-cutting | `[data-inspectable]` bez `tabindex` | Y-002 | `Picture.astro`, `GuiDemo.astro` |
| QA-007 | Defect Revealer | `outline: none` bez `:focus-visible` | Y-003, V-020 | `PipelineBlender.astro` |

---

## P1 — Top regrese (výběr)

| ID | Popis | Agent | Soubor |
|----|-------|-------|--------|
| QA-008 | CompositingDeck stage overflow | V-002 | `CompositingDeck.astro` |
| QA-009 | `#fff` flash v dark theme | V-003 | `GuiDemo.astro` |
| QA-012 | Hardcoded rgba mimo tokeny | V-005–V-013 | Nav, Hero, DataGap, … |
| QA-014 | CSS sticky + ST pin konflikt | A-005 | `PipelineTransition.astro` |
| ~~QA-015~~ | ~~Latent Navigator permanentní RAF~~ — **FIXED** (2026-08-04): RAF se zastaví po dojezdu, IntersectionObserver pauzuje mimo viewport, attract mode končí po jednom kole | A-006, X-005 | `latent-navigator.js` |
| QA-019 | Hero CTA smooth scroll při reduced-motion | Y-005 | `hero-chamber.js` |
| QA-024 | Nav `-webkit-backdrop-filter` chybí | X-001 | `Nav.astro` |
| QA-025 | Lenis na touch bez degradace | X-003 | `scroll-setup.js` |
| QA-028 | JS budget ~52 KB gzip (cíl 50 KB) | P-001 | `motion.js` |
| QA-029 | LCP preload + sizes overfetch | P-003, P-004 | `Base.astro`, `Picture.astro` |
| QA-030 | Measurement `hidden` ignorován → CLS | P-009 | `Measurement.astro`, `Picture.astro` |

Plné seznamy: viz výstupy subagentů (ID prefixy V-, A-, X-, Y-, P-).

---

## Cross-agent konflikty

| Problém | Kdo fixuje první |
|---------|------------------|
| Latent double init (QA-004) | **A5** — jeden `whenVisible` entry |
| Defect focus (QA-007 + Y-004) | **A4** — focus-visible + `role="group"` |
| `--text-muted` kontrast (Y-009) | **A0** — token request; do fixu `--text-secondary` lokálně |
| Hero CTA (QA-003 + Y-005) | **A1** — Lenis helper + reduced-motion guard |
| PipelineTransition pin (A-005 + X-006) | **A7** — sticky vs ST pin rozhodnutí |

---

## Doporučené pořadí oprav

1. QA-001 (GuiDemo grid)
2. QA-002, QA-003, QA-004 (scroll infra)
3. QA-005, QA-006, QA-007 (a11y P0)
4. QA-029, QA-030, P-007, P-008 (CLS/LCP)
5. QA-024, QA-025 (Safari/iOS)
6. P1 batch dle vlastníka souboru (CONTRACT §1)

---

## Token requests (A0 — neimplementovat v QA passu)

- Chroma green (`CompositingDeck` layer_0) — A6→A0
- Defect brown tint (`PipelineBlender` SVG) — A4→A0
- Higher-opacity accent/nok overlays — A1/A2/A6→A0
- `--text-muted` zesvětlení pro WCAG — Y-009 → A0

---

## Co NESMÍ být opraveno bez schválení

- Nové tokeny v `tokens.css` (A0)
- Nové závislosti
- Commit bez review diffu

---

## Schválený P0 fix batch (prompt ready)

Viz `.cursor/prompts/fix-p0-qa-batch.md`
