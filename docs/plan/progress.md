# Progress board

> Živý dokument. **Každý agent edituje jen svůj řádek** v tabulce a přidává položky do
> „Rozhodnutí k řešení". Nikdy nepřepisuj cizí řádek.
> Statusy: `BACKLOG` · `IN PROGRESS` · `BLOCKED` · `DONE`

Poslední aktualizace plánu: **2026-08-04**

---

## Vlna 0 — Foundation (blokuje vše)

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A0 | Scaffold, tokeny, fonty, Base layout, stuby, shared utils, asset pipeline | `BACKLOG` | — |

## Vlna 1 — Vysoké riziko / vizuální dopad

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A1 | Hero — Inspection Chamber | `BACKLOG` | — |
| A2 | GUI Demo (signature moment) | `BACKLOG` | degradace: 3 snímky místo 6–8 |
| A3 | The Data Gap | `BACKLOG` | — |
| A4 | Blender pipeline + Defect Revealer | `BACKLOG` | degradace: syntetický defekt overlay |

## Vlna 2 — Interaktivní jádro

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A5 | GAN pipeline + Latent Space Navigator | `BACKLOG` | varianta závisí na `GAN_output.png` |
| A6 | Compositing Deconstructor | `BACKLOG` | degradace: 2 vrstvy procedurální |
| A7 | Particle Field Transformation | `BACKLOG` | assety OK, nedegraduje |
| A8 | Measurement + gauges | `BACKLOG` | chybí back-side hodnoty |

## Vlna 3 — Informační sekce + průřezový prvek

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A9 | Results — metriky + evidence grid | `BACKLOG` | — |
| A10 | Open Source bento grid + Footer | `BACKLOG` | chybí HF URL, avatary, loga |
| A11 | Inspection Cursor | `BACKLOG` | vyžaduje integraci importu (viz A11 prompt) |

## Vlna 4 — Finální polish

| ID | Úkol | Status | Poznámka |
|---|---|---|---|
| A12 | Responsive + performance + a11y audit | `BACKLOG` | — |
| A13 | SEO, OG image, Vercel deploy | `BACKLOG` | chybí doména |

---

## Rozhodnutí k řešení

Formát: `[kdo → komu] otázka / požadavek` · přidávej na konec, neodstraňuj vyřešené —
označ je `✅ vyřešeno: <odpověď>`.

### Otevřené — čekají na zadavatele

1. **Assety** — dodání chybějících sad podle [assets.md](assets.md). Priorita:
   (1) GAN sada 50–100 snímků · (2) 6–8 GUI demo snímků · (3) párové snímky clean/defect ·
   (4) 5 compositing vrstev · (5) avataři + SVG loga INTEMAC/JIC.
   *Do dodání se implementují degradované varianty — development neblokován.*
2. **HuggingFace URL** — odkazy na modely (`front.pkl`, `back.pkl`, `fingerprint.pkl`)
   a dataset, včetně velikostí souborů, resolution, počtu obrázků a splitů.
   Blokuje část obsahu karet v A10.
3. **Doména** — pro `site.js`, canonical URL a absolutní `og:image`. Do dodání funguje
   `*.vercel.app`.
4. **Back-side measurement hodnoty** — reálné měřené hodnoty pro back side v A8.
   Do dodání se zobrazí front-side sada.
5. **Analytics** — Plausible ano/ne (GDPR, cookie banner). Nic se neimplementuje bez schválení.
6. **GSAP licence** — A0 ověří dostupnost `gsap` + `ScrollTrigger` z npm bez club membership
   a zapíše zjištění sem.

### Vyřešené

*(zatím žádné)*

---

## Integrační poznámky

Vyplňuje **integrátor** při merge každé vlny.

- **Po vlně 1:** ověř, že `index.astro` je nedotčený a všechny 4 sekce se renderují.
  Zkontroluj součet JS chunků.
- **Po vlně 2:** `PipelineGAN.astro` (A5) musí správně importovat `CompositingDeck.astro` (A6) —
  ověř, že se A6 komponenta renderuje a má prostor.
- **Po vlně 3:** doplň import `inspection-cursor.js` do `scroll-setup.js` (A11 na `scroll-setup.js`
  nesmí sahat). Projdi všechny sekce a ověř, že `data-inspectable` atributy jsou přítomné
  tam, kde mají být.
- **Po vlně 4:** produkční build, Lighthouse, deploy.

---

## Log dokončených vln

| Vlna | Zmergováno | Build OK | Poznámka |
|---|---|---|---|
| 0 | — | — | — |
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |
