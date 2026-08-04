# A12 — Responsive + Performance + Accessibility audit

**Vlna 4 · sekvenčně (běž sám) · větev `feat/a12-audit`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** finální polish pass. **Jsi jeden z mála agentů, kteří smí editovat napříč soubory.**
Nesmíš ale měnit **koncepci** ani přepisovat interaktivní prvky — opravuješ, neredesignuješ.

Předpoklad: vlny 0–3 jsou zmergované do `main` a build prochází. Pokud ne, **nezačínej**
a zapiš to do `progress.md`.

---

## Cíl

Web je funkční, ale postavený 12 agenty paralelně. Tvoje práce je **udělat z toho jeden
konzistentní produkt**: sjednotit rytmus, dorovnat responsivitu, dodržet performance budget,
projít přístupnost. Tohle je poslední krok před deployem.

---

## 1. Cross-section konzistence

Projdi celý web od hero po footer a **oprav nekonzistence**, které vznikly paralelní prací:

- [ ] **Vertikální rytmus:** všechny sekce používají `--section-py`. Žádná sekce nemá výrazně
      jiný padding než ostatní bez důvodu.
- [ ] **Šířky obsahu:** všechny sekce respektují `--content-max` a `--gutter`. Full-bleed sekce
      jsou full-bleed záměrně, ne omylem.
- [ ] **Typografická hierarchie:** H2 mají všude stejnou velikost a tracking. Lead texty stejnou
      velikost. Monospace labely stejnou velikost a tracking.
- [ ] **Hardcoded barvy:** projdi grep na hex hodnoty (`#[0-9a-fA-F]{3,6}`) ve `src/components`
      a `src/scripts` a **nahraď je tokeny**. Výjimka: `tokens.css`, hodnoty odvozené v rgba().
- [ ] **Radiusy:** nikde není `border-radius: 8px` na všem. Používá se 2–4px, 8px výjimečně.
- [ ] **Border tokeny:** `--border` / `--border-hover` místo lokálních rgba.
- [ ] **Střídání pozadí:** sekce se vizuálně oddělují (`--bg-primary` / `--bg-deep` / `--bg-elevated`)
      v čitelném rytmu, ne náhodně.
- [ ] **Fonty:** grep na zakázané fonty (`Inter`, `Roboto`, `Poppins`, `Open Sans`, `Montserrat`)
      — nula výskytů. Celkem max 3 font families.
- [ ] **Layout:** ne všechny sekce jsou symetricky centrované (pravidlo z konceptu).

## 2. Responsive

Ověř na **360, 480, 768, 1024, 1440, 1920 a 2560px** (+ jeden 4K checkpoint):

- [ ] Nikde **horizontální scroll** stránky (`document.documentElement.scrollWidth === clientWidth`)
- [ ] Žádný text pod 12px, žádný přetékající monospace řádek
- [ ] Interaktivní prvky: GUI demo stacked na mobilu, compositing deck tap-to-lift,
      latent navigator drag, defect revealer tap-to-inspect, particle transition CSS fallback
- [ ] **Touch degradace funguje na reálném touch zařízení nebo v DevTools device emulaci
      s touch simulací** (ne jen podle šířky okna) — particle physics vypnuté, inspection cursor
      jako tap
- [ ] Na 2560px+ obsah nevisí v prázdnu — `--content-max` drží, ale hero a full-bleed sekce
      využívají prostor
- [ ] Tap targety min 44×44px na touch
- [ ] Landscape mobil (např. 844×390) — hero a pinnuté sekce nejsou nepoužitelné

## 3. Performance

Cíle: **FCP < 1.5 s, LCP < 2.5 s, celkový JS < 50 KB gzip.**

- [ ] `npm run build` → zkontroluj velikosti chunků v `dist/_astro/`. Zapiš tabulku do
      `progress.md`: každý chunk + gzip velikost + součet.
- [ ] Pokud součet > 50 KB gzip: najdi příčinu (duplikovaná utilita? importovaný celý GSAP
      místo core+ScrollTrigger? nezalazy-loadovaný modul?) a **oprav**. Nemaž funkcionalitu
      bez zápisu do `progress.md`.
- [ ] **Statické sekce posílají 0 KB JS** — ověř, že Results / OpenSource / Footer nezavlekly chunk
- [ ] Všechny interaktivní moduly jsou **lazy-loaded** přes `whenVisible` — ověř v Network tabu,
      že se chunk načte teprve při scrollu k sekci
- [ ] Obrázky: všechny mají `width`/`height` (CLS = 0), `loading="lazy"` kromě hero,
      AVIF/WebP se skutečně servírují (Network tab: `Content-Type: image/avif`)
- [ ] **Žádný obrázek nad 400 KB** v `public/images/` (kromě hero, max 600 KB). Pokud je,
      dojeď `npm run assets` s agresivnější kvalitou.
- [ ] Fonty: `font-display: swap`, preload jen na 2 kritické váhy, žádný request na externí domain
- [ ] **Všechny rAF loopy se zastaví mimo viewport** — projdi Performance panel na idle stránce
      (hero, particles, compositing parallax, latent navigator, inspection cursor). Idle stránka
      = žádná JS aktivita.
- [ ] Lighthouse (mobile i desktop, produkční build přes `npm run preview`): zapiš skóre
      Performance / Accessibility / Best Practices / SEO do `progress.md`.
      **Cíl: Performance ≥ 90, Accessibility ≥ 95.**
- [ ] Žádné console errory ani warningy v produkčním buildu

## 4. Přístupnost

- [ ] **Heading hierarchie:** jedna `<h1>` (hero), sekce mají `<h2>`, žádné přeskočené úrovně
- [ ] Každá `<section>` má `aria-labelledby` nebo `aria-label`
- [ ] **Klávesnicový průchod celým webem:** Tab projde vše v logickém pořadí, focus je vždy
      viditelný, nic není uvězněné (zvlášť pinnutá particle sekce)
- [ ] Všechny interaktivní prvky mají klávesnicovou alternativu: GUI demo buttony,
      compositing vrstvy (arrow keys), latent navigator (arrow keys), defect revealer
      (arrow keys), measurement gauges a toggle
- [ ] `alt` texty: informativní obrázky mají popisný alt, dekorativní `alt=""`.
      Žádný alt typu „image" nebo „obrázek dílu".
- [ ] Kontrast: ověř `--text-secondary` a `--text-muted` na všech pozadích, na kterých se
      reálně používají. Na 12px monospace musí projít **AA (4.5:1)**. Pokud neprojde, zvyš
      velikost nebo použij světlejší token — **neupravuj tokeny v `tokens.css` bez zápisu
      do `progress.md`**.
- [ ] Barva **není jediný nositel informace**: OK/NOK, PASS/FAIL mají text i ikonu
- [ ] Canvas a dekorativní SVG: `aria-hidden="true"` + textová alternativa v `.sr-only`
- [ ] `prefers-reduced-motion: reduce` — **projdi celý web** s emulací zapnutou:
      nikde prázdný prostor, nikde chybějící informace, nulový nechtěný pohyb,
      žádný běžící rAF loop
- [ ] Screen reader smoke test (NVDA / VoiceOver / Windows Narrator): projdi web, ověř,
      že narativ je čitelný a metriky se čtou s finálními hodnotami
- [ ] `<html lang="en">`, `:focus-visible` nikde nepotlačený

## 5. Cross-browser

- [ ] Chrome / Edge, Firefox, Safari (nebo aspoň WebKit přes responsive mode).
      Klíčová rizika: `clip-path: circle()` s procenty, `backdrop-filter`,
      `mix-blend-mode` v kombinaci s `filter`, `mask-image` prefixy (Safari `-webkit-mask-image`),
      `OffscreenCanvas` (Safari support), `100svh`.
- [ ] Kde chybí podpora, přidej fallback (`@supports`), ne polyfill knihovnu.

---

## Pravidla pro tvoje zásahy

- **Opravuj, neredesignuj.** Nemazej interaktivní prvky, neměň koncepci sekcí, nepřepisuj
  hotové animace jen proto, že bys je udělal jinak.
- Změny v cizích souborech drž **minimální a cílené** — jeden commit na jeden typ opravy
  (`fix(a11y): …`, `perf: …`, `fix(responsive): …`), aby byly reviewovatelné.
- Zjistíš-li **koncepční problém** (např. prvek nelze zpřístupnit bez redesignu):
  neopravuj násilím — zapiš do `progress.md` sekce „Rozhodnutí k řešení" a navrhni variantu.
- Změny v `tokens.css` jsou **poslední možnost** a vždy se zápisem do `progress.md`.
- Nepřidávej žádnou novou npm závislost (ani a11y ani perf nástroj do runtime;
  devDependencies pro měření jsou OK, pokud je nepustíš do bundlu).

## Výstup

Do `progress.md` (nebo nového `docs/plan/audit-report.md`, který si vytvoř) zapiš:
1. tabulku velikostí JS chunků + součet gzip
2. Lighthouse skóre (mobile + desktop)
3. seznam oprav po kategoriích
4. **seznam nevyřešených problémů** s návrhem řešení a odhadem náročnosti

Buď v reportu **věcný** — když něco neprošlo, napiš to i s čísly. Nepiš „optimalizováno",
když budget stále přesahuje.
