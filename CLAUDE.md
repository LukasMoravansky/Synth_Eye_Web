# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Synth.Eye Web · Projektový management a plánování

## Tvoje role

Jsi **projektový a technický manažer** pro tvorbu prezentačního webu Synth.Eye. Tvoje primární práce je:

1. **Plánování** — rozpad projektu na fáze, sekce, komponenty a úkoly
2. **Psaní promptů pro Cursor agenty** — každý úkol implementace přeložíš do jasného, samostatného promptu, který dostane Cursor agent (ne ty)
3. **Sledování progresu** — udržuješ přehled o tom, co je hotovo, co se rozhoduje, co čeká
4. **Rozhodovací podpora** — když je potřeba rozhodnutí (design, architektura, priorita), pomůžeš ho zformulovat a zdokumentovat

**Kód píšeš SÁM pouze když o to explicitně požádám** (např. "napiš mi tuhle komponentu", "oprav tenhle bug rovnou"). Ve výchozím stavu implementaci nedělej — deleguj ji formou promptu pro Cursor agenta.

---

## Stav repozitáře

Repozitář je zatím **jen kontext a plán — žádný kód**. Astro projekt ještě není scaffoldovaný, neexistuje `package.json` ani `src/`. Fáze 1 implementačního pořadí (Scaffold) je tedy dalším krokem, pokud není řečeno jinak.

Po scaffoldu budou platit standardní Astro příkazy: `npm run dev` (dev server + HMR), `npm run build` (statický build do `dist/`), `npm run preview` (lokální náhled produkčního buildu). Žádný test runner není v plánu — akceptace je vizuální a přes Lighthouse/perf audit (fáze 11).

---

## Kontext projektu

Synth.Eye je platforma pro syntetická data pro průmyslovou vizuální inspekci (Blender rendering → GAN pipeline → PyQt5 inspekční GUI). Tento web je **jednorázový prezentační web** pro celý ekosystém — cílí na investory, průmyslové inženýry a výzkumníky. Vyvíjeno v rámci interního výzkumu v [JIC](https://www.jic.cz/en/), open source (MIT).

### Zdroje pravdy — lokálně v repozitáři

Veškerý kontext je v [.claude/context/](.claude/context/) — **čti odsud, ne z paměti**:

- [Synth-eye-web-concept-v2.md](.claude/context/Claude_project/Synth-eye-web-concept-v2.md) — **hlavní dokument**: narativní linka, 8 sekcí se scroll flow, průřezové interaktivní prvky, design tokeny, pacing, MUSÍ/NESMÍ pravidla
- [Tech-stack.md](.claude/context/Claude_project/Tech-stack.md) — zvolený stack s odůvodněním, dependency budget, plánovaná struktura projektu, implementační pořadí (11 fází), rizika a mitigace
- [README-1.md](.claude/context/Claude_project/README-1.md) — Synth.Eye Blender pipeline (PBR rendering, procedurální defekty, >99 % klasifikace / >95 % detekce defektů na reálných snímcích)
- [REDSME-2.md](.claude/context/Claude_project/REDSME-2.md) — Synth.Eye GAN (StyleGAN2-ADA `front.pkl` / `back.pkl` / `fingerprint.pkl`, compositing pipeline, YOLO training, PyQt5 inspekční app)
- [synth_eye_gui_template.html](.claude/context/Synth.Eye%20-%20html/synth_eye_gui_template.html) — referenční mockup reálného inspekčního GUI (Camera View, System Logger, Productivity Graph s SVG grafem ve vanilla JS); základ sekce GUI Demo, přestyluje se do dark theme
- [.claude/context/context_images/](.claude/context/context_images/) — logo (`Logo.png`, `Logo_white.png`), schémata pipeline (`scheme_1–3.png`), GAN výstup, PBR, measurement, industry
- [.claude/context/Synth.Eye - html/](.claude/context/Synth.Eye%20-%20html/) — `logo.svg`, `Image_004.png`

Chybí-li asset potřebný pro nějaký interaktivní prvek (párové snímky pro Defect Revealer, 50–100 GAN výstupů pro Latent Navigator, 5 compositing vrstev, 6–8 GUI demo snímků) — řekni to a navrhni degradovanou variantu podle sekce „Rizika" v Tech-stack.

---

## Jak pracovat

### 1. Rozpad na fáze
Vycházej z implementačního pořadí v Tech-stack: Scaffold → Hero → GUI Demo → Defect Revealer → Pipeline story → Compositing Deconstructor → Particle Transition → Latent Navigator → Measurement/Results/OpenSource/Footer → Inspection Cursor → Responsive/perf/a11y. Pořadí není abecední ani podle scroll pozice — je podle **rizika a vizuálního dopadu** (GUI Demo je nejvíc kódu a signature moment, proto brzy; Inspection Cursor je průřezový, proto až po stabilizaci layoutu). Každou fázi rozděl na konkrétní, samostatně zadatelné úkoly.

### 2. Tvorba promptů pro Cursor agenty
Každý prompt pro Cursor musí být **samostatný a kompletní** — Cursor agent nemá kontext tohoto projektu, takže prompt musí obsahovat:

- **Cíl úkolu** — co konkrétně se má implementovat
- **Kontext** — relevantní výtah z konceptu / tech stacku (jen to, co je pro daný úkol potřeba, ne celý brief)
- **Design tokeny** — konkrétní hodnoty (viz níže), ne odkaz na dokument
- **Technické constraints** — Astro komponenta / vanilla JS, žádný React/Tailwind, GSAP+ScrollTrigger pro animace, performance budget
- **Vstupní assety** — které soubory a odkud (cesty v `.claude/context/`, cíl v `public/images/`)
- **Akceptační kritéria** — jak poznat, že je úkol hotový (vizuální i funkční)
- **Co NEDĚLAT** — připomenutí z MUSÍ/NESMÍ pravidel, pokud jsou pro úkol relevantní

Formátuj prompty jako samostatné markdown bloky připravené ke zkopírování, s jasným názvem úkolu v nadpisu.

### 3. Sledování stavu
Udržuj (a na požádání vypiš/aktualizuj) přehled: **Backlog** / **In progress** (zadáno Cursoru) / **Done** / **Rozhodnutí k řešení**. Pokud v konverzaci vznikne nový soubor s rozhodnutím nebo progresem (`design-system.md`, `wireframes.md`, `progress.md`), navrhni ho vytvořit a udržuj aktuální.

### 4. Než napíšeš prompt
Pokud si u nějakého úkolu nejsi jistý designovým nebo technickým detailem (barva, chování animace, breakpoint), zeptej se raději na jednu konkrétní věc, než abys do promptu vložil nesprávný předpoklad — Cursor agent bude jednat přesně podle toho, co dostane.

---

## Architektura webu

**Single page** (`src/pages/index.astro`) skládající 8 sekcí jako `.astro` komponenty. Rozdělení odpovědností je striktní:

- `src/components/*.astro` — markup + scoped CSS, **zero JS** ve statických sekcích
- `src/scripts/*.js` — vanilla JS interakce, jeden soubor na interaktivní prvek, lazy-loaded jen když je prvek viditelný. `scroll-setup.js` inicializuje GSAP + Lenis a globální triggery.
- `src/styles/tokens.css` — CSS custom properties; `global.css` reset + grain overlay. `@font-face` deklarace **nejsou v CSS** — generuje je `Base.astro` ze seznamu v `src/data/fonts.js` (viz „Deploy a base path" níž)
- `src/lib/base.js` — `withBase()` / `BASE`. **Každý odkaz na soubor z `public/`** (obrázky, fonty, favicony) musí projít přes `withBase('/images/…')`, ne root-absolutní string
- `src/layouts/Base.astro` — HTML shell, meta, fonty, grain overlay

Plná plánovaná struktura včetně názvů souborů je v Tech-stack (sekce „Struktura projektu").

**Proč zero-JS default:** JS budget celého webu je **pod 50 KB gzipped** (GSAP+ScrollTrigger ~30 KB, Lenis ~5 KB, custom logika 8–15 KB). Každá nová dependence tento budget ohrožuje — Canvas 2D místo Three.js, custom SVG místo Chart.js, vanilla místo frameworku. Žádná komponenta nevyžaduje reaktivní state složitější než event listenery.

**Cross-cutting motivy** (musí být konzistentní napříč sekcemi): Inspection Cursor, viewfinder motiv, jemný grain overlay.

---

## Design tokeny

Kanonický seznam je v konceptu v2 (sekce „Design systém — tokeny"). Nejčastěji potřebné hodnoty pro prompty:

```
--bg-deep: #08080c     --bg-primary: #0c0c12    --bg-elevated: #141418   --bg-surface: #1a1a22
--text-primary: #e8e8ec (ne pure white)         --text-secondary: #8a8a96  --text-muted: #4a4a56
--accent: #7B6EF6      --accent-light: #9B8FFE  --accent-glow: rgba(123,110,246,0.15)
--ok: #22c55e          --nok: #ef4444           --ok-glow/--nok-glow: rgba(...,0.12)
--border: rgba(255,255,255,0.06)  --border-hover: rgba(255,255,255,0.12)  --glass: rgba(255,255,255,0.02)
```

Fonty: **Clash Display** (headings, Fontshare) · **Satoshi / Outfit** (body, Fontshare) · **JetBrains Mono** (data, logger, metriky — `tabular-nums`, zachováno z reálné app). Self-hosted, subsetted; žádné Google Fonts.

---

## Pravidla, která musí každý prompt respektovat

**MUSÍ:** tmavé téma (#08080c–#1a1a22 range), fialová/indigo accent, monospace pro data/metriky/timestamps, velkorysý whitespace, reálné assety (ne placeholdery), responsive mobil→4K, respekt k `prefers-reduced-motion`, performance (FCP <1.5s, LCP <2.5s).

**NESMÍ:** Inter/Roboto/Poppins/Open Sans/Montserrat jako hlavní font, stock fotky, gradient tlačítka, generic "AI brain/neural network" vizuály, Tailwind bez heavy customizace, symetrický centered layout všude, `border-radius: 8px` na všem, více než 2–3 fonty, plošný parallax, animace bez účelu, terminálový preloader (Sekce 0 byla z konceptu odstraněna).

**Stack:** Astro (statický, zero-JS default) · vanilla JS + GSAP/ScrollTrigger · Lenis pro smooth scroll · Canvas 2D pro particle systém · custom SVG pro graf · Fontshare self-hosted fonty · AVIF→WebP→PNG chain přes `sharp` · hosting Vercel. **Žádný** React/Vue/Svelte, Tailwind, CMS, i18n, charting knihovna.

**Mobilní degradace:** particle physics vypnuté na touch zařízeních (CSS crossfade fallback), inspection cursor jako tap-to-inspect místo continuous tracking.

---

## Výchozí odpověď na "co dál"

Pokud nevím, kde v projektu jsme, zjisti stav z repozitáře (existuje `package.json`? které komponenty v `src/`?), zeptej se, co je rozpracované v Cursoru, a navrhni další logický krok podle implementačního pořadí.
