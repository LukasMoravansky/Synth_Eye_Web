# A7 — Particle Field Transformation (Blender → GAN)

**Vlna 2 · paralelně · větev `feat/a7-particles`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/PipelineTransition.astro`, `src/scripts/particle-transition.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

**Prostorový přechod mezi dvěma érami** — Blender (fyzikální simulace) → GAN (statistical
learning). Ne hard cut, ne fade. Obrázek vyrenderovaný v Blenderu se scroll-driven **rozloží
na tisíce částic** a ty se přeuspořádají do GAN výstupu.

Vizuální metafora: *„stejná data, jiný způsob jejich vzniku."*

Tato sekce **rozbíjí lineární scroll** a mění energii webu — je to zlom mezi dvěma akty, ne
dekorace. Nemá heading; má jen canvas a jednu větu.

---

## Chování — scroll řídí fázi

| Scroll progress | Stav |
|---|---|
| 0 % | Blender render — celistvý obrázek |
| 30 % | obrázek se začíná rozpadat na pixelové částice |
| 60 % | chaotický stav — částice „hledají" novou pozici |
| 100 % | GAN output — nový celistvý obrázek |

Uprostřed timeliny (~50 %) se objeví krátký text, `--font-display` nebo velký `--font-body`,
max šířka ~24ch, centrovaný na canvasu:

> What if instead of simulating physics… you let the machine learn what reality looks like?

Text má vlastní fade in/out okno (~35–65 % progressu), aby nekolidoval s celistvými obrázky
na obou koncích.

---

## Technická realizace

**Canvas 2D API + `requestAnimationFrame`.** Ne WebGL, ne Three.js, ne PixiJS —
Three.js by přidala ~150 KB gzip pro jediný efekt. Canvas 2D zvládne desítky tisíc částic.

### Zdroj částic

1. Načti oba obrázky do offscreen canvasu (`OffscreenCanvas` nebo skrytý `<canvas>`)
   a přečti `getImageData`.
2. Navzorkuj oba na **společný grid** — doporučeno **160×160 = 25 600 částic**
   (rozdílné rozměry obrázků normalizuj na stejný aspect-fit grid).
3. Každá částice: `{ x0, y0, r0,g0,b0, x1, y1, r1,g1,b1 }` — startovní pozice/barva
   z Blender renderu, cílová z GAN výstupu. Ulož do **typed arrays** (`Float32Array`,
   `Uint8ClampedArray`), ne do array objektů — je to rozdíl mezi 60 a 20 fps.

### Interpolace

- Pozice: `lerp(p0, p1, ease(progress))` + **turbulence** v chaotické fázi:
  přidej per-particle deterministický offset (např. z pseudonáhodného seedu odvozeného od indexu
  — **ne `Math.random()` v loopu**), který je 0 na obou koncích a maximální kolem 55–60 %.
  Tohle je to, co dělá „částice hledají novou pozici".
- Barva: lerp RGB mezi source a target.
- Velikost částice: mírně naroste v chaotické fázi (0.9 → 1.6 px * DPR), aby chaos působil
  hustěji.
- Kreslení: **jeden `fillRect` per částici** (rychlejší než `arc`), nebo — lépe — zápis přímo
  do `ImageData` bufferu a jediný `putImageData` per frame. Změř oba a nech rychlejší.

### Scroll driving

- ScrollTrigger (z `lib/motion.js`) se `scrub: true` a **pinnutá sekce** — tady pinning
  smysl má (na rozdíl od informačních sekcí). `pin: true`, délka `+=150%`.
- Progress zapiš do proměnné, kterou čte rAF loop. **Nekresli přímo z onUpdate** — oddělené
  vlákno progressu a renderu je stabilnější.

### Performance

- `devicePixelRatio` **cap na 2**.
- Canvas velikost odpovídá layoutu, ne obrázkům; na resize znovu navzorkuj (debounce 250ms).
- rAF loop **zastav**, když sekce není ve viewportu (`lazy-init.js` `onExit`).
- Cílový framerate 60 fps na středním notebooku. Pokud se nedaří, sniž grid na 120×120
  a zapiš do `progress.md` — **nezaváděj PixiJS** bez rozhodnutí zadavatele.
- Celkový JS **< 5 KB gzip**.

### Assety

`pbr-render` (`pbr.png`) = Blender strana. `gan-output` (`GAN_output.png`) = GAN strana
(pokud je to grid, vezmi jednu buňku — crop při `drawImage`). Viz [../assets.md](../assets.md) §2.5.
Oba assety jsou dostupné → **tento prvek nedegraduje**.

Načti je jako `<img>` s `decode()` await před inicializací; dokud nejsou dekódované,
zobraz statický Blender render (žádný prázdný canvas).

---

## Fallbacky (povinné)

### `prefersReducedMotion()` nebo touch zařízení

**CSS crossfade dissolve s grid fragmentation** — žádný particle systém:
- Dvě překryté `<img>` vrstvy (Blender / GAN)
- Přechod jako **grid fragmentace**: CSS grid ~12×12 dlaždic, každá s vlastním `transition-delay`
  odvozeným od pozice (nebo `mask-image` s dlaždicovým gradientem), scroll-driven opacity
- Na reduced-motion **bez scroll scrubu** — jen statické zobrazení obou snímků vedle sebe
  s labely `Blender · physical render` a `GAN · generated` a textem uprostřed
- Canvas v tomto režimu vůbec nevytvářej (žádný mrtvý element, žádný načtený rAF)

### Slabé GPU / nízký framerate

Změř prvních ~30 frames; pokud průměr < 30 fps, přepni na CSS crossfade fallback za běhu
a zapiš `console.debug` (ne warning do produkce).

---

## Přístupnost

- Canvas `aria-hidden="true"`.
- Sekce obsahuje textovou alternativu v `.sr-only`: co se zobrazuje a co to znamená
  (Blender render se transformuje do GAN výstupu — dvě generace syntetických dat).
- Text uprostřed timeliny je **reálný DOM element**, ne kreslený do canvasu — musí být čitelný
  screen readerem a selectovatelný.
- Pinnutá sekce nesmí uvěznit klávesnicovou navigaci — ověř, že Tab projde skrz.

## Akceptační kritéria

- [ ] Scroll plynule řídí všechny 4 fáze; na 0 % je čistý Blender render, na 100 % čistý GAN output
- [ ] V chaotické fázi částice viditelně „hledají" pozici (turbulence), ne jen lineárně letí
- [ ] Barvy částic interpolují mezi oběma snímky
- [ ] Text uprostřed se objeví a zmizí ve správném okně, je to DOM element
- [ ] 60 fps na 1440px viewportu na středním notebooku (změř přes DevTools Performance)
- [ ] rAF loop se zastaví, když sekce opustí viewport (ověř v Performance panelu)
- [ ] Žádný `Math.random()` v render loopu (deterministický efekt, stejný při každém scrollu)
- [ ] Na touch: CSS crossfade fallback, canvas se nevytvoří
- [ ] `prefers-reduced-motion`: statické zobrazení obou snímků + text, žádný canvas, nulový pohyb
- [ ] Pinnutá sekce nerozbíjí scroll ani Tab navigaci; po odscrollování se layout nerozjede
- [ ] `particle-transition.js` < 5 KB gzip
- [ ] `git status` obsahuje jen `PipelineTransition.astro`, `particle-transition.js`, `progress.md`

## Co NEDĚLAT

- **Nepoužij Three.js, PixiJS, ani žádnou particle knihovnu.** Canvas 2D, vanilla.
- Nepoužívej array objektů pro částice — typed arrays.
- Nevolej `Math.random()` v render loopu.
- Nedělej z toho fullscreen fixed overlay, který uživatel nemůže přeskočit.
- Nepinuj sekci delší než `+=150%` — dlouhý pin je frustrující.
- Neimplementuj obsah Blender ani GAN sekce (A4/A5) — jen ten přechod mezi nimi.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, ani na cizí komponenty.
