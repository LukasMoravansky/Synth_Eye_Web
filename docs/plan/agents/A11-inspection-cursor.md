# A11 — Inspection Cursor (průřezový prvek)

**Vlna 3 · paralelně · větev `feat/a11-inspection-cursor`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/scripts/inspection-cursor.js`, `src/styles/cursor.css`
**Nesmíš editovat:** žádnou komponentu, `global.css`, `tokens.css`, `Base.astro`

---

## Cíl

**Interaktivní identita celého webu.** Kurzor se po celém webu chová jako **inspekční sonda**.
Kdykoli uživatel přejede přes jakýkoli obrázek dílu — v jakékoli sekci — objeví se inspekční
overlay s confidence score a bounding boxem.

Není to efekt v jedné sekci. Je to vrstva přes celý web, která neustále reinforcuje core message:
**„stroj, který vidí."**

Proto jsi až ve vlně 3 — potřebuješ stabilní layout všech sekcí, aby bylo vidět, jak se prvek
chová v každém kontextu.

---

## Co se má stát

Při hoveru nad jakýmkoli elementem s atributem `data-inspectable`:

1. **Viewfinder overlay** — kruhový highlight kolem kurzoru (odkaz na logo Synth.Eye).
   Tenký kruh v `var(--accent)`, ~28–36px radius, s crosshair ryskami (4 čárky do středu, ne úplně
   k němu), plus jemný `--accent-glow`.
2. **Confidence score** v `var(--font-mono)`, tabular-nums, hned u kurzoru
   (offset ~20px vpravo dolů, s flipem u okraje viewportu).
3. **Bounding box s classification labelem** — např. `Cls_Obj_Front_Side 99.15%`.
   Box se objeví kolem inspekovaného obrázku (nebo kolem oblasti, kterou definuje) s rohovými
   markery, ne plným rámem.

Data čti z atributů, které na obrázky přidali ostatní agenti:

```html
<img data-inspectable
     data-label="Cls_Obj_Front_Side"
     data-confidence="99.15" />
```

Volitelné atributy, které respektuj, pokud jsou přítomné:
- `data-box="x,y,w,h"` — normalizované 0–1 souřadnice bounding boxu v rámci obrázku
  (bez nich obal celý obrázek s malým insetem)
- `data-secondary-label` / `data-secondary-confidence` — druhá detekce (např. defekt)

Chybí-li `data-label` nebo `data-confidence`, prvek **degraduj na samotný viewfinder kruh**
bez textu. Nikdy nezobrazuj `undefined` ani nevymýšlej hodnotu.

---

## Chování a kvalita pohybu

Tohle je prvek, na kterém se láme dojem z celého webu — detaily rozhodují:

- **Lerpovaný pohyb** (~0.18–0.22), ne 1:1. Kruh za kurzorem mírně „táhne".
- **Vstup:** kruh se objeví scale 0 → 1 s `--ease-out`, ~220ms. Label fade-in se zpožděním ~80ms.
- **Výstup:** scale 1 → 0.85 + opacity 0, ~160ms. Rychlejší než vstup.
- **Přechod mezi dvěma `data-inspectable` elementy** bez opuštění: box se **přemístí tweenem**,
  neblikne (žádný unmount + mount).
- Nad ne-inspectable obsahem: kurzor je **normální systémový kurzor**, žádný custom kurzor
  přes celý web. (Custom kurzor všude = obtěžující a špatně přístupné.)
- Nad inspectable obrázkem můžeš nativní kurzor potlačit (`cursor: none` **jen na tom elementu**)
  — ale jen pokud je viewfinder dost výrazný, aby uživatel neztratil pozici. Pokud si nejsi jistý,
  nativní kurzor **nech** a zapiš to jako rozhodnutí do `progress.md`.
- Overlay je `position: fixed`, `pointer-events: none`, `z-index: var(--z-cursor)` (od A0),
  **jeden** globální element vytvořený lazy při první potřebě.

---

## Technické constraints

- **Zero dependencies na komponentách.** Modul si sám najde `[data-inspectable]` v `document`.
  Použij **jeden delegovaný listener** na `document` (`pointerover`/`pointerout` s
  `closest('[data-inspectable]')`), ne listener na každém obrázku. Sekce se lazy-loadují →
  delegace je jediné správné řešení. **Nepoužívej MutationObserver.**
- **Jediný rAF loop**, aktivní **jen** dokud je kurzor nad inspectable elementem.
  Když není, loop `cancelAnimationFrame` — žádný loop běžící na pozadí celý web.
- Transformace jen `transform` + `opacity`. `will-change: transform` jen během aktivity.
- GSAP z `lib/motion.js` pro tweeny vstupu/výstupu; pozici kurzoru řeš vlastním lerpem v rAF
  (GSAP tween per frame by byl overkill).
- `src/styles/cursor.css` importuj **z vlastního modulu** (`import '../styles/cursor.css'`)
  — Astro/Vite ho zabundluje, a ty nemusíš sahat na `Base.astro`.
- Inicializace: modul se musí spustit jednou globálně. **Ale `scroll-setup.js` patří A0.**
  Řešení: `Base.astro` a `scroll-setup.js` neupravuj — místo toho zapiš do `progress.md`
  požadavek `A11 → integrátor: přidat import inspection-cursor.js do scroll-setup.js`
  a zároveň nech modul **self-initializing** (na konci souboru zavolej `init()` uvnitř
  `if (typeof document !== 'undefined')`), aby stačil jediný import. Integrátor ten import
  doplní při merge vlny 3.
- `inspection-cursor.js` **< 3 KB gzip**.

## Degradace (obojí povinné)

### Touch zařízení — `isFinePointer()` false

**Tap-to-inspect** místo continuous tracking:
- tap na `data-inspectable` obrázek zobrazí bounding box + label **na místě tapnutí**
  a nechá ho tam (~2.5 s, nebo dokud uživatel nezavře / netapne jinam)
- žádný sledující kruh, žádný rAF loop
- tap **nesmí** blokovat scroll ani zabránit kliknutí, pokud je obrázek v odkazu

### `prefersReducedMotion()`

- žádný lerp, žádné scale animace — overlay se objeví a zmizí okamžitě (nebo s 100ms opacity)
- kruh se nepohybuje plynule, ale skokově sleduje kurzor (nebo se zobrazí staticky uprostřed
  inspectable oblasti)
- **informace zůstává** — label a confidence jsou vidět

## Přístupnost

- Overlay je **čistě dekorativní vrstva**: `aria-hidden="true"`, `pointer-events: none`.
  Informace v něm **nesmí být jediným zdrojem** — proto ostatní agenti dali labely do `alt`
  textů a `.sr-only`. Neduplikuj je do `aria-live` (bylo by to spamování při každém pohybu myši).
- **Klávesnicová alternativa:** když je `data-inspectable` element zaostřený (`:focus-visible`)
  — a je zaostřitelný — zobraz statický bounding box + label uprostřed elementu. Elementy,
  které zaostřitelné nejsou, sám `tabindex`em nedoplňuj (to je věc vlastníků komponent —
  zapiš požadavek do `progress.md`).
- Nikdy nezakryj text ani interaktivní prvek tak, aby přestal být čitelný/klikatelný.

## Akceptační kritéria

- [ ] Viewfinder kruh + crosshair se objeví nad **každým** `data-inspectable` obrázkem
      napříč všemi sekcemi (projdi celý web a ověř každou sekci)
- [ ] Confidence score a classification label se zobrazují se správnými hodnotami z `data-*`
- [ ] Bounding box má rohové markery, ne plný rám; respektuje `data-box`, když je přítomen
- [ ] Pohyb je lerpovaný, kruh mírně „táhne" za kurzorem
- [ ] Přejezd mezi dvěma inspectable obrázky box přemístí tweenem, neblikne
- [ ] Mimo inspectable obsah je normální systémový kurzor a **rAF loop neběží**
      (ověř v DevTools Performance — na idle stránce žádná aktivita)
- [ ] Label u pravého/spodního okraje viewportu se překlopí, aby nevyčníval
- [ ] Chybějící `data-label` → jen kruh, nikde `undefined`
- [ ] Touch: tap-to-inspect funguje, scroll není blokovaný, žádný sledující kurzor
- [ ] `prefers-reduced-motion`: overlay bez animace, informace zachovaná
- [ ] Zaostřený inspectable element zobrazí statický box (klávesnicová alternativa)
- [ ] `inspection-cursor.js` < 3 KB gzip
- [ ] `git status` obsahuje jen `inspection-cursor.js`, `cursor.css`, `progress.md`

## Co NEDĚLAT

- **Nedělej custom kurzor přes celý web** — jen nad inspectable obsahem.
- Nepoužívej MutationObserver ani listener per obrázek — delegace na `document`.
- Nenechávej rAF loop běžet, když kurzor není nad inspectable prvkem.
- Nesahej na `Base.astro`, `scroll-setup.js`, `global.css`, `tokens.css` ani na komponenty —
  potřebnou integraci zapiš do `progress.md`.
- Nedoplňuj `data-inspectable` atributy do cizích komponent. Chybí-li někde, zapiš to.
- Neanimuj `top`/`left` — jen `transform`.
- Nespamuj `aria-live` při pohybu myši.
