# Synth.Eye — Koncept prezentačního webu v2.0
 
> Verze 2.0 — aktualizovaný koncept po design review. Přepracovaný hero, nové interaktivní prvky, odstraněn preloader, přidány prostorové přechody.
 
---
 
## Centrální narativní linka: „Naučit stroj vidět bez jediného reálného defektu"
 
Web nevypráví příběh softwaru. Vypráví příběh **problému a jeho překonání** — ve třech aktech:
 
1. **Akt I — Slepá skvrna průmyslu:** Firmy vyrábějí díly, ale nemají data na to, aby je mohly automaticky kontrolovat. Reálné defekty jsou vzácné, drahé na výrobu, a nedají se škálovat.
2. **Akt II — Dvě cesty k syntetickým datům:** Nejdřív fyzikální simulace (Blender), pak generativní sítě (GAN). Dvě generace řešení, jedno řemeslo — vytvořit data, která neexistují.
3. **Akt III — Stroj, který vidí:** Real-time inspekce, měření, rozhodování. Trénováno na syntetice, nasazeno na realitě. A funguje to.
 
---
 
## Průřezové interaktivní prvky
 
Tyto prvky existují **napříč celým webem**, ne jen v jedné sekci. Definují interaktivní identitu webu.
 
### Inspection Cursor
 
Kurzor se po celém webu chová jako inspekční sonda. Kdykoli uživatel přejede přes jakýkoli obrázek dílu (v jakékoli sekci), objeví se:
- Viewfinder overlay (kruhový highlight kolem kurzoru)
- Confidence score v monospace fontu
- Bounding box s classification labelem (`Cls_Obj_Front_Side 99.15%`)
 
Tohle vytváří konzistentní interaktivní vrstvu přes celý web a neustále reinforcuje core message: „stroj, který vidí." Není to omezené na jednu sekci — je to identita webu.
 
**Technická realizace:** Custom cursor element, event listener na všechny `[data-inspectable]` obrázky. Confidence scores a labely předpřipravené jako data atributy.
 
### Viewfinder Motiv
 
Opakující se vizuální motiv odkazující na logo:
- Rohové závorky `⌜ ⌝ ⌞ ⌟` jako dekorativní rámečky kolem obrázků a klíčových sekcí
- Crosshair / target marker na hover nad inspekčními snímky
- Tenká viewfinder linie v interaktivních prvcích
 
### Jemný Grain Overlay
 
Celostránkový, velmi jemný noise grain (opacity 0.03–0.05). Dodává industriální haptický pocit, eliminuje „příliš čistý digitální" look. Statický, ne animovaný.
 
---
 
## Struktura sekcí a scroll flow
 
### ═══════════════════════════════════════
### ~~SEKCE 0 — PRELOADER~~ (ODSTRANĚN)
### ═══════════════════════════════════════
 
~~Původní koncept: terminálový boot-up.~~
 
**Odstraněno.** Terminálový preloader je v roce 2026 vyčerpaný motiv (Linear, Warp, Raycast — všichni to dělali). 2–3 sekundy nucené čekání zvyšuje bounce rate. Industriální tón nastavíme přímo v hero — zážitkem, ne simulací.
 
Web startuje okamžitě — hero se načte s minimální skeleton animací (fade-in dílu, reveal textu).
 
---
 
### ═══════════════════════════════════════
### SEKCE 1 — HERO: „INSPECTION CHAMBER"
### ═══════════════════════════════════════
 
**Koncept: Fullscreen Inspection Chamber**
 
Celý hero JE inspekční komora. Návštěvník interaguje s inspekčním systémem ještě dřív, než přečte první řádek textu. Žádný vysvětlující text není potřeba — zážitek vysvětluje sám sebe.
 
**Vizuální kompozice:**
 
- **Pozadí:** Plný viewport, `#08080c`, jemný grain overlay
- **Centrální objekt:** Fotorealistický snímek dílu „vznášející se" ve středu — ne jako flat obrázek, ale s jemnou 3D perspektivou. Díl reaguje na pohyb myši: jemně se natáčí (±5° parallax)
- **Inspekční paprsek:** Z kurzoru vychází kruhový highlight, který osvětluje povrch dílu pod kurzorem. Kurzor = inspekční sonda
- **Datové fragmenty:** Kolem dílu se postupně (ne najednou, ale jako staggered reveal) objevují datové fragmenty v monospace: confidence scores, bounding box koordináty, class labels. Polo-transparentní, evokují HUD inspekčního systému
- **Spodní odraz:** Pod dílem subtle reflection/glow na „podlaze" inspekční komory
- **Viewfinder brackets:** V rozích dílu/viewportu rohové závorky z loga
 
**Heading — kinetická typografie:**
 
Nad dílem, rozložený do prostoru. Velký, kinetický:
 
> **Train on synthetic.**
> **Deploy on real.**
 
Spodní řádek se skládá z písmen, která se „sestaví" z fragmentů — kinetická typografie evokující proces skládání syntetických dat. Ne přelet z různých stran, ale spíše: písmena vznikají z noise/static a ustálí se do čitelné formy.
 
Pod headingem jedno číslo, které se animovaně napočítá:
 
> **99.15% accuracy — zero real labels**
 
**Navigace:** Minimální — logo vlevo, „GitHub" a „HuggingFace" vpravo. Nic víc.
 
**CTA:** Ne tlačítko, ale text s šipkou dolů: *„See it in action"* — s jemným pulzujícím pohybem.
 
**Scroll transition:** Klik nebo scroll spustí plynulý přechod: díl se „zasune" do inspekční komory (viewport se zmenší a může se transformovat směrem k camera view GUI dema v pozdější sekci). Hero se nestane minulostí — transformuje se v další sekci.
 
**Proč tohle funguje:**
 
Okamžitě komunikuje o čem projekt je — ne slovy, ale zážitkem. Hover kurzorem přes díl = „inspekce." Confidence scores plovoucí kolem dílu = „AI analýza." Tmavé pozadí s jedním osvětleným objektem = „inspekční komora."
 
**Pod hero:** Jemný horizontální pruh s logy / badges: MIT License · INTEMAC · JIC · Open Source. Bez zbytečného vizuálního šumu.
 
---
 
### ═══════════════════════════════════════
### SEKCE 2 — PROBLÉM: „THE DATA GAP"
### ═══════════════════════════════════════
 
**Narativní záměr:** Než ukážeme řešení, musíme vybudovat napětí. Proč to vůbec někdo dělá?
 
**Layout:** Tmavá sekce, editorial styl — ale ne generic „text vlevo, obrázek vpravo." Každý blok má vlastní vizuální treatment a prostorový přechod.
 
**Tři bloky — scroll-driven, každý s vlastním interaktivním momentem:**
 
#### Blok 1 — „Reálné defekty jsou vzácné"
 
> V kvalitní výrobě se defekty vyskytují v jednotkách procent. Abyste natrénovali AI model na detekci otisků prstů na kovovém dílu, potřebujete stovky až tisíce defektních vzorků. Vyrábět je záměrně je drahé a neškálovatelné.
 
**Vizuál:** Dva díly vedle sebe — čistý a defektní. Pod nimi se scrollem vyplňuje poměrový bar: `1 defect : 130 clean parts`. Bar se plní zleva (zelená) a teprve na samém konci zablikne červený pixel. Vizuální zdůraznění nepoměru.
 
#### Blok 2 — „Produkt nemusí ještě existovat"
 
> Co když chcete inspekční systém připravit ještě před zahájením výroby? Před první šarží? Na díl, který zatím existuje jen jako CAD model?
 
**Vizuál:** CAD wireframe dílu se scrollem plynule transformuje do fotorealistického renderu. Parallax vrstvy — wireframe, textury, osvětlení se postupně „nanášejí" na geometrii. Scroll řídí fázi transformace.
 
#### Blok 3 — „Ruční anotace je bottleneck"
 
> Každý obrázek potřebuje bounding box, label, quality check. To jsou hodiny manuální práce. Synth.Eye generuje data i anotace automaticky.
 
**Vizuál:** Animovaný counter — tři čísla vedle sebe:
 
```
6,000           0              < 1 hr
images       manual labels    generation time
```
 
Countery se scroll-triggered animovaně napočítají. Prostřední nula zůstane velká a výrazná — vizuální důraz na „zero."
 
---
 
### ═══════════════════════════════════════
### SEKCE 3 — ŘEŠENÍ: DVĚ GENERACE
### ═══════════════════════════════════════
 
**Narativní záměr:** Příběh evoluce — ne „verze 1 nahrazena verzí 2," ale dva přístupy ke stejnému problému.
 
**Narativní framing:**
 
> Blender řekne: *„Vím přesně, jak realita vypadá, a zrekonstruuji ji od nuly."*
> GAN řekne: *„Ukažte mi 130 příkladů a já se naučím, co je v nich společné — a vygeneruju tisíce nových."*
 
Blender = **first principles** (fyzikální zákony, optika, materiály). GAN = **statistical learning** (distribuce, vzory, variace).
 
**Vizuální shift:** Blender část je více „engineered" (schémata, wireframy, fyzikální diagramy). GAN část je více „organic" (gridy generovaných obrázků, noise→image transition, latent space).
 
---
 
#### Sub-sekce 3a — Blender Pipeline
 
**Layout:** Levá strana: schéma virtualizace HW (scheme_1.png, přestylované pro web). Pravá strana: výstup — fotorealistický render vs. raw geometry (pbr.png koncept).
 
Klíčová zpráva: *„Virtualizujeme celou inspekční komoru — kameru, objektiv, osvětlení, materiály. Fyzikální renderování v Blenderu vytváří snímky nerozlišitelné od reality."*
 
**Interaktivní prvek — DEFECT REVEALER**
 
~~Původní koncept: klasický before/after split slider.~~
 
**Nahrazeno Defect Revealerem.** Split slider je generický prvek (before/after srovnání se používá na restaurátorských službách, retušovacích webech, AI upscalerech). Defect Revealer je dramaticky silnější:
 
- Uživatel vidí čistý kovový díl
- Při pohybu kurzoru nad dílem se **v kruhovém radiusu kolem kurzoru** odhalují defekty pod povrchem — fingerprint residue, olejové skvrny, stopy obrábění
- Jako UV lampa na forenzní analýze
- Vizuální metafora: „defekty jsou všude, jen je nevidíte — dokud nemáte správný nástroj"
 
**Technická realizace:** Dva překrývající se obrázky — clean a defected. Horní (clean) má `clip-path: circle()` kolem kurzoru, který invertuje mask (nebo mask na spodním defected vrstvě). Kurzor řídí pozici a případně i velikost reveal area.
 
Pod Defect Revealerem: *„Can you spot the defect? The AI can. Every time."*
 
> **Poznámka k assetům:** Potřebujeme párové snímky — stejný díl, stejný úhel, čistý vs. defektní. Pokud nemáme pixel-perfect pár, použijeme „similar view" s vizuální stylizací (lehký blur na přechodu).
 
---
 
#### Transition: Blender → GAN — „Particle Field Transformation"
 
**Prostorový přechod mezi érama.** Ne hard cut, ne fade.
 
Obrázek vyrenderovaný v Blenderu se scroll-driven **rozloží na tisíce částic** — a ty se přeuspořádají do GAN výstupu. Vizuální metafora: „stejná data, jiný způsob jejich vzniku."
 
Scroll řídí rychlost transformace:
- Pozice 0%: Blender render (celistvý obrázek)
- Pozice 30%: obrázek se začíná rozpadat na pixelové částice
- Pozice 60%: chaotický stav — částice „hledají" novou pozici
- Pozice 100%: GAN output (nový celistvý obrázek)
 
Uprostřed timeliny krátký text: *„What if instead of simulating physics… you let the machine learn what reality looks like?"*
 
**Technická realizace:** Canvas/WebGL particle system. Každý pixel zdrojového obrázku = jedna částice. Interpolace pozic mezi source a target. GSAP ScrollTrigger řídí progress. Alternativa pro nižší výkon: CSS dissolve s grid fragmentation.
 
---
 
#### Sub-sekce 3b — GAN Pipeline
 
**Layout:** Shift v designu — data-driven vizuální jazyk.
 
**1. GAN Architecture Diagram**
 
Zjednodušený, ne akademický. Tři generátory (front / back / fingerprint) → compositor → labeled output. Animovaný flow — data „tečou" diagramem při scrollu.
 
**2. Latent Space Navigator**
 
~~Původní koncept: jednoduchý slider pro seed.~~
 
**Nahrazeno 2D Latent Space Navigatorem.**
 
Celý 2D prostor — uživatel pohybuje bodem v latent space (vizualizovaném jako 2D mapa/gradient field) a v reálném čase se mění generovaný obrázek.
 
- Předpřipravených 50–100 snímků interpolovaných na gridu
- Smooth blending mezi nejbližšími 4 snímky v gridu
- Vizuálně evokuje „nekonečnou variabilitu z jednoho modelu"
- Pod navigátorem: `seed: {dynamická hodnota} → unique composite`
 
**Technická realizace:** 2D canvas s gradient mapou. Mouse position = interpolační souřadnice. Bilineární interpolace mezi 4 nejbližšími předpřipravenými snímky (crossfade opacity). Snímky předgenerované offline.
 
**3. Compositing Deconstructor**
 
~~Původní koncept: scroll-driven layer reveal.~~
 
**Nahrazeno interaktivním Deconstructorem.**
 
Uživatel může libovolnou vrstvu kompozice **„vytáhnout"** — chytit ji a posunout stranou. Vrstvy se chovají jako fyzické karty naskládané na sobě:
 
- Vrstva 0: Zelené pozadí (camera background)
- Vrstva 1: GAN-generated front side
- Vrstva 2: GAN-generated fingerprint
- Vrstva 3: Alpha blending + pressure simulation
- Vrstva 4: Final composite + YOLO label overlay
 
Když jednu vrstvu odtáhnete, vidíte co je pod ní. Parallax hloubka mezi vrstvami. Každá vrstva má label v monospace popisující operaci.
 
Alternativní interakce: scroll přes sekci postupně „liftuje" vrstvy — ale uživatel může kteroukoli chytit a prozkoumat samostatně.
 
**Technická realizace:** Draggable elements s physics-based spring animation (return to stack). Z-index management. Touch support pro mobilní zařízení. Fallback: scroll-driven postupný reveal.
 
**Tabulka srovnání (vizuální, ne nudná):**
 
Dva sloupce, elegantně stylované karty:
 
| | Blender | GAN |
|---|---|---|
| Rychlost | ~sekund/frame | ~ms/frame |
| Vstup | CAD + fyzikální setup | ~130 reálných fotek |
| Kontrola | Explicitní (parametry scény) | Implicitní (distribuce dat) |
| Výstup | Deterministický | Stochastický |
 
---
 
### ═══════════════════════════════════════
### SEKCE 4 — INTERAKTIVNÍ GUI DEMO
### ═══════════════════════════════════════
 
**Tohle je signature moment celého webu.**
 
**Heading:** *„See what the operator sees"*
**Subtext:** *„This is a simulation of the real Synth.Eye inspection interface. Click CAPTURE and ANALYZE to inspect a part."*
 
**Koncept: „Try the Inspector"**
 
Zjednodušená verze reálné PyQt5 aplikace, přímo v browseru. Ne screenshot — funkční (simulované) rozhraní.
 
**Co funguje (simulované):**
 
- **CAPTURE** — „zachytí snímek" (swapne obrázek v camera view z předpřipravené sady, s krátkým flash efektem simulujícím capture)
- **ANALYZE** — spustí animaci „analýzy":
  - Scanline přejede přes snímek (fialová/bílá, poloprůhledná)
  - Progress indikátor
  - Bounding boxy se overlayují s confidence scores
  - Naskočí OK/NOK výsledek
  - Logger se naplní timestampovanými zprávami
- **MEASURE** — po analýze ukáže rozměrové kóty na dílu s tolerance gauges
- **System Logger** — automaticky loguje timestampované zprávy jako reálná aplikace (monospace, scrollovatelný)
- **Productivity Graph** — po každém CAPTURE+ANALYZE přibude bod na grafu s plynulou animací křivky (bounce efekt na novém bodu). Counter vedle grafu se inkrementuje.
- **CLEAR** — resetuje vše s fade-out animací
 
**Co nefunguje (a je to OK):**
- CONNECT/DISCONNECT — zobrazí tooltip „Connect a Basler camera to use this feature" (= call to action pro reálné použití)
- Není real-time kamerový feed
 
**Technická realizace:**
- Sada 6–8 předpřipravených snímků (mix OK a NOK)
- Sekvence CAPTURE → ANALYZE je scriptovaná — pro každý snímek je předem definovaný výsledek, bounding boxy, confidence scores
- Logger se plní realistickými zprávami (kopie z reálných logů z GUI template)
- Graf se updatuje SVG/canvas animací — křivka se plynule prodlužuje, nový bod „přistane" s bounce efektem
- Responsivní — na mobilu stacked layout
 
**Design:**
Vychází z `synth_eye_gui_template.html`, ale **přestylovaný** do dark theme webu:
- Pozadí karty: `var(--bg-elevated)` (#141418)
- Bordery: `var(--border)` (rgba(255,255,255,0.06))
- Text: light on dark
- Accent barvy zachovat (zelená OK, červená NOK)
- Font: zachovat monospace pro logger a metriky
 
Pod GUI demo: odkaz na GitHub pro reálnou verzi.
 
---
 
### ═══════════════════════════════════════
### SEKCE 5 — MĚŘENÍ (MEASUREMENT)
### ═══════════════════════════════════════
 
**Kratší sekce** — ukazuje, že Synth.Eye není jen detekce, ale i **dimensionální kontrola**.
 
Klíčová zpráva: *„From pixel to millimeter. Every part is measured, every tolerance verified."*
 
**Layout:** Split — vlevo snímek dílu s overlayed kótami (measurement.png přestylované). Vpravo interaktivní tolerance gauges.
 
**Interaktivní prvek — Measurement Precision Gauges**
 
Ne jen tabulka s čísly. Interaktivní vizualizace:
 
- Každý měřený rozměr má „živý" gauge — jehla se scroll-triggered ustálí na hodnotě
- Tolerance band se rozsvítí zeleně (PASS) nebo červeně (FAIL)
- **Kliknutím na konkrétní rozměr** se na snímku dílu rozsvítí odpovídající kóta — propojení dat a vizuálu
- Animace: hodnoty „najíždějí" na tolerance band s fyzikální simulací (overshoot + settle)
 
| Rozměr | Reference | Tolerance | Výsledek |
|--------|-----------|-----------|----------|
| Height | 60.0 mm | ±3.0 mm | 62.08 mm ✓ |
| Width | 40.0 mm | ±3.0 mm | 41.02 mm ✓ |
| Hole ⌀ | 6.0 mm | ±3.0 mm | 6.10 mm ✓ |
| Hole dist. | 25.0 mm | ±3.0 mm | 25.20 mm ✓ |
 
Front-side vs. back-side: přepínací toggle, který mění snímek i měřené hodnoty (front = Hough circles, back = contour analysis).
 
---
 
### ═══════════════════════════════════════
### SEKCE 6 — VÝSLEDKY
### ═══════════════════════════════════════
 
**Layout:** Full-bleed dark sekce, dominují velká čísla.
 
**Tři velké metriky (scroll-triggered animated counters, monospace):**
 
```
>99%                    >95%                    6,000
object classification   defect detection        synthetic images
on real images          on real images          zero manual labels
```
 
Countery se napočítávají s easing animací. Každé číslo má pod sebou krátký context label.
 
**Pod metrikami: Evidence Grid**
 
Ne akademická tabulka — spíš „evidence wall" vibe. Grid syntetických vs. reálných snímků, s labely a confidence scores. Vizuální důkaz, že synteticky trénovaný model funguje na reálných datech.
 
Layout: dvě řady — horní „SYNTHETIC (train)" s generovanými snímky, spodní „REAL (test)" s reálnými snímky + overlayed predictions.
 
**Doplňkový text:** *„Trained entirely on synthetic data. Tested on real production images from the factory floor. No real images were labeled during training."*
 
---
 
### ═══════════════════════════════════════
### SEKCE 7 — OPEN SOURCE + TECH STACK
### ═══════════════════════════════════════
 
**Layout:** Bento grid s kartami.
 
Klíčová zpráva: *„Everything is open. Models, data, code. Fork it, train it, deploy it."*
 
**Karty:**
 
- **Synth.Eye (Blender)** — repo karta: popis, link na GitHub `rparak/Synth_Eye`
- **Synth.Eye GAN** — repo karta: popis, link na GitHub `LukasMoravansky/Synth_Eye_GAN`
- **Models on HuggingFace** — `front.pkl`, `back.pkl`, `fingerprint.pkl` — s velikostmi a resolution
- **Dataset on HuggingFace** — počet obrázků, splits (train/val/test), formát
- **StyleGAN2-ADA fork** — link na `LukasMoravansky/stylegan2-ada-pytorch`
 
Styl karet: tmavé (`var(--bg-surface)`), s jemným borderem, monospace detaily (star count, file sizes), hover efekt (jemný glow v accent barvě — `var(--accent-glow)`).
 
---
 
### ═══════════════════════════════════════
### SEKCE 8 — TÝM + INSTITUCE (FOOTER)
### ═══════════════════════════════════════
 
Kompaktní footer-adjacent sekce.
 
- Avatary contributorů: Roman Parak, Lukas Moravansky, Filip Rusnak
- Loga: INTEMAC, JIC
- MIT licence badge
- Kontaktní / repo odkazy
 
Bez přehnané sebeprezentace — stručně, profesionálně.
 
---
 
## Klíčové interaktivní prvky — shrnutí
 
| # | Prvek | Kde | Typ | Impact |
|---|-------|-----|-----|--------|
| 1 | **Inspection Cursor** | Celý web (průřezový) | Hover interakce | Identita webu — konzistentní inspekční metafora |
| 2 | **Inspection Chamber Hero** | Hero | Parallax + cursor reactive | První dojem — immersive vstup do projektu |
| 3 | **Kinetická typografie** | Hero heading | Scroll/load animation | Komunikuje energii a preciznost |
| 4 | **Defect Revealer** | Pipeline / Blender | Cursor-driven mask | Wow moment #1 — nahrazuje generic split slider |
| 5 | **Particle Field Transformation** | Transition Blender → GAN | Scroll-driven particles | Prostorový přechod — rozbíjí lineární scroll |
| 6 | **Latent Space Navigator** | Pipeline / GAN | 2D cursor navigation | Evokuje nekonečnou variabilitu GAN |
| 7 | **Compositing Deconstructor** | Pipeline / GAN | Drag & drop layers | Wow moment #2 — technický showcase |
| 8 | **Interaktivní GUI Demo** | Samostatná sekce | Click-driven simulation | **Signature moment** celého webu |
| 9 | **Live Productivity Graph** | GUI Demo | Data-point animation | Reinforcuje real-time pocit |
| 10 | **Measurement Precision Gauges** | Měření | Click + scroll animation | Vizuální preciznost — propojení dat a vizuálu |
| 11 | **Animated Metric Counters** | Výsledky | Scroll-triggered | Credibility moment |
 
---
 
## Narativní zasazení GAN sítí
 
GAN fáze nesmí vypadat jako „verze 2 co nahradila verzi 1". Musí vypadat jako **evoluce** — jiný přístup ke stejnému problému, s jinými silnými stránkami.
 
**Vizuální shift mezi érami:**
 
- **Blender část:** „Engineered" — schémata hardware, wireframy, fyzikální diagramy. Přesnější, technické vizuály. Barvy více v chladných tónech.
- **Transition:** Particle Field Transformation — vizuální zlom, změna energie.
- **GAN část:** „Organic" — gridy generovaných obrázků, noise→image transitions, latent space vizualizace. Měkčí, data-driven vizuální jazyk. Barvy s více variation.
 
---
 
## Design systém — tokeny
 
### Barvy
 
```
Background:
  --bg-deep:      #08080c      (nejhlubší pozadí — hero, preloader area)
  --bg-primary:   #0c0c12      (hlavní pozadí sekcí)
  --bg-elevated:  #141418      (karty, GUI demo)
  --bg-surface:   #1a1a22      (nested elementy)
 
Text:
  --text-primary: #e8e8ec      (hlavní text — ne pure white)
  --text-secondary: #8a8a96    (podpůrný text)
  --text-muted:   #4a4a56      (labels, timestamps, metadata)
 
Accent — fialová (modernizovaná z loga):
  --accent:       #7B6EF6      (hlavní accent — teplejší než pure indigo)
  --accent-light: #9B8FFE      (hover stavy)
  --accent-glow:  rgba(123, 110, 246, 0.15)   (glow efekty, hover karty)
 
Stavové barvy (z průmyslového kontextu):
  --ok:           #22c55e      (zelená — OK detekce, PASS)
  --nok:          #ef4444      (červená — NOK detekce, FAIL)
  --ok-glow:      rgba(34, 197, 94, 0.12)
  --nok-glow:     rgba(239, 68, 68, 0.12)
 
Utility:
  --border:       rgba(255, 255, 255, 0.06)
  --border-hover: rgba(255, 255, 255, 0.12)
  --glass:        rgba(255, 255, 255, 0.02)
```
 
### Typografie
 
```
Heading:     Clash Display (Fontshare) — bold, industrial, ne generický
             fallback: 'Space Grotesk', sans-serif
Body:        Outfit nebo Satoshi (Fontshare) — čistý, moderní
             NE: Inter, Roboto, Poppins, Open Sans, Montserrat
Mono:        JetBrains Mono — zachováno z reálné app (logger, data, metrics)
 
H1: clamp(3rem, 6vw + 1rem, 7.5rem), weight 700, tracking -0.03em, line-height 0.95
H2: clamp(2rem, 4vw + 0.5rem, 4.5rem), weight 700, tracking -0.02em
H3: clamp(1.25rem, 2vw + 0.5rem, 2rem), weight 600
Body: 16–17px, weight 400, line-height 1.65
Data/metrics: JetBrains Mono, 14–48px (dle kontextu), tabular-nums
```
 
---
 
## Flow a pacing
 
```
HERO — Inspection Chamber (fullscreen, immersive)
  ↓ plynulý scroll transition
THE DATA GAP — 3 bloky problému (scroll-reveal s vlastními vizuály)
  ↓ scroll
EVOLUTION: BLENDER → GAN
  ├── Blender pipeline + DEFECT REVEALER
  ├── PARTICLE FIELD TRANSFORMATION (prostorový přechod)
  └── GAN pipeline + LATENT SPACE NAVIGATOR + COMPOSITING DECONSTRUCTOR
  ↓ scroll
TRY THE INSPECTOR — interaktivní GUI demo (full-width, signature moment)
  ↓ scroll
MEASUREMENT — precision gauges, tolerance vizualizace
  ↓ scroll
RESULTS — velká čísla, evidence grid
  ↓ scroll
OPEN SOURCE — bento grid s repo/model kartami
  ↓ scroll
FOOTER — tým, instituce, licence
```
 
Celková délka: ~8–10 viewport heights na desktopu. Rhythm: immersive → informační → interaktivní → informační → interaktivní → data → odkazy.
 
---
 
## Poznámky k realizaci
 
### Co je potřeba dodat / vytvořit:
 
1. **Párové snímky pro Defect Revealer** — čistý díl + defektní díl, stejný úhel. Pokud ne pixel-perfect, postačí similar view s blur přechodem.
2. **6–8 snímků pro GUI demo** — mix OK a NOK, s předpřipravenými bounding boxy, confidence scores, a log zprávami pro každý snímek.
3. **Sekvence compositing vrstev** — 5 vrstev: background → object → fingerprint → blending → final composite. Exportované jako separátní PNG.
4. **50–100 GAN výstupů pro Latent Space Navigator** — generované s různými seeds, uspořádané do gridu pro interpolaci.
5. **Blender render + GAN output pár pro Particle Transformation** — dva snímky stejného/podobného dílu z různých zdrojů.
 
### Stack (doporučení):
 
- **Framework:** HTML + CSS + Vanilla JS (jednoduchý deploy, plná kontrola) — nebo Astro pro component-based workflow
- **Animace:** GSAP + ScrollTrigger (scroll-driven interakce, kinetická typografie)
- **Smooth scroll:** Lenis
- **Particles/WebGL:** Canvas 2D pro Particle Transformation (nebo Three.js pokud potřebujeme 3D)
- **Grafy:** SVG (GUI demo graf — custom, ne knihovna)
- **Hosting:** GitHub Pages / Vercel / Netlify
 
### Priority při implementaci:
 
1. **Hero + Inspection Chamber** — první dojem, nastavuje tón
2. **GUI demo** — hlavní wow moment, nejvíce práce
3. **Defect Revealer** — silný vizuální prvek, relativně jednoduchá implementace
4. **Pipeline story + Compositing Deconstructor** — narativní páteř
5. **Particle Transformation** — vizuální wow, ale technicky náročnější
6. **Latent Space Navigator** — závisí na dostupnosti dostatečného počtu GAN outputů
7. **Measurement gauges + Results** — informační sekce, snazší
8. **Responsive + performance** — finální polish
9. **Inspection Cursor** — průřezový, implementovat po stabilizaci layoutu
 
### Performance budget:
 
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Particle systems: `requestAnimationFrame` s throttle, deaktivace mimo viewport
- Obrázky: WebP/AVIF, lazy loading, progressive loading pro hero
- Reduced motion: respektovat `prefers-reduced-motion` — statické alternativy pro všechny animace
 
---
 
## Co web MUSÍ a NESMÍ být
 
### MUSÍ:
- Tmavé téma jako základ (ne pure black, range #08080c – #1a1a22)
- Fialová/indigo jako primární accent
- Monospace font pro data, metriky, confidence scores, timestamps
- Velkorysý whitespace — sekce s velkým paddingem
- Minimálně tři „wow momenty" (Defect Revealer, GUI Demo, Compositing Deconstructor)
- Reálné assety z projektu místo placeholderů
- Responsive od mobilu po 4K
- Accessibility — semantic HTML, focus states, reduced-motion fallbacks
- Performance — rychlé načítání i s animacemi
 
### NESMÍ:
- Stock fotky
- Gradient CTA tlačítka
- Generic „AI brain" / „neural network" vizuály
- Bootstrap / Tailwind UI bez heavy customizace
- Symetricky centered layout na všech sekcích
- `border-radius: 8px` na všem
- Více než 2–3 fonty celkem
- Parallax na všem (cílený, ne plošný)
- Animace jen pro animace — každý pohyb musí mít účel
- Terminálový preloader
 
---
 
*Tento dokument je živý. Aktualizujte ho po každém design rozhodnutí.*