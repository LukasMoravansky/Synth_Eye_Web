# Assety — inventura, mezery a degradované varianty

> **Toto je nejvážnější riziko plánu v1.** Koncept počítá s ~80–120 obrazovými assety.
> V repozitáři je jich **12**. Bez doplnění se 4 z 11 interaktivních prvků musí degradovat.

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
| `context_images/measurement.png` | 537 KB | díl s kótami — front side | A8 |
| `context_images/measurement_back.png` | 520 KB | díl s kótami — back side | A8 |
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

Tytéž nálezy přepočítané do necropnutého `part-front` (1920×1200) pro Defect Revealer:
objekt `59.6,27.9,22.2,53.4`, defekty `60.3,29.1,7.7,23.3;73.1,34.4,5.1,15.0`.
- **A4 Defect Revealer** — ⏳ stále běží na CSS overlayi nad `part-front`; výměna za reálný pár
  je záměna dvou `slug` hodnot v `PipelineBlender.astro` + smazání `.revealer__defect-overlay`.
- **Hero** — otevřený bod z §1.1 lze zavřít: `part-hero` může jít z `part_clean.png`
  (centrovaný crop), takže hero přestane ukazovat defektní díl.

### 2.2 Snímky pro GUI Demo (A2) — ⚠️ 1 z 6–8

**Potřeba:** 6–8 snímků, mix OK / NOK, ke každému předdefinovaný výsledek, bounding boxy,
confidence score a sada log zpráv.

**Degradace:**
- Postav sekvenci nad **3 stavy** derivovanými z `Image_004.png`:
  `frame-01` (OK, front side), `frame-02` (NOK, fingerprint — s CSS overlayem jako 2.1),
  `frame-03` (OK, back side — použij `measurement_back.png` crop).
- Data drž **kompletně odděleně** v `src/scripts/data/gui-demo-frames.js` jako array objektů
  — doplnění dalších 5 snímků pak znamená přidat 5 položek do arraye, nula změn v logice.
- Bounding boxy a confidence hodnoty vezmi z reálných log zpráv v `synth_eye_gui_template.html`
  (`93.15 %`, `92.93 %`, `99.86 %`) — ne vymyšlená čísla.

### 2.3 Compositing vrstvy (A6) — ❌ CHYBÍ

**Potřeba:** 5 separátních PNG s alfou: `0-background` (zelené pozadí), `1-front-gan`,
`2-fingerprint-gan`, `3-blending`, `4-final-composite` + YOLO label overlay.

**Degradace:**
- Vrstvu 0 vygeneruj jako **CSS** (zelené camera background, `#1a3a1f` range).
- Vrstvy 1 a 2 nahraď cropy z `GAN_output.png`.
- Vrstvu 3 (alpha blending + pressure simulation) reprezentuj jako **procedurální vrstvu** —
  semi-transparentní SVG s radiálním gradientem a `mix-blend-mode: overlay`.
- Vrstvu 4 jako vrstvu 1 + SVG bounding box overlay s monospace labelem.
- Drag/z-index/spring fyzika je na assetech nezávislá → plná funkčnost i v degradovaném stavu.

### 2.4 GAN výstupy pro Latent Space Navigator (A5) — ✅ DOPLNĚNO (80 reálných snímků)

`public/images/gan_generated/Image_0000–0079.png` doplněno 2026-08-04. `scripts/slice-latent.mjs`
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

## 3. Shrnutí pro rozhodnutí

| Prvek | Bez nových assetů | S assety |
|---|---|---|
| Defect Revealer | ✅ funkční, syntetický defekt overlay | ✅ pár dodán 2026-08-05, výměna čeká |
| GUI Demo | ⚠️ 3 snímky místo 6–8 | ✅ plná sekvence |
| Compositing Deconstructor | ⚠️ 5 vrstev, 2 procedurální | ✅ reálné vrstvy z pipeline |
| Latent Navigator | ❌ 1D slider nebo 4×4 grid | ✅ plný 2D navigátor |
| Particle Transition | ✅ použitelné | ✅ |
| Team avatary | ⚠️ iniciály | ✅ |

**Doporučení:** stavět v1 na degradovaných variantách — všechny mají identické API pro pozdější
výměnu assetu. Neblokovat development čekáním na assety. Prioritní dodávka od zadavatele
(podle dopadu): **(1) GAN sada pro navigátor · (2) 6–8 GUI snímků · (3) párové snímky defektu ·
(4) compositing vrstvy · (5) avataři + loga**.
