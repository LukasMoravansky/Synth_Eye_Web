# PipelineBlender — redesign kompozice na rozložených assetech

**Datum:** 2026-08-06 · **Sekce:** `src/components/PipelineBlender.astro` (Akt II, první polovina)
**Status:** návrh k odsouhlasení, kód ještě nenapsán

---

## 1. Co jsem naměřil na assetech (a co z toho plyne)

Všechno níž je změřeno na souborech v `public/images/decomposed_svg/`, ne odhadnuto.
Tři z těch měření mění zadání, takže je čtu jako první.

### 1.1 `scene-blender.png` a `stand-real.jpg` jsou TÝŽ rig — fotka a její dvojče

Nejsilnější nález. Uzavřená komora v Blenderu a fotka reálného standu mají stejný
hliníkový rám, stejnou kameru na stejném příčníku s oranžovými svorkami, stejnou
desku, díl na stejném místě desky, skoro stejný úhel. Po cropu (níž) mají oba
kádry aspect 1.11 a rig v nich zabírá 85–86 % šířky.

To znamená, že **příčku 1 nemusím tvrdit, můžu ji dokázat**: „celá komora existuje
jako digitální dvojče" vedle sebe jako fotka | render téhož zařízení. Divák to
ověří okem, bez naší asistence.

Naměřeno:

```
scene-blender.png  3840×2160  rig bbox x 1454→2738  y  328→1550   (alfa > 32)
stand-real.jpg     1210×908   rig plní kádr, stůl a zeď na okrajích
```

Crop, který oba framingy srovná:

```
scene-twin  extract left 1316 top 239  1560×1400   (aspect 1.114)
stand-real  extract left  105 top   0  1000× 900   (aspect 1.111)
```

### 1.2 `chamber-render.png` (otevřený stage) je jiné zařízení → nepoužiju ho

Zadání varuje, že obě komory se čtou jako dva různé stroje. Souhlasím a řeším to
vyřazením, ne popiskem: otevřený stage má dome light a žádný kryt, uzavřená komora
má stěny a bodové světlo. Kdybych ukázal obě, sekce začne otázkou „takže kolik
těch komor máte?" místo tvrzením.

Volím uzavřenou komoru, protože **jen k ní existuje fotka reálné předlohy**.
Otevřený stage by ukázal hardware o něco čitelněji (kamera je v něm větší,
Effilux dome je jednoznačný), ale zaplatil by za to tím, že příčka 1 zůstane
tvrzením. Hardwarové specifikace (Basler, 16 mm, f/4.0, osvětlení) přitom nepotřebují
obraz — jsou to popisky a v novém návrhu jsou nativně v DOM, takže na čitelnosti
kamery v rastru nic nestojí.

`chamber-render.png` tedy do pipeline vůbec nezařadím. Zůstává v repozitáři jako
záloha, kdyby se rozhodnutí přehodnotilo.

### 1.3 `front-untextured.jpg` nejde použít tak, jak je — ale jde z něj složit lepší asset

Měření:

```
front-untextured.jpg  987×1200  pozadí luma 202  min 153  max 227  mean 213
front-render.jpg     1920×1200  pozadí luma  28  min  21  max 244  mean  62
back-untextured.jpg   987×1200  min 177  max 226   ← plochý, díl skoro nerozeznatelný
```

Tři důsledky:

1. Clay pass má **světlé pozadí** (luma 202). Na `#08080c` je to bílý blok. Split
   „levá polovina clay, pravá render" by měl uprostřed skok pozadí 202 → 28 a
   čet by se jako dvě slepené fotky, ne jako jeden díl.
2. `back-untextured` má rozsah luma 177–226 na celém kádru — je to plochá deska
   bez rysů. Zadní strana pro tuhle příčku nepoužitelná.
3. Scroll-driven wipe napříč dílem **není možný**. Clay pass pokrývá x 0→986 z
   kádru 1920, díl leží na x 833→1244. Hrana wipu by se tedy mohla hýbat jen v
   rozsahu 833→986, tj. přes 37 % šířky dílu. Zbylých 63 % clay geometrie
   neexistuje. Kdo chce wipe, musí ho fingovat — nebudu.

**Řešení:** složit z assetů jeden nový. `pbr-front-fingerprint.png` je (naměřeno)
pixelově registrovaný s `front-render.jpg` — týž díl, týž kádr, jen s alfa
kanálem místo pozadí:

```
pbr-front-fingerprint.png  alfa bbox  x 828→1249  y 288→920   center 1039,604
front-render.jpg           luma bbox  x 833→1244  y 288→920   center 1039,604
pbr-back-oxidized.png      alfa bbox  x 828→1249  y 288→920   ← shodné, registrované
```

Takže: vezmu clay pass, **omaskuju ho siluetou dílu** z alfy `pbr-front`, přes
pravou část (x ≥ 986) položím texturovaný cutout z téhož `pbr-front` a celé to
sliju na `--bg-deep`. Výsledek: **jeden díl na tmavém pozadí, levých 37 % holá
geometrie, pravých 63 % broušený hliník s otiskem**. Světlé pozadí zmizí, protože
se maskou odřízne. Hrana splitu prochází přesně skrz obě díry, takže díry jsou
zpola clay a zpola texturované — silueta se tím prokazatelně nemění a příčka 2
(„z geometrie se materiálem stane povrch") je v jednom obraze.

Prototyp jsem vyrobil a prohlédl; čte se čistě. Clay je světle šedá bez rysů,
render je světle šedá s obrábětími kruhy a otiskem — rozdíl nese **přítomnost
detailu, ne tón**, což je přesně to tvrzení.

### 1.4 Dlaždice: crop je možný a rotační variabilitu neubere

Naměřené bboxy dílu (saturace > 26 nebo luma > 95, tedy díl i zapečený bbox):

```
front-01 c 280,161   front-02 c 198,148   front-03 c 353,179   front-04 c 269,139
front-05 c 247,114   front-06 c 184,190   front-07 c 351,116   front-08 c 326,182
back-01  c 347,183   back-02  c 266,188   back-03  c 172,138   back-04  c 325,180
back-05  c 314,145   back-06  c 239,178   back-07  c 242,169   back-08  c 309,133
```

Díl je v kádru 480×300 velký ~120×170 px, tedy 11 % plochy — bez cropu drobek.
Crop **200×250 na naměřený střed, clampnutý do kádru** posadí díl na ~68 % výšky
rámu. Rotace (a ta je v dlaždicích výrazná, ±25°) zůstává, u pár dlaždic clamp
navíc nechá díl mimo střed, takže i zbytek pozičního rozptylu je vidět.

Tvrzení „náhodná pozice v kádru" se tím z obrazu částečně ztrácí. Nechávám ho
nést mono readoutem u mřížky, ne rastrem — v thumbnailu 480×300 zobrazeném na
~150 px by ho stejně nikdo nepřečetl.

Defektní cropy jsou naměřeno 212–236 × 316–332 a díl v nich plní 83 % kádru →
crop nepotřebují, jen malé nativní zobrazení.

### 1.5 Zapečené bboxy jsou v dlaždicích rohové závorky

Front dlaždice mají modré, back oranžové, defektní cropy magentový uzavřený rámeček
plus poloprůhlednou výplň. Rohové závorky jsou **stejný vizuální jazyk jako
`.viewfinder` a inspection cursor** na zbytku webu — dlaždice tedy sedí do stránky
bez našeho zásahu. A jak zadání říká: vlastní overlay přes ně nekreslím.

### 1.6 Kolize se sekcí, která je hned nad touhle

`DataGap.astro` už dnes obsahuje:

* pětifázovou scroll-driven sekvenci `cad-solid → cad-pbr → cad-light → cad-render`,
  tj. **geometrie → materiál → světlo → render**, pinned na celou obrazovku;
* statistiky **`6,000 images` / `0 manual labels` / `< 1 hr`**.

Obojí je to, co zadání chce v příčce 2 a 3. Tvrzení „6000 syntetických snímků,
anotace zadarmo" tedy na webu už je — jen jako čísla bez obrazu, o sekci výš.

Neřeším to vypuštěním příčky (zadání ji chce a je správná), ale rozdělením role:

| | DataGap (nad) | PipelineBlender (tady) |
|---|---|---|
| geometrie → materiál | **proč**: díl ještě neexistuje, stačí CAD. Časová sekvence 5 fází, pinned | **jak**: jeden díl, půl geometrie / půl materiál, staticky, plus dva materiály z jedné geometrie |
| 6 000 / 0 labelů | **nárok**: countery, žádný obraz | **důkaz**: 22 reálných snímků s zapečenými bboxy, čísla jen jako readout u mřížky |

Rozdíl mezi „nárok" a „důkaz" je to, co druhé zobrazení ospravedlňuje. Pokud ho
nepovažuješ za dost silný, alternativa je vyhodit countery z DataGapu a nechat
čísla jen tady — to je ale zásah do jiné sekce, tak ho nedělám bez pokynu.

---

## 2. Varianty kompozice

Ve všech variantách platí: žádný rastr se zapečeným textem, šipkou ani rámečkem;
`scheme-hw` a `pbr-render` ze sekce mizí; existující `.ab` blok zůstává.

### Varianta A — „Žebřík" (doporučená)

Jedna sekce, jeden `<h2>`, čtyři očíslované příčky na společném svislém railu.
Rail je stejný prvek jako `.cad-steps` v DataGapu (1px linka, mono index, puntík),
takže „kroky jednoho argumentu" tvrdí layout, ne caption.

```
┌ First principles: physical simulation ─────────────────────────────────────┐
│                                                                            │
│ │ 01  VIRTUALIZATION                                                       │
│ │     The chamber exists twice.                                            │
│ │     ┌──────────────────┐   ┌──────────────────┐                          │
│ │     │ stand-real       │   │ scene-twin       │   camera   Basler acA…   │
│ │     │ (foto standu)    │   │ (Blender)        │   lens     16 mm · f/4.0 │
│ │     │                  │   │                  │   lighting diffuse dome  │
│ │     └──────────────────┘   └──────────────────┘   frame    30×30 extr.   │
│ │      REAL STAND             BLENDER SCENE         renderer Cycles·512spp │
│ │                                                                          │
│ │ 02  GEOMETRY → MATERIAL                        ┌────────┐  ┌────────┐    │
│ │     ┌───────────────┐   Same mesh. The         │mat-front│ │mat-back│    │
│ │     │  material-    │   surface is PBR:        └────────┘  └────────┘    │
│ │     │  split        │   albedo · roughness      brushed      oxidized    │
│ │     │  ╎            │   normal · anisotropy     aluminium    steel       │
│ │     │  ╎ (1px accent│                                                    │
│ │     └──╎────────────┘   ← nativní SVG dělící linka + popisky             │
│ │      GEOMETRY │ PBR MATERIAL                                             │
│ │                                                                          │
│ │ 03  SCALE  ← vizuální vrchol, mřížka jde do plné šířky containeru         │
│ │     8× front (modrý bbox)  ▏ 6 000 frames                                │
│ │     ▢▢▢▢▢▢▢▢                ▏ 2 sides · procedural defects               │
│ │     ▢▢▢▢▢▢▢▢  8× back      ▏ randomized pose · lighting                  │
│ │     ▢▢▢▢▢▢  6× defect crop ▏ 0 manual labels                             │
│ │     „Every box in these frames was written by the generator."            │
│ │                                                                          │
│ │ 04  PAYOFF — existující .ab blok (compare-real | bridge | compare-render) │
│ ●     nezměněný, blender-bridge.js dál běží                                │
└────────────────────────────────────────────────────────────────────────────┘
```

**Vizuální vrchol je 03**, a nesou ho hustota a šířka: je to jediný prvek, který
jde do plné šířky containeru, jediný s 22 obrazy a jediný, kde se opakování samo
stává obsahem. Příčka 04 je záměrně tichá a úzká (820 px, dva kádry, čísla) —
argumentační dopad sekce je tam, vizuální crescendo o příčku dřív. Kdyby 04 bylo
taky velké, obě by si konkurovaly a ani jedno by nevyhrálo.

**Jak 02 nekoliduje s 04:** liší se ve třech osách zároveň, ne v jedné.
02 je **jeden objekt s hranou uvnitř** (jeden kádr, dělící linka, poměr 0.78),
04 jsou **dva samostatné kádry s bridgem mezi nimi** (poměr 0.78 každý, celkem
široké). 02 mluví o povrchu (`albedo · roughness · normal`), 04 o detektoru
(`Cls_Obj_Front_Side 99.02 % / 98.94 %`). 02 nemá inspection overlay, 04 ho má na
obou kádrech. Divák je nemůže splést za „zase dva obrázky vedle sebe", protože
02 dva obrázky vedle sebe nejsou.

**Mobil (≤ 768px):** rail se překlopí na levý okraj s menším odsazením; 01 se
stackuje (fotka nad renderem, tam je srovnání pořád čitelné, jen delší);
02 se stackuje (split kádr, pod ním text a dva material chipy vedle sebe);
03 mřížka 4 sloupce místo 8, defektní řádek 3 sloupce, readout nad mřížkou;
04 zůstane, jak je (`.ab-pair` už má 1fr 1fr fallback).
Na 360 px vychází dlaždice ~74 px — díl v ní ~50 px, čitelný jako „díl se
závorkami", což je v mřížce vše, co má nést.

**JS:** nulový nový soubor. Mřížka se odkrývá existujícím `data-reveal-group` /
`data-reveal` staggerem z `lib/reveal.js`. Potřebuje to dvouřádkovou úpravu
`reveal.js`, aby group mohla přebít stagger atributem (`data-reveal-stagger`) —
22 položek × 0.08 s = 1.76 s je na vlnu moc, 0.03 s dá 0.66 s a čte se to jako
dávka generování. `prefers-reduced-motion` fallback už v `reveal.js` je.
`blender-bridge.js` zůstává nedotčený.

### Varianta B — dvě pod-sekce s vlastními nadpisy

`3a-i The digital twin` (příčky 1–2) a `3a-ii Generation at scale` (příčky 3–4),
každá s `<h3>`, mezi nimi velký whitespace.

Víc vzduchu a lepší kotvy pro navigaci. Ale rozřízne to argument přesně v místě,
kde se láme („komoru máme věrnou" → „a teď z ní uděláme 6000 vzorků"), takže
druhá polovina začíná znovu a divák ji smí přeskočit jako samostatné téma.
Zadání navíc chce, aby čtyři příčky byly čitelné jako **kroky jednoho argumentu** —
dva nadpisy dělají dvě argumenty. Nadpisy `<h3>` navíc dnes v Aktu II patří
DataGapu; PipelineBlender má jen `<h2>` a přidání `<h3>` úrovně by mu změnilo
váhu vůči GAN sekci pod ním, která `<h3>` taky nemá.

### Varianta C — pinned stage, vizuál se přepíná pod scrollem

Jedna přilepená scéna, ve které se vyměňuje obraz, zatímco text příček projíždí.

Zamítám ze dvou konkrétních důvodů. (1) `DataGap` blok 2 tenhle vzorec vlastní a
je **o jednu sekci výš** — dvě pinned stage v řadě se čtou jako jedna rozbitá.
(2) Čtyři příčky mají neslučitelné poměry stran: 1.11 (pár komor), 0.78 (split),
široká mřížka, 820px pár. Jeden pinned rám by tři ze čtyř letterboxoval, nebo by
musel měnit velikost pod scrollem, což je layout shift jako efekt.

### Volba: A

B odmítám kvůli rozříznutí argumentu, C kvůli kolizi s DataGapem a kvůli poměrům
stran. A drží čtyři příčky v jednom čtení, dává vrcholu (03) plnou šířku,
nechává 04 doslova nedotčené a nepřidává ani jeden KB JS.

---

## 3. Assety k přidání do pipeline

Zdroje se zkopírují do `.claude/context/context_images/decomposed/` (zachová se
struktura podsložek), pak `npm run assets`. 27 nových záznamů:

| slug | zdroj | recept |
|---|---|---|
| `stand-real` | `pipeline-synthetic/stand-real.jpg` | crop 1000×900 @ 105,0 · max 1200 |
| `scene-twin` | `pipeline-synthetic/scene-blender.png` | crop 1560×1400 @ 1316,239 · max 1400 · flatten |
| `material-split` | `render-comparison/front-untextured.jpg` | **compose** (viz níž) · crop 700×900 @ 689,154 · max 1000 · flatten |
| `mat-front` | `hw-virtualization/pbr-front-fingerprint.png` | crop 470×690 @ 804,259 · max 560 · flatten |
| `mat-back` | `hw-virtualization/pbr-back-oxidized.png` | týž crop (registrované) · max 560 · flatten |
| `synth-front-01…08` | `pipeline-synthetic/front-0N.jpg` | crop 200×250 na naměřený střed, clamp · max 250 |
| `synth-back-01…08` | `pipeline-synthetic/back-0N.jpg` | dtto |
| `synth-defect-01…06` | `pipeline-synthetic/defect-0N.jpg` | bez cropu (díl plní 83 %) · max 340 |

Žádný `upscale` nikde → nic se nezvětší nad nativní rozlišení.

**Nová volba `compose` v `build-assets.mjs`** — jednoúčelová, stejně jako dnes
`alphaKey`. Běží před `crop`, ve zdrojových pixelech:

```js
compose: {
  alphaFrom: <path>,  // odkud vzít alfu = silueta dílu (pbr-front)
  over:      <path>,  // co položit vpravo od splitu (pbr-front, texturovaný)
  splitX:    986,     // = šířka clay half-frame; hrana prochází skrz díry
}
```

Do `recipe` hashe půjdou i `mtime` obou compose zdrojů, aby se cache invalidovala
i při jejich změně.

**Odchod:** `scheme-hw` (ze `scheme_1.png`) po tomto redesignu nikdo nepoužívá →
záznam z `ASSETS` vypadne a `public/images/scheme-hw.*` se smaže. `pbr-render`
v `ASSETS` **zůstává** — používá ho ještě `Results.astro:7`. (Mimochodem: i tam
je to export slidu se zapečeným textem. Mimo rozsah tohohle úkolu, ale je to
další kandidát na totéž.)

---

## 4. Otevřená otázka (potřebuju jedno konkrétní číslo)

Readout u mřížky v příčce 03 má tvrdit rozsah datasetu. Umím napsat `6 000 frames`,
protože to je číslo, které už používá DataGap. Nevím ale, **jak je to 6 000 rozdělené
mezi front / back / defektní varianty** — a mřížka ty tři skupiny ukazuje odděleně
(8 modrých, 8 oranžových, 6 magentových), takže se u nich readout přirozeně čte
jako „a těchhle je celkem N".

Bez čísel to napíšu bez rozpadu, tj. jen `6 000 frames · 2 sides · 0 manual labels`
a u skupin nechám čistě popisky (`front side`, `back side`, `fingerprint defect`)
bez počtů. Funguje to, jen je to slabší. Pokud ta čísla znáš, doplním je.

---

## 5. Akceptační kritéria — jak je varianta A splní

| Kritérium | Jak |
|---|---|
| žádný zapečený text/šipka/rámeček v rastru | `scheme-hw` i `pbr-render` ze sekce odcházejí; nové assety jsou čisté rendery/fotky. Zapečené jsou jen YOLO bboxy v dlaždicích — to je datový obsah, ne popisek |
| čtyři příčky jako kroky jednoho argumentu | společný rail s mono indexy 01–04, jeden `<h2>`, jedna sekce |
| „6 000 snímků, anotace zadarmo" vizuálně podložené | 22 reálných snímků se zapečenými bboxy + readout + caption „every box … written by the generator" |
| `.ab` blok a `blender-bridge.js` | doslova nezměněné, jen zabalené do příčky 04 |
| žádný drobek v prázdném kádru | crop u všech assetů, kde díl zabíral < 25 % (dlaždice, `mat-*`, `material-split`); změřené hodnoty v komentářích |
| nic nad nativní rozlišení | žádný `upscale`; `max` u všech ≤ nativní delší strana |
| bez layout shiftu | všechno přes `<Picture>` (width/height z `images.json` + LQIP), kádry mají `aspect-ratio` |
| klávesnice a odečítač | rail je `<ol>`; popisky v DOM; `alt` u každého obrazu; readout jako text, ne `aria-hidden` dekorace; u dlaždic `alt` popisující stranu a bbox |
| bez horizontálního overflow na 360 px | mřížka `grid-template-columns: repeat(4, 1fr)` s `minmax(0, 1fr)`, žádné `%` součty jako ve staré `.blender-grid` |
| `prefers-reduced-motion` | jediná animace je reveal stagger, který má fallback v `lib/reveal.js` |

---

## 6. Co po odsouhlasení

1. kopie zdrojů do `.claude/context/context_images/decomposed/`
2. `compose` + 27 záznamů do `build-assets.mjs`, `npm run assets`
3. `data-reveal-stagger` do `lib/reveal.js` (2 řádky)
4. přepis `PipelineBlender.astro`
5. `npm run build` + průchod na 360 / 768 / 1366 / 1920 px
6. zápis do `docs/plan/progress.md`
