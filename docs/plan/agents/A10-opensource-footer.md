# A10 — Open Source bento grid + Footer

**Vlna 3 · paralelně · větev `feat/a10-opensource-footer`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/OpenSource.astro`, `src/components/Footer.astro`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

Poslední dvě sekce webu: **Open Source** (kam jít dál) a **Footer** (kdo to udělal).
Nejsou to „vata" — pro inženýra ve cílovce je Open Source sekce ta, kde se rozhodne, jestli
si repo naklonuje.

Headings:
- Open Source: **Everything is open**
- Footer: bez headingu (nebo malý `<h2 class="sr-only">`)

Klíčová zpráva Open Source sekce: *„Everything is open. Models, data, code. Fork it, train it, deploy it."*

---

## Sekce 7 — Open Source (bento grid)

**Bento grid** — dlaždice různých velikostí, ne uniformní mřížka. 5 karet, asymetrická
kompozice (např. 2 velké + 3 menší, nebo 1 wide + 4).

### Karty

| Karta | Obsah |
|---|---|
| **Synth.Eye (Blender)** | popis pipeline (PBR rendering, procedurální defekty), link `https://github.com/rparak/Synth_Eye` |
| **Synth.Eye GAN** | popis (StyleGAN2-ADA, compositing, YOLO training, PyQt5 inspekční app), link `https://github.com/LukasMoravansky/Synth_Eye_GAN` |
| **Models on HuggingFace** | `front.pkl`, `back.pkl`, `fingerprint.pkl` — s velikostmi a resolution |
| **Dataset on HuggingFace** | počet obrázků, splits (train/val/test), formát |
| **StyleGAN2-ADA fork** | link `https://github.com/LukasMoravansky/stylegan2-ada-pytorch` |

**Data, která NEMÁŠ:** HuggingFace URL, velikosti `.pkl` souborů, resolution modelů, počet
obrázků a splits datasetu, GitHub star counts.

Postup: přečti `.claude/context/Claude_project/REDSME-2.md` a `README-1.md` — co tam je, použij.
Co tam není:
1. **Nevymýšlej to.** Žádné „~350 MB", žádné fake star county.
2. Nech v markupu monospace slot s `data-pending` atributem a hodnotou `—` v `--text-muted`
   (vizuálně to působí jako „nevyplněno", ne jako chyba).
3. Zapiš **konkrétní seznam chybějících hodnot** do `progress.md` sekce „Rozhodnutí k řešení".
4. HuggingFace odkazy zatím veď na GitHub repo a označ je `data-pending`.

### Styl karet

- pozadí `var(--bg-surface)`, jemný `var(--border)`
- **monospace detaily**: velikosti souborů, resolution, počty — `var(--font-mono)`,
  `--text-muted`, 12px, tabular-nums
- **hover efekt**: jemný glow v accent barvě (`var(--accent-glow)` jako `box-shadow` / vnitřní
  gradient) + `--border-hover`. **Ne** scale transform na celé kartě, **ne** gradient pozadí.
- karta je **celá klikatelná** (`<a>` obalující obsah, ne odkaz jen v titulku),
  ale text zůstává selectovatelný
- `.viewfinder` rohové závorky (utility od A0) na velkých kartách
- ostré nebo 2–4px hrany, ne 8px na všem
- ikony: inline SVG (GitHub, HuggingFace) — **nakresli minimální vlastní**, nepřidávej
  ikonovou knihovnu. HuggingFace logo nemáš → použij textový wordmark `HF` v monospace v rámečku.

---

## Sekce 8 — Footer (tým + instituce)

Kompaktní, **bez přehnané sebeprezentace**. Stručně, profesionálně.

Obsah:
- **Contributors:** Roman Parak, Lukas Moravansky, Filip Rusnak
- **Instituce:** INTEMAC, JIC (`https://www.jic.cz/en/`)
- **MIT license badge**
- **Kontaktní / repo odkazy**
- Copyright řádek v monospace, 11px, `--text-muted`

### Avataři — degradovaný stav

Fotky contributorů **nemáme**. Viz [../assets.md](../assets.md) §2.6.
Použij **iniciály v monospace v kruhu**: `RP`, `LM`, `FR` — `--bg-surface` pozadí,
`--border`, `--text-secondary` text, 44–52px kruh. Na hover `--border-hover` + `--accent` text.

**Zakázáno:** generované AI portréty, avatary z externí služby (Gravatar, ui-avatars.com,
DiceBear), stock fotky lidí.

### Loga institucí — degradovaný stav

SVG loga INTEMAC a JIC **nemáme**. Použij **textové wordmarky** v `--text-secondary`,
`--font-display` nebo `--font-mono`, s tenkým oddělovačem. Zapiš do `progress.md` požadavek
na dodání SVG.

### Footer layout

Ne centrovaný blok. Například: vlevo logo + claim + copyright, vpravo tři kolony
(Contributors / Repositories / Institution). Nad footerem tenká `--border` linka.
Pozadí `--bg-primary` nebo `--bg-deep`.

---

## Technické constraints

- **Zero JS** v obou komponentách. Hover efekty a bento layout jsou čistě CSS.
  Reveal animace jen přes `data-reveal` atributy (obsluhuje `lib/reveal.js` od A0).
- Bento grid: CSS Grid s `grid-template-areas` (čitelnější než span kalkulace),
  pod 900px → 2 kolony, pod 600px → 1 kolona (karty v logickém pořadí důležitosti).
- Externí odkazy: `target="_blank" rel="noopener noreferrer"` + `.sr-only` „(opens in new tab)".
- Footer je `<footer>`, ne `<section>`. Navigační seznamy odkazů v `<nav>` s `aria-label`.
- Přístupnost: karty jsou odkazy s popisným textem (ne „click here"), fokus viditelný na celé
  kartě (`:focus-visible` na `<a>` → outline kolem karty). Kontrast monospace detailů v
  `--text-muted` ověř — na 12px musí projít AA.
- Responsive: 360 / 768 / 1440px. Na mobilu footer kolony pod sebou.

## Akceptační kritéria

- [ ] Open Source sekce je **bento grid** s dlaždicemi různých velikostí, ne uniformní mřížka
- [ ] 5 karet s uvedenými obsahy a správnými GitHub URL
- [ ] Chybějící data (HF URL, velikosti, splits) jsou označená `data-pending` s `—`,
      **nikde vymyšlené hodnoty**, a všechna jsou vypsaná v `progress.md`
- [ ] Hover na kartě: accent glow + border-hover, žádný gradient, žádný scale
- [ ] Celá karta je klikatelná, focus outline je vidět kolem celé karty
- [ ] Footer: 3 contributoři jako monospace iniciály v kruhu, žádné generované avatary
- [ ] Footer obsahuje MIT badge, INTEMAC + JIC wordmarky, repo odkazy, copyright
- [ ] Footer layout **není** centrovaný blok
- [ ] **Zero JS** — v `dist/` nepřibyl kvůli těmto sekcím žádný chunk
- [ ] Externí odkazy mají `rel="noopener noreferrer"` a screen-reader upozornění
- [ ] 360 / 768 / 1440px ověřeno
- [ ] `git status` obsahuje jen `OpenSource.astro`, `Footer.astro`, `progress.md`

## Co NEDĚLAT

- Nevymýšlej velikosti modelů, počty obrázků, star county ani HuggingFace URL.
- Nepoužívej externí avatar službu ani AI-generované portréty.
- Nepřidávej ikonovou knihovnu — inline SVG.
- Žádné gradient pozadí karet, žádné gradient CTA tlačítko.
- Nedávej `border-radius: 8px` na všechny karty.
- Nepiš do těchto komponent žádný JS.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
