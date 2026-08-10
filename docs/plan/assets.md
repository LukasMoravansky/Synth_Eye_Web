# Assety — inventura, mezery a degradované varianty

> Stav k datu vytvoření plánu (2026-08-04): koncept počítal s ~80–120 obrazovými assety,
> v repozitáři bylo jich 12, 4 z 11 interaktivních prvků musely degradovat. **K 2026-08-07
> je to vyřešené** — GAN sada, GUI snímky, párové snímky defektu i compositing vrstvy jsou
> dodané a nasazené (viz §3). Jediná zbývající mezera jsou avatary contributorů a loga
> institucí (§2.6). Sekce 1–2 níže jsou dobové záznamy z doby vzniku plánu — ponechány pro
> kontext rozhodnutí, aktuální stav je v §3.

Stav k datu vytvoření plánu: **2026-08-04**.

---

## 1. Co v repozitáři je

| Soubor | Rozměr/velikost | Použití | Přiděleno |
|---|---|---|---|
| `context_images/Logo.png` | 195 KB | logo (dark varianta) | A0 |
| `context_images/Logo_white.png` | 60 KB | logo v navigaci / footeru | A0 |
| `Synth.Eye - html/logo.svg` | 3 KB | **preferovaná** vektorová varianta loga, viewfinder motiv | A0 |
| `context_images/scheme_1.png` | 117 KB | schéma virtualizace HW (Blender pipeline) | A4 |
| `context_images/scheme_2.png` | 335 KB | schéma pipeline | A4 |
| `context_images/scheme_3.png` | 412 KB | schéma pipeline / GAN architektura | A5 |
| `context_images/pbr.png` | 163 KB | PBR render vs. raw geometry | A4 |
| `context_images/GAN_output.png` | 326 KB | GAN výstup (pravděpodobně grid) | A5, A7 |
| `context_images/measurement.png` | 537 KB | ⚠️ **NENÍ díl s kótami** — screenshot celého GUI (1009×634, světlé pozadí, díl ~15 % plochy). Použitelné jen jako **zdroj naměřených hodnot z loggeru** (front side). | — (nepoužito jako obraz) |
| `context_images/measurement_back.png` | 520 KB | ⚠️ totéž pro back side; z loggeru odečtena reálná back sada 61.65 / 40.78 / 6.09 / 25.23 | — (nepoužito jako obraz) |
| `context_images/industry.png` | 2.0 MB | industriální kontext / factory floor | A3 |
| `context_images/Image_5.png` | 4.5 MB | ⚠️ **NENÍ foto dílu** — screenshot celého GUI (3838×2158, světlé pozadí). Nepoužitelné jako hero. | — (nepoužito) |
| `Synth.Eye - html/Image_004.png` | 3.9 MB | **jediné reálné foto dílu** (1920×1200, tmavé pozadí, díl odsazený doprava) | A1 (hero, centrovaný crop) / A2 / A3 / A4 |

**Poznámka:** `Image_004.png` (3.9 MB) je pro web nepoužitelné v nativní velikosti — prochází
pipeline (`scripts/build-assets.mjs`: resize na max 2400px delší strana + AVIF/WebP).

### 1.1 Hero asset — oprava 2026-08-05

Původně byl hero (`part-hero`) omylem generován z `Image_5.png`, což je **screenshot GUI**, ne
foto dílu — v inspekční komoře se tak renderoval světlý panel s Camera View a loggerem.
Opraveno: `part-hero` se generuje z téhož `Image_004.png` jako `part-front`, ale s centrovaným
cropem `{left: 939, top: 166, 980×980}` (bbox dílu ve zdroji je 1144,335 → 1713,977), takže díl
sedí ve středu. Okraje fotky (šedé pozadí, ne `--bg-deep`) splývají s komorou přes radiální
CSS mask v `Hero.astro`.

**Otevřený bod:** díl na téhle jediné fotce **má na front side reálný fingerprint defekt**
(hnědé residuum). Hero tedy neukazuje čistý díl. Pokud to má být „normál", potřebujeme render
čistého dílu (viz prioritní dodávka). Alternativa bez nového assetu: crop jen back side (spodní
polovina je čistá) — ztratíme ale čtení celého dílu.

---

## 2. Co chybí — a co s tím

### 2.1 Párové snímky clean / defected — ✅ DODÁNO 2026-08-05

**Dodáno:** `part_clean.png` + `part_defected.png` v `.claude/context/context_images/`
(1920×1200, stejný díl, stejná komora, stejné osvětlení; defekt = hnědé fingerprint residuum
na horní polovině front side). Slugy `part-clean` / `part-defected`, oba se generují
**společným cropem** `{left: 996, top: 184, 728×910}` — union bbox dílu je v obou snímcích
1145,302 → 1575,976, takže crop drží pár registrovaný a snímky lze překrývat 1:1.

- **A3 Data Gap blok 1** — nasazeno, syntetický `.defect-overlay` odstraněn.

**Změřené detekce v `part-defected`** (v % rozměru cropu 728×910, ne odhad — segmentace
hnědého residua `r > 90 && r-b > 28 && r-g > 10`, spojité komponenty, speckly sloučené
podle vzdálenosti):

| Detekce | Box `l,t,w,h` | Plocha |
|---|---|---|
| `Cls_Obj_Front_Side` (díl, prahování jasu > 110) | `20.5,16.6,58.7,70.4` | — |
| `Cls_Defect_Fingerprint` #1 (vlevo od horního otvoru) | `22.1,18.1,20.2,30.8` | 16 848 px |
| `Cls_Defect_Fingerprint` #2 (vpravo, rozstřelené) | `55.9,25.2,13.3,19.8` | 3 380 px |

Tytéž nálezy přepočítané do necropnutého `part-front` (1920×1200):
objekt `59.6,27.9,22.2,53.4`, defekty `60.3,29.1,7.7,23.3;73.1,34.4,5.1,15.0`.
- **Update 2026-08-06:** samostatný „Defect Revealer" prvek s CSS overlayem, na který se
  tento bod původně vztahoval, zanikl v redesignu `PipelineBlender.astro` (viz
  [blender-redesign-2026-08-06.md](blender-redesign-2026-08-06.md)) — nahradil ho žebřík
  4 příček. Reálný pár `part-clean`/`part-defected` je nasazen v **A3 Data Gap**
  (`DataGap.astro`), ne v Blender sekci. Tento bod je tím vyřešený, jen jinde než plán
  původně čekal.
- **Hero** — otevřený bod z §1.1 lze zavřít: `part-hero` může jít z `part_clean.png`
  (centrovaný crop), takže hero přestane ukazovat defektní díl.

### 2.2 Snímky pro GUI Demo (A2) — ✅ DODÁNO 2026-08-07

**Dodáno:** 15 reálných snímků z `.claude/context/gui_demo/Image_*.png` (reálná inspekční
sada, ne odvozené crops z `Image_004.png`) — `insp-back-01–05` (OK), `insp-front-01–05`
(OK), `insp-defect-01–05` (NOK). Registrace v `build-assets.mjs`, data v
`src/scripts/data/gui-demo-frames.js` (15 objektů, beze změny logiky oproti původnímu
3položkovému arrayi — přesně podle plánu níže). `gui-demo.js` přepsán na bohatší
CAPTURE/ANALYZE/MEASURE/CLEAR flow se SVG kótami a vykreslovaným grafem.

Původní požadavek (6–8 snímků) je tím překonán — sada má 15 a je plně reálná, žádná
degradace nezůstává.

### 2.3 Compositing vrstvy (A6) — ✅ DODÁNO 2026-08-07

**Dodáno:** 4 reálné `lane-a-*` assety z `.claude/context/context_images/lane-a/`
(`background.png` → `lane-a-bg`, `fingerprint-raw.png` → `lane-a-print` přes nový
`negate` krok v `build-assets.mjs`, `fingerprint-alpha.png` → `lane-a-alpha` přes
`alphaKey`, `composite.png` → `lane-a-composite`, hotový výstup compositoru seed 0050).
`CompositingDeck.astro` celý přepsán, žádná CSS zeleň ani procedurální SVG blend —
labely vycházejí z reálně naměřených plates. `compositing-deck.js` nový interakční
model (scrub, drag, label sync) + a11y/reduced-motion handling.

### 2.4 GAN výstupy pro Latent Space Navigator (A5) — ✅ DOPLNĚNO (80 reálných snímků)

`assets-src/gan_generated/Image_0000–0079.png` doplněno 2026-08-04 (do 2026-08-10
v `public/images/gan_generated/`, přesunuto ven — je to vstup pipeline, ne runtime
asset, a z `public/` se zbytečně deployoval). `scripts/slice-latent.mjs`
z nich staví plný 10×8 grid (256×256 webp) do `public/images/latent/`, bilineární crossfade
interpolace mezi reálnými sousedy. Degradace níže (bod 1) je tím vyřešena na plnou verzi.

**Nejvíc závislý prvek.** Bez sady snímků nelze 2D interpolaci postavit vůbec.

**Degradace (dvě úrovně, implementuj tu vyšší, která je možná):**
1. **Pokud `GAN_output.png` je grid** (očekáváno — typický StyleGAN sample sheet): rozřež ho
   build-time skriptem na jednotlivé buňky a postav z nich **menší grid** (např. 4×4 = 16 snímků)
   s bilineární crossfade interpolací. Prvek zůstane 2D navigátorem, jen s hrubším rozlišením.
2. **Pokud je to jeden snímek:** degraduj na **1D seed slider** dle „Rizika" v Tech-stacku —
   horizontální dráha, 4–6 stavů, crossfade. Vizuál latent-space gradient mapy zůstane
   (je to canvas, ne asset), jen navigace je jednoosá.

A5 **musí nejdřív obrázek otevřít a zjistit, která varianta platí**, a zapsat zjištění do `progress.md`.

### 2.5 Pár pro Particle Transformation (A7) — ⚠️ improvizace

**Potřeba:** Blender render + GAN output téhož/podobného dílu.
**Dostupné:** `pbr.png` (Blender strana) + `GAN_output.png` crop (GAN strana). **Použitelné.**
Particle systém čte pixely z `<canvas>` po `drawImage` → rozdílné rozměry se řeší normalizací
na společný grid (doporučeno 160×160 vzorků = 25 600 částic, cap dle DPR).

### 2.6 Avataři contributorů + loga institucí (A10) — ❌ CHYBÍ

**Potřeba:** Roman Parak, Lukas Moravansky, Filip Rusnak; loga INTEMAC a JIC.
**Degradace:** iniciály v monospace v kruhu s `--bg-surface` + `--border` (žádné generované
AI portréty, žádné placeholder avatary z externí služby). Loga institucí jako **textové
wordmarky** v `--text-secondary`, dokud nedorazí SVG.

### 2.7 OG image (A13) — ❌ CHYBÍ
Vytvoří A13 kompozicí: `Image_004.png` + logo + claim „Train on synthetic. Deploy on real."
na `--bg-deep` pozadí, 1200×630.

---
### 2.8 Measurement (A8) — ✅ VYŘEŠENO 2026-08-10, bez nové dodávky

**Problém:** `measure-front` / `measure-back` se generovaly z `measurement.png` /
`measurement_back.png`, tedy ze **screenshotů celé PyQt aplikace ve světlém theme** — ne
z fotek dílu. Do tmavé sekce tím šel světlý panel s loggerem a grafem, díl v něm zabíral
~15 % plochy v levé horní čtvrtině a SVG kóty (hardcoded na x 15/75/35/55) padaly na text
loggeru, ne na díl. Týž případ jako `Image_5.png` u hera (§1, řádek „NENÍ foto dílu").

**Řešení bez nové dodávky:** sekce sedí na snímcích, které už v repu jsou —
`gui_demo/Image_189.png` (front, díl téměř osově zarovnaný, zahloubené díry) a
`gui_demo/Image_001.png` (back, naklopený ~22°, průchozí díra bez zahloubení). Cropy
`270,23 784×980` a `629,0 832×1040` (4:5 u obou, aby přepnutí strany nepřelilo layout) drží
`src/scripts/data/measure-sides.js` a sdílí je `build-assets.mjs` (extract) i `viewBox`
SVG overlaye — kóty jsou v nativních souřadnicích kádru 1920×1200, takže se crop a kóty
nemohou rozejít.

**Reálná back-side data** (otevřená otázka #4 v progress.md) se našla v loggeru na
`measurement_back.png`: `[16:21:37] … on back side` → 61.65 / 40.78 / 6.09 / 25.23 mm,
rotation 90.3°. Nic se nedopočítávalo.

**Volitelný upgrade (ne blocker):** makro snímek dílu z bližší vzdálenosti — na kótování je
ostrá hrana z blízka vždycky lepší než digitální crop z 1920×1200.

---
### 2.9 Results (A9) — ✅ VYŘEŠENO 2026-08-10, bez nové dodávky

**Problém:** evidence grid zůstal na assetech z první vlny, i když sada, kterou potřeboval,
vznikla mezitím. Šest dlaždic obsahovalo: dvakrát týž 3-up list se zapečeným titulkem
„Example outputs:" (`object-position` na něm neměl efekt, protože `.picture-img` má
`height: auto; object-fit: contain`), export slidu `pbr-render`, `part-front` s dílem na
~10 % plochy **a s defektem, přesto označený `OK 99.15 %`**, a dva screenshoty celého
PyQt GUI (`measure-front`/`measure-back` — týž případ jako §2.8). Sekce, která má dokazovat
věrohodnost, tak byla jediné místo webu, kde web sám nemluvil pravdu.

**Řešení bez nové dodávky:** matice 3×2 na assetech, které už v repu jsou —
`gan-front` / `gan-composite` / `gan-back` (340² cropy z GAN redesignu 08-06, bez titulku)
proti třem novým 800² cropům reálných snímků z komory:

| Slug | Zdroj | Crop (v 1920×1200) |
|---|---|---|
| `evid-front` | `gui_demo/Image_174.png` (= `insp-front-01`) | `418,20 800×800` |
| `evid-defect` | `gui_demo/Image_131.png` (= `insp-defect-01`) | `467,112 800×800` |
| `evid-back` | `gui_demo/Image_001.png` (= `insp-back-01`) | `645,103 800×800` |

Strana 800 srovnává měřítko obou řad (díl plní 79–87 % výšky kádru, v GAN cropech 86–87 %);
cropy jsou centrované na bbox dílu odečtený z `outline` v `gui-demo-frames.js`. Kdo mění
crop, musí přepočítat i bounding boxy v `Results.astro` — jsou to tytéž souřadnice minus
offset cropu, děleno 800. Detaily v progress.md, log „A9-r1".

**Vedlejší efekt:** `gan-output`, `pbr-render` a `part-front` už nedrží žádná komponenta —
viz otevřený bod 6 v progress.md.


## 3. Shrnutí pro rozhodnutí

| Prvek | Stav k 2026-08-04 | Stav k 2026-08-07 |
|---|---|---|
| Defect Revealer (→ nahrazeno A3 Data Gap) | ✅ funkční, syntetický defekt overlay | ✅ reálný pár `part-clean`/`part-defected` — v `DataGap.astro`, ne v samostatném revealeru (ten zanikl v redesignu 08-06) |
| GUI Demo | ⚠️ 3 snímky místo 6–8 | ✅ 15 reálných snímků |
| Compositing Deconstructor | ⚠️ 5 vrstev, 2 procedurální | ✅ reálné vrstvy z pipeline, přesný compositor run |
| Latent Navigator | ❌ 1D slider nebo 4×4 grid | ✅ plný 2D navigátor (80 GAN výstupů) |
| Particle Transition | ✅ použitelné | ✅ |
| Measurement (A8) | ⚠️ screenshot GUI místo dílu (neodhaleno) | ✅ 08-10 makro cropy `gui_demo/Image_189` + `Image_001`, kóty z naměřené geometrie (§2.8) |
| Results (A9) | ⚠️ 2× týž list, export slidu, 2× screenshot GUI (neodhaleno) | ✅ 08-10 matice 3×2: GAN cropy vs. nové `evid-*` cropy reálných snímků, boxy naměřené (§2.9) |
| Team avatary | ⚠️ iniciály | ⚠️ iniciály — stále nedodáno, jediná otevřená položka |

**Zbývá jediná otevřená dodávka:** avatary contributorů (Roman Parak, Lukas Moravansky,
Filip Rusnak) + loga INTEMAC a JIC (§2.6). Všechny ostatní degradace z tohoto dokumentu
jsou k 2026-08-07 vyřešené reálnými assety.
