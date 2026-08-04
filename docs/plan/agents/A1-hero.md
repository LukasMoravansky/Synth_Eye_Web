# A1 — Hero: „Inspection Chamber"

**Vlna 1 · paralelně · větev `feat/a1-hero`**

Přečti [../README.md](../README.md) a [../CONTRACT.md](../CONTRACT.md), než začneš.

**Vlastníš:** `src/components/Hero.astro`, `src/scripts/hero-chamber.js`
**Nesmíš editovat:** cokoli jiného (kromě svého řádku v `progress.md`)

---

## Cíl

Hero, který **není banner, ale zážitek**: celý viewport JE inspekční komora. Návštěvník
interaguje s inspekčním systémem ještě než přečte první řádek textu. Tohle nastavuje tón
celého webu a je to první dojem pro investory a průmyslové inženýry.

Žádný vysvětlující text není potřeba — zážitek vysvětluje sám sebe.

---

## Kontext

Synth.Eye je platforma pro syntetická data pro průmyslovou vizuální inspekci: v Blenderu
a pomocí GAN se generují syntetické snímky kovových dílů s defekty, na nich se natrénuje
detekční model, a ten pak funguje na reálných snímcích z výroby (>99 % klasifikace,
>95 % detekce defektů) — **bez jediného ručně anotovaného reálného snímku**.

Metafora celého webu: **inspekční komora**. Tmavé pozadí, jeden osvětlený objekt,
kurzor jako inspekční sonda, monospace HUD data.

---

## Vizuální kompozice (implementuj takto)

- **Pozadí:** plný viewport (`min-height: 100svh`), `var(--bg-deep)`. Grain overlay je globální
  (A0), nedělej vlastní.
- **Centrální objekt:** snímek kovového dílu, slug `part-hero` (fallback `part-front`), přes
  `<Picture slug="part-hero" loading="eager" fetchpriority="high" inspectable
  label="Cls_Obj_Front_Side" confidence={99.15} />`. Nesmí to působit jako flat obrázek —
  jemná 3D perspektiva (`transform: perspective(1200px) rotateX/rotateY`), reaguje na pohyb
  myši **±5°** s tlumením (lerp ~0.08, ne 1:1 sledování).
- **Inspekční paprsek:** z pozice kurzoru vychází kruhový highlight, který „osvětluje" povrch
  dílu pod kurzorem. Implementuj jako radiální gradient masku nad snímkem
  (`radial-gradient` v `mask-image` nebo overlay div s `mix-blend-mode: soft-light`),
  radius ~180px, měkký falloff. Aktivní jen nad dílem.
- **Datové fragmenty (HUD):** kolem dílu se **staggered** (ne najednou) objevují fragmenty
  v `var(--font-mono)`, `var(--text-muted)` až `var(--text-secondary)`, 11–13px, polo-transparentní.
  Použij **reálná data z projektu**, ne vymyšlená:
  ```
  Cls_Obj_Front_Side   99.15 %
  bbox  [412, 288, 196, 204]
  Cls_Defect_Fingerprint   92.93 %
  res   1600x1200  RGB
  model front.pkl · StyleGAN2-ADA
  latency  38 ms
  ```
  Fragmenty vedou tenkou 1px linkou (`var(--border-hover)`) k místu na dílu, ke kterému patří.
- **Spodní odraz:** pod dílem subtle reflection / glow na „podlaze" komory — `--accent-glow`
  s velkým blurem, velmi nízká opacity. Ne zrcadlová kopie obrázku.
- **Viewfinder brackets:** rohové závorky `⌜ ⌝ ⌞ ⌟` z loga — v rozích viewportu (jemné,
  `--text-muted`) a v rozích dílu (silnější, na hover `--accent`). A0 nechal utility třídu
  `.viewfinder` — použij ji, nevytvářej vlastní.

## Typografie

`<h1>` nad dílem, rozložený do prostoru (ne centrovaný blok — asymetrie je záměr):

> **Train on synthetic.**
> **Deploy on real.**

`var(--font-display)`, `var(--fs-h1)`, weight 700, tracking -0.03em, line-height 0.95.

**Kinetická typografie na druhém řádku:** písmena `Deploy on real.` se **sestaví z noise/static**
— ne přílet z různých stran. Implementace: každý znak je `<span>`, na load prochází sekvencí
2–4 náhodných glyphů (nebo `blur(6px) + opacity` + `letter-spacing` collapse) a ustálí se do
čitelné formy. Stagger 25–40ms per znak. Celá animace do **1.2 s**.

Pod headingem jedno číslo, animovaně napočítané utilitou `animateCounter` z `lib/counter.js`:

> **99.15 % accuracy — zero real labels**

`var(--font-mono)`, tabular-nums, `99.15` v `var(--accent)` nebo `--text-primary`,
zbytek `--text-secondary`.

## CTA

**Ne tlačítko.** Text s šipkou dolů: *„See it in action"* v `--font-mono`, uppercase, malý,
s jemným pulzujícím pohybem šipky (2s loop, translateY 4px). Kliknutí = smooth scroll
na `#data-gap` (použij Lenis instanci přes `window.__lenis` fallback na `scrollIntoView`).

## Badge pruh pod hero

Jemný horizontální pruh (na spodní hranici viewportu nebo hned pod ním): `MIT License · INTEMAC ·
JIC · Open Source` v `--font-mono`, 11px, `--text-muted`, oddělené `·`. Minimální vizuální šum,
žádná loga (ta nemáme — viz [../assets.md](../assets.md)).

---

## Technické constraints

- Markup + scoped CSS v `Hero.astro`. **Veškerý JS** v `src/scripts/hero-chamber.js`
  s `export default function init(root)`.
- Zapojení přes `whenVisible` z `lib/lazy-init.js` — ale hero je nad foldem, takže loader se
  spustí okamžitě. Přesto použij stejný vzor pro konzistenci.
- Mouse parallax: **jediný** `requestAnimationFrame` loop, lerpovaný, s `will-change: transform`
  jen během aktivního pohybu. Loop pozastav, když hero není ve viewportu.
- `isFinePointer()` z `lib/motion.js` — na touch zařízeních parallax a inspekční paprsek
  **vypni úplně**, HUD fragmenty zobraz staticky (bez linek ke kurzoru).
- `prefersReducedMotion()` — kinetická typografie se přeskočí (text je hned čitelný),
  counter skočí na cílovou hodnotu, žádný parallax, žádný pulz šipky. Statické HUD fragmenty
  viditelné.
- LCP element je hero obrázek → `loading="eager"`, `fetchpriority="high"`, správné width/height.
  **Nesmí být za JS gate** — obrázek je v HTML, jen jeho transformace je JS.

## Akceptační kritéria

- [ ] Hero zabírá plný viewport, díl je vizuálně dominantní, kompozice **není** symetricky centrovaná
- [ ] Pohyb myší natáčí díl max ±5° s viditelným tlumením (žádný ostrý 1:1 pohyb)
- [ ] Inspekční paprsek osvětluje povrch dílu pod kurzorem a mizí, když kurzor opustí díl
- [ ] HUD fragmenty se objevují staggered po loadu, obsahují reálné labely a confidence hodnoty
- [ ] `Deploy on real.` se sestaví z noise do čitelné formy do 1.2 s
- [ ] Counter dojede na `99.15`
- [ ] Klik na „See it in action" plynule odscrolluje na sekci The Data Gap
- [ ] Na 360px šířce: heading čitelný, díl viditelný, žádný horizontální scroll, parallax vypnutý
- [ ] `prefers-reduced-motion` — vše okamžitě čitelné, nulová animace, žádný prázdný prostor
- [ ] Lighthouse LCP na hero obrázku < 2.5 s (dev build stačí orientačně)
- [ ] `git status` obsahuje jen `Hero.astro`, `hero-chamber.js`, `progress.md`

## Co NEDĚLAT

- Žádný terminálový preloader ani boot-up sekvence — stránka startuje okamžitě.
- Žádné gradientní tlačítko jako CTA.
- Žádné generic „AI brain / neural network" vizuály, žádné částicové pozadí (částice patří A7).
- Nedělej plošný parallax na všech elementech — parallax má **jen díl** a nepatrně HUD.
- Nepoužij stock fotku ani placeholder obrázek.
- Nezakládej vlastní Lenis / ScrollTrigger konfiguraci ani vlastní grain overlay.
- Nesahej na `index.astro`, `tokens.css`, `global.css`, `Base.astro`.
