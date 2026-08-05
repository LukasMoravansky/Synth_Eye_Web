# Hero QA — 2026-08-05

Metoda: build + `astro preview`, headless Chrome přes CDP (vlastní driver, bez nových dependencí).
Měřeno na 1920×1080, 1600×900, 1440×900, 1024×768, 768×1024, 390×844 (skutečný viewport, ne
device emulace), plus hover/pointermove pass, scroll-away/back pass a `prefers-reduced-motion`.

## Verdikt (awwwards optika)

**Před:** hero nefungoval jak zamýšleno. Tři vady na úrovni „shodí hodnocení v prvních 3 sekundách":
světlý šedý obdélník místo vznášejícího se dílu, nečitelný HUD ležící na kovu, a neviditelné logo.
Interaktivita navíc **umírala** po prvním odscrollování.

**Po opravách:** hero drží koncept „inspekční komora" — objekt v kuželu světla, HUD data v tmavých
pásech okolo, kurzor jako sonda s bbox rámováním dílu. Design (fialový accent, mono data, tmavé
téma, velkorysý whitespace) je konzistentní s tokeny.

**Co by porota ještě vytkla** (ne bug, ale strop kvality):
- Nadpis se na desktopu láme na 4 řádky (`Train on / synthetic. / Deploy on / real.`). Je to
  stabilní na všech šířkách a čte se to jako záměr, ale koncept mířil na dvojverší. Řešení by
  vyžadovalo širší textovou kolonu nebo menší H1 — obojí ubere na dopadu. **Ponecháno záměrně.**
- Hero má jediný interakční slovník (parallax + paprsek + kurzor). Konkurence na awwwards obvykle
  přidává scroll-driven transformaci hero → další sekce; koncept ji plánuje („díl se zasune do
  komory"), zatím není implementovaná.
- ~~Nav odkaz „HF" vede na GitHub repozitář GAN.~~ **Opraveno** (H-18).

## Opravené chyby

| # | Sev | Popis | Soubor |
|---|-----|-------|--------|
| H-01 | P0 | **Parallax dílu trvale umřel** po odscrollování a návratu do hera. `raf` se po `cancelAnimationFrame` nenuloval → `if (!raf)` už nikdy nespustil novou smyčku. Ověřeno: transform zůstal identita. | `hero-chamber.js` |
| H-02 | P0 | rAF smyčka běžela **navěky** i po dojezdu do klidu (bez podmínky zastavení) — zbytečná zátěž baterie. | `hero-chamber.js` |
| H-03 | P0 | Fotka čtená jako **světlý šedý obdélník**: radiální maska měla poloměr 72 % a plnou krytí do 52 %, takže na hraně boxu zbylo ~64 % opacity. Nová geometrie 50 %/70 % je na hraně nulová; díl sahá do 66 %, zůstává plně krytý. Doplněn `contrast(1.14) brightness(0.94)` pro separaci kovu od šedého pozadí. | `Hero.astro` |
| H-04 | P0 | Nadpis se po scramble animaci **rozpadl na „D n a"** — `querySelectorAll('span span')` chytal slovní obaly, protože `decodeEl` je sám `<span>`. Selektor je nyní `[data-ch]`. | `hero-chamber.js` |
| H-05 | P1 | Scramble glyfy `█▓▒░` **nejsou v subsetu** Clash Display (U+0000–00FF) → dekódování „blikalo" prázdnem. Nahrazeny ASCII znaky. | `hero-chamber.js` |
| H-06 | P1 | Dekódování rozbíjelo **dělení slov** (`Deploy on r / eal.`), protože zámek šířky znaků udělal z každého znaku inline-block. Znaky se teď obalují po slovech v `nowrap` boxu. | `hero-chamber.js` |
| H-07 | P1 | **Všech 6 HUD fragmentů leželo na kovu** (`hudOverlapPart: 6/6` na všech viewportech) — `--text-muted` na světlém kovu = nečitelné. Stage dostal padding → tmavé pásy nad/pod dílem; 3 fragmenty v horním, 3 v dolním pásu, prostřední padá pod 1200px. Nyní `0/6` overlap všude. | `Hero.astro` |
| H-08 | P1 | Bracket box inspekčního kurzoru **rámoval celou fotku, ne díl** — inspekční systém rámuje objekt. Implementována podpora `data-box` (prop `box` na `Picture` existoval, ale skript ho ignoroval). | `inspection-cursor.js`, `Hero.astro` |
| H-08b | P1 | **Bracket box byl širší než díl.** První měření bbox prahovalo na `>90` a pobralo světelný halo vpravo od dílu (šířka 569 px místo 427 px). Přeměřeno dvěma nezávislými metodami (prahování `>130` + sloupcový/řádkový profil jasu), oba dají hranu na `x 206–628`, `y 169–809` z 980 px cropu → `box="21,17.5,43,65"`. Ověřeno v prohlížeči proti pixelové hraně vykresleného obrázku: odchylka **0–2 px**. | `Hero.astro` |
| H-09 | P1 | Bracket box se **nepřepočítával při scrollu** — `position: fixed` box zůstal na místě, kde byl při `show()`, a při Lenis scrollu s podrženým kurzorem ujel od obrázku. Přepočet v `tick()`. | `inspection-cursor.js` |
| H-10 | P1 | Inspekční paprsek byl **prakticky nevidět** (`rgba(255,255,255,0.15)` + `soft-light`). Zesílen na accent-tónovaný `screen` gradient a dostal stejnou masku jako fotka (jinak u kraje odhalil obdélník). | `Hero.astro` |
| H-11 | P1 | **Logo v navigaci bylo neviditelné** — `logo.svg` je monochrom `#000024` na pozadí `#08080c`. Build generuje vektorovou světlou variantu `logo-light.svg` (`#E8E8EC`). | `build-assets.mjs`, `Nav.astro` |
| H-12 | P1 | CTA „See it in action" bylo **opticky centrované** pod levou kolonou (button dědil `text-align: center`), rozbíjelo levé zarovnání headingu. | `Hero.astro` |
| H-13 | P1 | Hero **přetékal fold**: badge pruh odříznutý na 1024×768 i 1440×900, CTA pod foldem na 768 a 390. Kompaktní režim pro `max-height: 960px` + menší cap dílu na mobilu. Nyní `ctaBelowFold: false` na všech testovaných viewportech. | `Hero.astro` |
| H-14 | P2 | HUD na mobilu se **překrýval sám se sebou** a byl odříznutý. Pod 768px je z overlaye statický 2×2 datový pruh pod dílem. | `Hero.astro` |
| H-15 | P2 | Hodnota `res 1600×1200 RGB` byla **vymyšlená** — reálný logger v `synth_eye_gui_template.html` hlásí `1920x1200`. | `Hero.astro` |
| H-15b | P2 | HUD `bbox [412, 288, 196, 204]` byl také vymyšlený. Nahrazen **skutečnou** pozicí dílu ve zdrojovém 1920×1200 snímku: `[1145, 335, 422, 640]` — konzistentní s `res 1920×1200` vedle. | `Hero.astro` |
| H-18 | P1 | Nav odkaz **„HF" vedl na GitHub** repozitář GAN. Nyní `HuggingFace` → `huggingface.co/LukasMoravansky/Synth-Eye-GAN`. Ověřeno na 390 px: vejde se bez overflow (pravá hrana 370 px). Stejně přesměrována karta „Models on HuggingFace" v sekci Open Source (a zbaven `data-pending`). | `Nav.astro`, `OpenSource.astro` |
| H-16 | P2 | HUD text **narážel do viewfinder rohů** stage; osamocené rohy na mobilu čtou jako omyl → skryty. | `Hero.astro` |
| H-17 | P2 | Dvojitá perspektiva: `perspective(1200px)` v transformu dílu i na `.hero__stage`. | `hero-chamber.js` |

## Opravené chyby nalezené mimo hero (blokovaly hodnocení hera)

| # | Sev | Popis | Soubor |
|---|-----|-------|--------|
| X-01 | P0 | **Horizontální overflow celé stránky na mobilu: 488px při viewportu 390px.** `.gui-card` jako grid item s `min-width: auto` se nesmrskl pod min-content šířku obsahu. Kvůli tomu se dala stránka odscrollovat do strany a hero mělo odříznutou navigaci. Nyní `scrollW == 390`. | `GuiDemo.astro` |
| X-02 | P1 | Horizontální overflow 7px na 1024px: `.blender-grid` mělo `grid-template-columns: 45% 55%` + `gap` → 100 % + gap. Změněno na `fr`. | `PipelineBlender.astro` |
| X-03 | P1 | `deck-layer--4` s `translate(32px)` přetékal viewport — stage šířka nepočítala s odsazením stacku. | `CompositingDeck.astro` |
| X-04 | P2 | ~10× `GSAP target not found` v konzoli při každém načtení — `gsap.from()` na prázdný NodeList u `[data-reveal-group]` bez potomků. Konzole je nyní **čistá**. | `reveal.js` |

## Stav po opravách

| Kontrola | 1920 | 1440 | 1024 | 768 | 390 |
|---|---|---|---|---|---|
| horizontální overflow | ✅ | ✅ | ✅ | ✅ | ✅ |
| HUD překryv dílu | 0 | 0 | 0 | 0 | 0 |
| CTA nad foldem | ✅ | ✅ | ✅ | ✅ | ✅ |
| badge nad foldem | ✅ | ✅ | ✅ | ✅ | ⚠️ (hero 931 vs 844) |

- Parallax po scroll-away/back: **funkční** (ověřeno nenulovým transformem).
- `prefers-reduced-motion`: nadpis se nerozpadá, HUD statický na `opacity 0.85`, counter beze změny. ✅
- Konzole: **0 errorů, 0 warningů**.
- Fonty: Clash Display 700 i Satoshi 400 se skutečně načtou a použijí.

## Neopraveno / k rozhodnutí

1. **Nadpis 4 řádky vs. zamýšlené dvojverší** — viz verdikt výše.
2. **Karta „Dataset on HuggingFace"** (Open Source) míří na HF profil `huggingface.co/LukasMoravansky`,
   protože konkrétní dataset repo zatím neexistuje. Zůstává `data-pending` — chce reálnou URL.
3. **Defekt na hero dílu.** Fingerprint residuum na front side teď HUD vysvětluje
   (`class 99.15 %` + `defect Cls_Fingerprint 92.93 %`), takže to čte jako záměr, ne jako špinavá
   fotka. Původní bod z `assets.md` tím slábne — render čistého dílu už není nutnost.
4. **Scroll transition hero → další sekce** (koncept: „díl se zasune do komory") není
   implementovaná. CTA i scroll vedou tvrdým střihem na Data Gap.
