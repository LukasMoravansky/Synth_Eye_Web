import '../styles/cursor.css';
import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';

/**
 * Inspection Cursor — kurzor jako inspekční sonda.
 *
 * Na hover nad `[data-inspectable]` se vykreslí detekční overlay. Dva druhy boxů,
 * odlišené barvou **i tvarem** (ne jen barvou — daltonismus):
 *
 *   objekt  `data-box="l,t,w,h"`      → rohové závorky v --accent (viewfinder motiv)
 *   defekty `data-defects="l,t,w,h;…" → uzavřený rámeček v --nok, N nálezů
 *
 * Souřadnice jsou v % rozměru obrázku. Label je **ukotvený k boxu**, ne k kurzoru
 * (viz docs/plan/ux-bbox-2026-08-05.md) — kurzor nese jen viewfinder ring.
 *
 * ## Stav se DERIVUJE, neakumuluje
 *
 * Overlay má tři nezávislé důvody existence — hover, tap, fokus — a každý z nich
 * má vlastní zdroj pravdy, proti kterému se každý frame validuje:
 *
 *   hover → kurzor musí ležet v rectu prvku (geometrie, ne `pointerout`)
 *   fokus → `document.activeElement` musí být pořád ten prvek
 *   tap   → 2,5s okno
 *
 * Dřív držela stav jedna proměnná, kterou si tyhle tři vstupy přepisovaly:
 * `data-inspectable` sedí na `<img tabindex="0">`, takže klik na snímek ho
 * zafokusuje a `focusin` překlopil zdroj z hoveru na fokus — čímž vypnul
 * validaci hoveru. Overlay pak přežil scroll i odjezd kurzoru a bounding box
 * zůstal viset nad úplně jiným obsahem stránky.
 */

// Chip smí přetéct hranici svého boxu (malý nález ho neuveze), ale ne hranici
// snímku — proto se prahuje šířkou snímku, ne boxu.
const TAG_MIN_IMAGE_WIDTH = 220;

const TAP_WINDOW = 2500;

function init() {
  const overlay = document.createElement('div');
  overlay.className = 'inspection-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="inspection-ring"></div>
    <div class="inspection-boxes"></div>
  `;
  document.body.appendChild(overlay);

  const ring = overlay.querySelector('.inspection-ring');
  const boxes = overlay.querySelector('.inspection-boxes');

  const CORNERS = ['tl', 'tr', 'bl', 'br']
    .map((c) => `<span class="inspection-box__corner inspection-box__corner--${c}"></span>`)
    .join('');

  // Tři důvody, proč overlay svítí. Ne enum — mohou platit současně (kurzor nad
  // snímkem, který má zároveň fokus po kliknutí), pak vyhrává hover.
  let hoverEl = null;
  let focusEl = null;
  let tapEl = null;

  let bound = null; // prvek, jehož spec je právě nabindovaný v poolu
  let visible = false;
  let ringOn = false;

  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  /* Dokud nepřišel skutečný pointer event, je (tx,ty) = (0,0) — což je levý
     horní roh obrazovky, ne pozice kurzoru. Bez tohoto flagu tam ring skočil
     při každém rozsvícení, které nevyvolal kurzor. */
  let pointerSeen = false;

  let raf = 0;
  let tapTimeout = 0;
  let spec = [];
  let pool = [];

  /** Pool bracket boxů — recykluje se mezi hovery, nealokuje se za běhu rAF. */
  function boxPool(count) {
    while (boxes.children.length < count) {
      const el = document.createElement('div');
      el.className = 'inspection-box';
      el.innerHTML = `${CORNERS}<span class="inspection-box__tag mono"></span>`;
      boxes.appendChild(el);
    }
    const nodes = [];
    for (let i = 0; i < boxes.children.length; i++) {
      const el = boxes.children[i];
      el.hidden = i >= count;
      if (i < count) nodes.push(el);
    }
    return nodes;
  }

  function parseGroups(value) {
    return (value || '')
      .split(';')
      .map((g) => g.split(',').map(Number))
      .filter((g) => g.length === 4 && g.every((n) => Number.isFinite(n)));
  }

  /**
   * Poskládej spec pro hovernutý prvek. Objekt jde první (kreslí se pod defekty),
   * defekty se řadí od největšího — label dostane jen ten dominantní, aby se
   * u dvou identických tříd nezdvojoval text.
   */
  function buildSpec(el) {
    const objLabel = el.dataset.label;
    const objConf = el.dataset.confidence;
    // Confidence je nepovinná: Verification (PipelineBlender) záměrně žádná
    // procenta netvrdí, ale třídu na hoveru ukázat musí → fallback na label.
    const tag = objLabel ? (objConf ? `${objLabel} ${objConf}%` : objLabel) : '';

    const objGroups = parseGroups(el.dataset.box);
    const defectGroups = parseGroups(el.dataset.defects).sort((a, b) => b[2] * b[3] - a[2] * a[3]);

    const dLabel = el.dataset.defectLabel;
    const dConf = el.dataset.defectConfidence;
    const defectTag = dLabel && dConf ? `${dLabel} ${dConf}%` : '';

    const out = [];
    // Bez jakéhokoli boxu = orámuj celý snímek (chování pro sekce bez měřených souřadnic).
    const objects = objGroups.length || defectGroups.length ? objGroups : [[0, 0, 100, 100]];
    objects.forEach((g) => out.push({ g, kind: 'obj', tag }));
    defectGroups.forEach((g, i) => out.push({ g, kind: 'defect', tag: i === 0 ? defectTag : '' }));
    return out;
  }

  function bindBoxes(el) {
    spec = buildSpec(el);
    pool = boxPool(spec.length);
    for (let i = 0; i < spec.length; i++) {
      const node = pool[i];
      const s = spec[i];
      node.classList.toggle('inspection-box--defect', s.kind === 'defect');
      const tagEl = node.lastElementChild;
      tagEl.textContent = s.tag;
      tagEl.hidden = !s.tag;
    }
  }

  /**
   * Chip objektu jde NAD box, chip defektu POD svůj box. Tím se dva chipy
   * nepřekryjí ani když defekt začíná těsně pod horní hranou dílu (v Data Gap
   * je rozdíl 1,5 % výšky snímku = pár px).
   */
  function placeBoxes(rect) {
    const tagFits = rect.width >= TAG_MIN_IMAGE_WIDTH;
    for (let i = 0; i < spec.length; i++) {
      const [l, t, w, h] = spec[i].g;
      const isDefect = spec[i].kind === 'defect';
      const node = pool[i];
      const top = rect.top + (rect.height * t) / 100;
      const height = (rect.height * h) / 100;
      node.style.left = `${rect.left + (rect.width * l) / 100}px`;
      node.style.top = `${top}px`;
      node.style.width = `${(rect.width * w) / 100}px`;
      node.style.height = `${height}px`;
      // Objekt: chip nad boxem by u horní hrany viewportu vyjel z obrazu → dovnitř.
      // Defekt: chip pod boxem u spodní hrany snímku → překlopit nad box.
      node.classList.toggle('is-tag-inside', !isDefect && top < 26);
      node.classList.toggle('is-tag-flip', isDefect && t + h > 88);
      // Box v pravé části snímku → chip zarovnaný na jeho pravý okraj (roste doleva).
      node.classList.toggle('is-tag-right', l > 55);
      node.classList.toggle('is-tag-hidden', !tagFits);
    }
  }

  const dur = () => (prefersReducedMotion() ? 0 : 0.22);

  /* `overwrite: true` NENÍ kosmetika. GSAP defaultně souběžné tweeny nezabíjí,
     takže show (0,22 s) a hide (0,16 s) na téže vlastnosti běžely vedle sebe:
     při rychlém scrollu se overlay schoval do ~60 ms od rozsvícení, hide dojel
     první a starší show tween pak dopisoval opacity dál — jeho poslední zápis
     byl 1. Stav říkal „schováno", smyčka se zastavila (takže se boxy přestaly
     přepočítávat) a bounding box zůstal zmrzlý na stránce nad cizím obsahem. */
  function setVisible(on) {
    if (visible === on) return;
    visible = on;
    gsap.to(boxes, { opacity: on ? 1 : 0, duration: on ? dur() : 0.16, overwrite: true });
  }

  /* Ring je kurzor. Na dotyku ani u klávesové navigace žádný kurzor není — a
     protože jeho transform zapisuje výhradně smyčka, zůstával by ring stát na
     poslední známé (nebo nulové) pozici jako accent kruh napůl venku v levém
     horním rohu obrazovky. */
  function setRing(on) {
    if (ringOn === on) return;
    ringOn = on;
    if (on) {
      // Transform zapiš hned: tween mění jen opacity/scale, takže bez tohoto by
      // se první frame vykreslil na pozici předchozího hoveru.
      ring.style.transform = `translate(${px}px, ${py}px) scale(1)`;
      gsap.to(ring, { opacity: 1, scale: 1, duration: dur(), ease: 'power2.out', overwrite: true });
    } else {
      gsap.to(ring, { opacity: 0, scale: 0.85, duration: 0.16, overwrite: true });
    }
  }

  function usable(el) {
    // Prvek smazaný ze DOM už nemá co popisovat.
    return el && el.isConnected;
  }

  /**
   * Autoritou pro „je kurzor ještě nad snímkem?" nesmí být boundary eventy:
   * Lenis scrolluje z JS, takže obsah odjede pod nehybným kurzorem bez
   * `pointerout`, a Chrome při rychlém přejezdu slučuje boundary eventy na
   * jeden pár za frame — ten „out" se tedy umí zahodit úplně.
   *
   * Nesmí to být ale ani `getBoundingClientRect()`: rect obsahuje bod i tehdy,
   * když je snímek v tom místě **zakrytý** (nav, hero obsah, sticky panel) nebo
   * odstřižený `overflow: hidden`. Rychlý scroll přesune snímek pod nav a rect
   * test dál tvrdil „kurzor je nad snímkem" → box zůstal viset na stránce.
   *
   * `elementFromPoint()` je totéž hit-testování, jakým prohlížeč rozhoduje o
   * `pointerover`, takže validace se s tím, co overlay rozsvítilo, nemůže
   * rozejít. Respektuje z-order, klipování i `pointer-events` (náš overlay ho
   * má `none`, takže si nestíní sám).
   */
  function pointerOver(el) {
    if (!pointerSeen) return false;
    const hit = document.elementFromPoint(tx, ty);
    if (!hit) return false; // kurzor mimo viewport
    return hit === el || el.contains(hit) || hit.closest('[data-inspectable]') === el;
  }

  /** Overlay má smysl jen dokud je snímek aspoň částí v obraze. */
  function onScreen(rect) {
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < innerHeight &&
      rect.left < innerWidth
    );
  }

  /* Fokus drží overlay jen u klávesové navigace. Klik myší na `<img tabindex="0">`
     prvek taky zafokusuje, ale `:focus-visible` u toho Chrome nedává — bez téhle
     podmínky by klik na snímek nechal box svítit i po odjezdu kurzoru a scrollu. */
  function keyboardFocused(el) {
    try {
      return el.matches(':focus-visible');
    } catch {
      return true; // starý engine bez :focus-visible → nezahazuj a11y chování
    }
  }

  /**
   * Jediné místo, kde se rozhoduje, co se kreslí. Vždycky si nejdřív ověří
   * všechny tři důvody proti realitě, takže ztracený `pointerout` (Lenis
   * scrolluje z JS — obsah odjede pod nehybným kurzorem bez boundary eventu)
   * ani přeblokovaný fokus stav nezaseknou.
   */
  function sync() {
    if (hoverEl && !usable(hoverEl)) hoverEl = null;
    if (tapEl && !usable(tapEl)) tapEl = null;
    if (
      focusEl &&
      (!usable(focusEl) || document.activeElement !== focusEl || !keyboardFocused(focusEl))
    ) {
      focusEl = null;
    }

    // Vyber nejsilnější platný důvod. Hover musí navíc obstát v hit-testu —
    // rect z něj bereme dál, placeBoxes ho potřebuje.
    let el = null;
    let rect = null;
    const reasons = [hoverEl, tapEl, focusEl];
    for (let i = 0; i < reasons.length; i++) {
      const c = reasons[i];
      if (!c) continue;
      const r = c.getBoundingClientRect();
      if (onScreen(r) && (c !== hoverEl || pointerOver(c))) {
        el = c;
        rect = r;
        break;
      }
      if (c === hoverEl) hoverEl = null;
      else if (c === tapEl) tapEl = null;
      else focusEl = null;
    }

    if (!el) {
      setVisible(false);
      setRing(false);
      bound = null;
      stopLoop();
      return;
    }

    if (el !== bound) {
      bound = el;
      bindBoxes(el);
      // Snap: ring nesmí přiletět ze souřadnic předchozího hoveru.
      px = tx;
      py = ty;
    }

    placeBoxes(rect);
    setVisible(true);
    setRing(el === hoverEl && isFinePointer() && pointerSeen);
    startLoop();
  }

  function startLoop() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* Smyčka běží po celou dobu viditelnosti overlaye, i na dotyku: boxy jsou
     `position: fixed`, takže bez přepočtu zůstanou stát ve viewportu, kdežto
     snímek pod nimi odjede se scrollem — tap a jedno švihnutí palcem stačilo,
     aby rámečky visely přes úplně jiný obsah po celou dobu 2,5s okna. */
  function tick() {
    raf = 0;
    try {
      if (ringOn) {
        px += (tx - px) * 0.2;
        py += (ty - py) * 0.2;
        ring.style.transform = `translate(${px}px, ${py}px) scale(1)`;
      }
      sync(); // přepočet pozic + revalidace důvodů; sama si smyčku naplánuje dál
    } catch (err) {
      /* Fail-safe, ne polykání chyby: overlay drží stav jen dokud ho smyčka
         každý frame potvrzuje, takže výjimka uprostřed framu by ho zmrazila
         na místě — a zmrzlý bounding box nad cizím obsahem je horší než žádný. */
      hoverEl = null;
      tapEl = null;
      focusEl = null;
      bound = null;
      setVisible(false);
      setRing(false);
      stopLoop();
      if (import.meta.env.DEV) console.error('[inspection-cursor] frame selhal', err);
    }
  }

  function target(e) {
    return e.target instanceof Element ? e.target.closest('[data-inspectable]') : null;
  }

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    tx = e.clientX;
    ty = e.clientY;
    pointerSeen = true;
    // Přejezd mimo snímek ruší hover i tehdy, když `pointerout` pro předchozí
    // prvek nepřišel (Chrome slučuje boundary eventy na jeden pár za frame).
    hoverEl = target(e);
    sync();
  });

  document.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'touch') return;
    const el = target(e);
    if (el && el === hoverEl && !el.contains(e.relatedTarget)) hoverEl = null;
    sync();
  });

  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      // Pozici trackujeme i bez aktivního hoveru: sync() z ní dělá hit-test.
      tx = e.clientX;
      ty = e.clientY;
      pointerSeen = true;
    },
    { passive: true },
  );

  /* Kurzor opustil okno nebo se přepnula karta — hover stav už nikdo nezruší. */
  document.addEventListener('pointerleave', () => {
    hoverEl = null;
    sync();
  });
  window.addEventListener('blur', () => {
    hoverEl = null;
    sync();
  });

  if (!isFinePointer()) {
    document.addEventListener('click', (e) => {
      tapEl = target(e);
      clearTimeout(tapTimeout);
      if (tapEl) {
        tapTimeout = setTimeout(() => {
          tapEl = null;
          sync();
        }, TAP_WINDOW);
      }
      sync();
    });
  }

  /* Fokus je vlastní důvod, ne přepínač zdroje: `data-inspectable` je na
     `<img tabindex="0">`, takže klik na snímek ho zafokusuje — a stav fokusu
     pak žije nezávisle na tom, kde je kurzor. */
  document.addEventListener('focusin', (e) => {
    focusEl = target(e);
    sync();
  });
  document.addEventListener('focusout', () => {
    focusEl = null;
    sync();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export default init;
