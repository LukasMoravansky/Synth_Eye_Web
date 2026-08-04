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
| `context_images/Image_5.png` | 4.5 MB | velký render/foto dílu | A1 (hero kandidát) |
| `Synth.Eye - html/Image_004.png` | 3.9 MB | snímek dílu z reálného GUI | A1 / A2 |

**Poznámka:** `Image_5.png` (4.5 MB) a `Image_004.png` (3.9 MB) jsou pro web nepoužitelné
v nativní velikosti — A0 je musí projít pipeline (resize na max 2400px delší strana + AVIF/WebP).

---

## 2. Co chybí — a co s tím

### 2.1 Párové snímky pro Defect Revealer (A4) — ❌ CHYBÍ

**Potřeba:** stejný díl, stejný úhel, stejné osvětlení, verze `clean` a `defected`.

**Degradace (implementuj, dokud pár nedorazí):**
- Použij `Image_004.png` jako `clean` vrstvu.
- Defektní vrstvu vytvoř jako **SVG/CSS overlay** nad clean snímkem: fingerprint residue jako
  radiální `mask` s noise texturou v `--nok` odstínu, olejové skvrny jako blur elipsy.
- Reveal kruh dostane silnější vinětaci a lehký `backdrop-filter: brightness(1.15) saturate(0.8)`,
  aby efekt „UV lampy" fungoval i s syntetickým overlayem.
- Interakční logika (`clip-path: circle()` sledující kurzor) je **identická** jako s reálným párem
  → výměna assetu později je jednořádková změna `src`.

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

### 2.4 GAN výstupy pro Latent Space Navigator (A5) — ❌ CHYBÍ (0 z 50–100)

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
| Defect Revealer | ✅ funkční, syntetický defekt overlay | ✅ plná věrohodnost |
| GUI Demo | ⚠️ 3 snímky místo 6–8 | ✅ plná sekvence |
| Compositing Deconstructor | ⚠️ 5 vrstev, 2 procedurální | ✅ reálné vrstvy z pipeline |
| Latent Navigator | ❌ 1D slider nebo 4×4 grid | ✅ plný 2D navigátor |
| Particle Transition | ✅ použitelné | ✅ |
| Team avatary | ⚠️ iniciály | ✅ |

**Doporučení:** stavět v1 na degradovaných variantách — všechny mají identické API pro pozdější
výměnu assetu. Neblokovat development čekáním na assety. Prioritní dodávka od zadavatele
(podle dopadu): **(1) GAN sada pro navigátor · (2) 6–8 GUI snímků · (3) párové snímky defektu ·
(4) compositing vrstvy · (5) avataři + loga**.
