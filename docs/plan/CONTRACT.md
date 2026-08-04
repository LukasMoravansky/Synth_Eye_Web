# CONTRACT — pravidla pro všechny agenty

> **Povinné čtení.** Tento kontrakt platí pro každého agenta A0–A13. Cokoli, co je zde,
> má přednost před tvým vlastním úsudkem. Když kontrakt něco nepokrývá a ty si nejsi jistý,
> **zapiš otázku do [progress.md](progress.md) sekce „Rozhodnutí k řešení" a udělej nejkonzervativnější variantu** —
> nevymýšlej si novou závislost, nový font ani nový barevný token.

---

## 1. Zlaté pravidlo — exkluzivní vlastnictví souborů

Každý soubor má **právě jednoho vlastníka** (tabulka v [README.md](README.md#roster-agentů)).

- **Vytvářej a edituj jen soubory, které vlastníš.** Žádná výjimka pro agenty A1–A11.
- Potřebuješ změnu v cizím souboru (např. nový token, nová utilita, úprava `index.astro`)?
  → **Neudělej ji.** Zapiš požadavek do [progress.md](progress.md) sekce „Rozhodnutí k řešení"
  ve formátu `A4 → A0: potřebuji token --grid-gutter` a pokračuj s lokálním workaroundem
  ve svém scoped CSS.
- Výjimka: **A12 a A13** (vlna 4) smí editovat napříč — jsou to audit/integration passy a běží samy.
- `progress.md` je společný, ale každý agent edituje **jen svůj řádek** a přidává do „Rozhodnutí".

---

## 2. Design tokeny — používej proměnné, nikdy hardcoded hodnoty

Tokeny definuje A0 v `src/styles/tokens.css`. Ve svém CSS **vždy** používej `var(--token)`.
Hardcoded hex je chyba (kromě `rgba()` odvozených od accentu tam, kde token neexistuje).

```css
/* Pozadí */
--bg-deep:      #08080c   /* nejhlubší — hero */
--bg-primary:   #0c0c12   /* hlavní pozadí sekcí */
--bg-elevated:  #141418   /* karty, GUI demo */
--bg-surface:   #1a1a22   /* nested elementy */

/* Text */
--text-primary:   #e8e8ec  /* NE pure white */
--text-secondary: #8a8a96
--text-muted:     #4a4a56  /* labely, timestampy, metadata */

/* Accent */
--accent:       #7B6EF6
--accent-light: #9B8FFE   /* hover */
--accent-glow:  rgba(123, 110, 246, 0.15)

/* Stavy (průmyslový kontext) */
--ok:  #22c55e   --ok-glow:  rgba(34, 197, 94, 0.12)
--nok: #ef4444   --nok-glow: rgba(239, 68, 68, 0.12)

/* Utility */
--border:       rgba(255, 255, 255, 0.06)
--border-hover: rgba(255, 255, 255, 0.12)
--glass:        rgba(255, 255, 255, 0.02)
```

### Typografie

```
--font-display: 'Clash Display', 'Space Grotesk', sans-serif   /* headings */
--font-body:    'Satoshi', system-ui, sans-serif               /* body */
--font-mono:    'JetBrains Mono', ui-monospace, monospace      /* data, logger, metriky */
```

- `--font-mono` **vždy** s `font-variant-numeric: tabular-nums` na číslech.
- Maximálně tyto 3 fonty. **Zákaz** Inter / Roboto / Poppins / Open Sans / Montserrat.
- Škály (A0 je vystaví jako tokeny, ostatní je jen používají):
  ```
  H1  clamp(3rem, 6vw + 1rem, 7.5rem)   w700  tracking -0.03em  lh 0.95
  H2  clamp(2rem, 4vw + .5rem, 4.5rem)  w700  tracking -0.02em
  H3  clamp(1.25rem, 2vw + .5rem, 2rem) w600
  Body 16–17px  w400  lh 1.65
  Data JetBrains Mono, 14–48px dle kontextu, tabular-nums
  ```

### Spacing a rytmus

Používej tokeny `--space-1` … `--space-12` (A0: 4px base scale, `--space-*` = `4/8/12/16/24/32/48/64/96/128/160/200px`).
Sekce mají velkorysý vertikální padding: `--section-py: clamp(6rem, 12vh, 12rem)`.
Obsahová šířka: `--content-max: 1440px`, gutter `--gutter: clamp(1.25rem, 4vw, 5rem)`.

---

## 3. Rozdělení odpovědností v kódu (striktní)

| Vrstva | Kde | Co tam smí |
|---|---|---|
| Markup + scoped CSS | `src/components/*.astro` | HTML, scoped `<style>`. **Zero JS** ve statických sekcích. |
| Interakce | `src/scripts/*.js` | Vanilla JS, jeden soubor na interaktivní prvek |
| Shared utils | `src/scripts/lib/*.js` | vlastní A0 — `counter.js`, `reveal.js`, `lazy-init.js`, `motion.js` |
| Globální styl | `src/styles/*.css` | vlastní A0 (kromě `cursor.css` = A11) |
| HTML shell | `src/layouts/Base.astro` | vlastní A0 (meta doplní A13) |

### Jak zapojit skript do komponenty

Žádné `is:inline` skripty s logikou v komponentě. Vždy tento vzor — **lazy import až když je
prvek ve viewportu**, přes utilitu od A0:

```astro
<section class="gui-demo" data-gui-demo>
  <!-- markup -->
</section>

<script>
  import { whenVisible } from '../scripts/lib/lazy-init.js';
  whenVisible('[data-gui-demo]', () => import('../scripts/gui-demo.js'));
</script>
```

Modul v `src/scripts/*.js` exportuje **default funkci `init(root)`**, kterou `whenVisible` zavolá
s nalezeným elementem. Modul si sám nesmí nic hledat globálně mimo svůj `root`.

```js
// src/scripts/gui-demo.js
export default function init(root) { /* … */ }
```

---

## 4. Animace

- **GSAP + ScrollTrigger** — importuj `gsap` a `gsap/ScrollTrigger` z npm, nikdy z CDN.
  Registraci pluginu (`gsap.registerPlugin(ScrollTrigger)`) dělá A0 v `scroll-setup.js`;
  ostatní agenti importují už zaregistrovanou instanci z `../scripts/lib/motion.js`.
- **Lenis** je inicializován A0 a propojen se ScrollTriggerem. Nikdy nezakládej druhou instanci.
- Každá animace musí mít **účel**. Zákaz plošného parallaxu.
- `prefers-reduced-motion: reduce` je **povinný** — každý prvek má statickou, plně čitelnou
  alternativu (žádné skryté obsahy, žádné prázdné canvasy). Kontroluj přes `prefersReducedMotion()`
  z `lib/motion.js`, ne vlastním `matchMedia`.
- Vždy uklízej: `ScrollTrigger` instance a `requestAnimationFrame` loopy zastav, když prvek
  opustí viewport (`lazy-init.js` ti dá `onExit` callback).

---

## 5. Performance budget

| Metrika | Limit |
|---|---|
| FCP | < 1.5 s |
| LCP | < 2.5 s |
| Celkový JS | **< 50 KB gzip** (GSAP+ST ~30, Lenis ~5, custom 8–15) |
| Custom JS jednoho prvku | < 4 KB gzip |
| Obrázek na stránce | AVIF → WebP → PNG, `loading="lazy"` mimo hero |
| Canvas animace | `requestAnimationFrame`, pauza mimo viewport, cap na DPR 2 |

**Zákaz nových npm závislostí.** Povolený seznam: `astro`, `gsap`, `lenis`, `sharp`
(+ `@astrojs/*` oficiální integrace pro obrázky). Cokoli jiného = zapiš do „Rozhodnutí k řešení",
neinstaluj.

---

## 6. Obrázky a assety

- Zdrojové assety jsou v `.claude/context/`. **Nikdy na ně nelinkuj přímo z komponenty.**
- A0 nastaví build/copy pipeline do `public/images/` s AVIF/WebP/PNG variantami.
  Ty používáš cesty `/images/<slug>.avif` atd., přes `<picture>` nebo Astro `<Image />` podle
  vzoru, který A0 nechá v `src/components/Nav.astro` a v komentáři v `A0` výstupu.
- **Placeholdery jsou zakázané** (žádné lorem ipsum obrázky, žádné šedé boxy jako finální stav).
  Chybí-li asset, použij degradovanou variantu z [assets.md](assets.md) a označ v `progress.md`.
- Každý obrázek dílu, který má být inspekční, dostane atributy pro A11:
  ```html
  <img src="…" alt="…" data-inspectable
       data-label="Cls_Obj_Front_Side" data-confidence="99.15" />
  ```
  Ty jen dodáš atributy. Logiku kurzoru implementuje **výhradně A11**.

---

## 7. Přístupnost

- Semantic HTML: jedna `<h1>` (hero), sekce jako `<section>` s `aria-labelledby`.
- Každý interaktivní prvek je použitelný **klávesnicí**: buttony jsou `<button>`, draggable
  vrstvy mají keyboard alternativu (arrow keys) nebo aspoň statický plně čitelný stav.
- Viditelný `:focus-visible` outline v `--accent`, nikdy `outline: none` bez náhrady.
- Canvas a dekorativní SVG: `aria-hidden="true"`. Informační obsah nikdy jen v canvasu.
- Kontrast: text na `--bg-*` musí splnit WCAG AA (`--text-muted` používej jen na 12px+ metadata).

---

## 8. Responsive

Breakpointy (mobile-first, tokeny od A0):
```
sm  480px    md  768px    lg  1024px    xl  1440px    2xl 1920px+
```
- Musí být použitelné od 360px do 4K.
- **Touch degradace (povinná):** particle physics vypnuté na touch (CSS crossfade fallback),
  inspection cursor jako tap-to-inspect, drag interakce mají tap/scroll alternativu.
  Detekce: `matchMedia('(hover: hover) and (pointer: fine)')`, ne user-agent sniffing.

---

## 9. Jazyk obsahu

**Veškerý text na webu je v angličtině.** Koncept je v češtině — je to zdroj, ne copy.
Komentáře v kódu a `progress.md` můžou být česky.

---

## 10. NESMÍ — checklist před tím, než řekneš „hotovo"

- [ ] Žádné stock fotky
- [ ] Žádná gradientní CTA tlačítka
- [ ] Žádné generic „AI brain / neural network" vizuály
- [ ] Žádný Tailwind, žádný React/Vue/Svelte
- [ ] Ne symetrický centered layout ve všech sekcích
- [ ] Ne `border-radius: 8px` na všem (používej `--radius-sm: 2px` / `--radius-md: 4px` / ostré hrany; kulaté jen kde má smysl)
- [ ] Max 2–3 fonty
- [ ] Žádný plošný parallax, žádná animace bez účelu
- [ ] Žádný terminálový preloader (Sekce 0 byla z konceptu odstraněna)
- [ ] Žádná nová npm závislost

---

## 11. Definition of Done (platí pro každý úkol)

1. `npm run build` prochází bez chyb a warningů z tvých souborů.
2. `npm run dev` — sekce vypadá a chová se podle akceptačních kritérií tvého promptu.
3. Ověřeno na **360px, 768px, 1440px** šířce.
4. Ověřeno s `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media).
5. Ověřeno průchodem klávesnicí (Tab) — focus je viditelný, nic není nedosažitelné.
6. Nesahal jsi na cizí soubory (`git status` obsahuje jen tvoje soubory + řádek v `progress.md`).
7. Aktualizoval jsi svůj řádek v [progress.md](progress.md) na `DONE` + jednou větou co je hotovo
   a co je případně degradované kvůli chybějícím assetům.

---

## 12. Git

- Každý agent pracuje na vlastní větvi: `feat/a<N>-<slug>` (např. `feat/a2-gui-demo`).
- Commity malé a popisné, česky nebo anglicky konzistentně v rámci větve.
- **Neslučuj sám do `main`.** Merge dělá integrátor po dokončení celé vlny.
- Nikdy nepushuj, pokud build neprochází.
