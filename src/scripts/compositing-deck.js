import { gsap, ScrollTrigger, isFinePointer, prefersReducedMotion } from './lib/motion.js';

/* Compositing Deconstructor — lane A rozebraná.
 *
 * Dvě mechaniky, jedna soustava transformací:
 *
 *   1) scrub rozloží stack (open 0 → 1) do šikmého sloupce
 *   2) tah za vrstvu ji vytáhne ze stacku a odpruží zpět
 *
 * Předchozí verze zapisovala tah přímo do `style.transform`, čímž přepsala
 * bázový offset z CSS třídy — vrstva při uchopení poskočila o svůj odsazovací
 * vektor a ztratila scale. Proto tady transformaci VŽDY skládá jedna funkce
 * (applyPlate) ze tří nezávislých vstupů: rozložení, tah a vysunutí zvýrazněné
 * vrstvy. Nic jiného na `transform` vrstev nesahá, ani GSAP — ten hýbe jen
 * proxy objekty.
 *
 * Podstata příčky je ale v tom třetím: tah za vrstvu 02 (paste rect) nebo 03
 * (kompozit) posouvá odpovídající bounding box na label vrstvě a PŘEPISUJE
 * jeho řádek v composite.txt. Label není nakreslený na stack, je to funkce
 * souřadnic vrstev pod ním — a tohle je jediný způsob, jak to tvrzení
 * neříct, ale ukázat.
 *
 * ── geometrie (přepis 2026-08-07) ────────────────────────────────────────
 * Rozestupy jsou v POMĚRU k hraně vrstvy, ne v absolutních px, a hrana se
 * počítá tak, aby se rozložený stack vešel do viewportu (viz measure). Dřív
 * byla vrstva ve velikosti kádru s rozestupem 86 px, tedy 81% překryv —
 * z každé vrstvy byl vidět proužek a label vrstva ležela NA kompozitu, což
 * je přesný opak toho, co příčka tvrdí.
 *
 * Rozklad je souměrný kolem středu kádru: vrstva 02 stojí, 00 klesá, 04
 * stoupá. Vyhrazená plocha (--frame + --span) je proto stejná ve složeném
 * i rozloženém stavu — výška prvku se během scrubu nemění, takže si
 * ScrollTrigger neposouvá vlastní start/end pod rukama. Trigger je navíc
 * kotvený na horní hranu prvku v obou koncích (`top …`), ne na `bottom`.
 */

/** Rozestup mezi obrazovými vrstvami jako podíl hrany vrstvy.
 *  0.46 → překryv 54 %, tedy spodních 46 % každé vrstvy zůstává čistých —
 *  a právě tam leží paste rect (71–97 % kádru) i otisk v kompozitu. */
const GAP_RATIO = 0.46;
/** Kolik navíc odjíždí label vrstva. GAP_RATIO + LIFT_RATIO = 1.18, tedy
 *  o 18 % hrany víc, než je vrstva vysoká: mezi kompozitem a labelem zůstane
 *  pruh čistého pozadí (~39 px na běžném desktopu). To je celý claim příčky
 *  přeložený do geometrie — a musí být širší než popiska třídy 0, která
 *  v tom pruhu sedí, jinak by se vzduch zase zavřel. */
const LIFT_RATIO = 0.72;
/** Sklon sloupce. tan 12° — musí sedět s rotací spojnic v CSS. */
const SKEW_TAN = 0.2126;

/** Hrana vrstvy: dolní mez kvůli čitelnosti mono popisek uvnitř kádru,
 *  horní kvůli tomu, aby na 4K stack nezabral půl obrazovky. */
const FRAME_MIN = 168;
const FRAME_MAX = 300;
/** Podíl výšky viewportu, do kterého se musí vejít celý rozložený stack. */
const VIEWPORT_FIT = 0.84;

/** Které vrstvě patří který řádek labelu. */
const DRIVERS = { 2: 'paste', 3: 'composite' };

/** Klidový text stavového řádku — bez něj není interakce objevitelná. */
const HINT_FINE = 'hover a row to isolate its layer · drag a plate to move it';
const HINT_COARSE = 'tap a row to isolate its layer';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function init(root) {
  const stage = root.querySelector('[data-deck-stage]');
  const plates = [...root.querySelectorAll('.plate')];
  /* Rail čte obráceně než stack (04 → 00), takže pozice v seznamu NENÍ index
     vrstvy — ten nese data-op. Přerovnáno na index vrstvy, aby zbytek kódu
     mohl ops[i] párovat s plates[i]. */
  const ops = [];
  root.querySelectorAll('.op').forEach((el) => {
    ops[Number(el.dataset.op)] = el;
  });
  /** Vrstva, jejíž komentář je v railu rozbalený, když se nic nezvýrazňuje —
   *  ta poslední, tj. label. Bez klidové hodnoty by rail v klidu neměl
   *  rozbalený žádný a působil by jako pět prázdných řádků. */
  const NOTE_REST = plates.length - 1;
  const status = root.querySelector('[data-deck-status]');
  if (!stage || plates.length === 0) return;

  const reduced = prefersReducedMotion();
  const HINT = isFinePointer() ? HINT_FINE : HINT_COARSE;
  const LAST = plates.length - 1;
  let open = reduced ? 1 : 0;

  /* Tahové offsety v CSS pixelech kádru. Vrstvy se jen posouvají (nezkosují,
     neškálují), takže se dělením hranou kádru rovnou převedou na
     normalizované souřadnice labelu. */
  const drag = plates.map(() => ({ x: 0, y: 0 }));
  /* Vysunutí zvýrazněné vrstvy. Vlastní hodnota (ne CSS transition), protože
     transform vrstev zapisuje scrub i tah každý frame — přechod na transform
     by tah táhl za kurzorem. */
  const boost = plates.map(() => ({ v: 0 }));
  const boostTweens = plates.map(() => null);

  /* Výchozí hodnoty řádků labelu, opsané z DOM — zdroj pravdy zůstává
     v .astro (a tam v composite.txt), skript si je nesmí vymýšlet znovu. */
  const rows = new Map();
  root.querySelectorAll('[data-row]').forEach((el) => {
    const nums = {};
    el.querySelectorAll('[data-num]').forEach((n) => {
      nums[n.dataset.num] = { el: n, base: parseFloat(n.textContent) };
    });
    rows.set(el.dataset.row, { el, nums });
  });

  const boxes = new Map();
  root.querySelectorAll('[data-box]').forEach((el) => boxes.set(el.dataset.box, el));
  /* Popisky boxů se posouvají přes left/top, ne přes transform — ten na nich
     drží svislé srovnání nad hranu boxu a procentuální translate by se navíc
     počítalo z jejich vlastní šířky, ne z kádru. */
  const flags = new Map();
  root.querySelectorAll('[data-flag]').forEach((el) => {
    flags.set(el.dataset.flag, {
      el,
      left: parseFloat(el.style.left),
      top: parseFloat(el.style.top),
    });
  });

  /* ── geometrie ──────────────────────────────────────────────────────── */

  let frame = 240;
  let gap = 110;
  let lift = 149;
  let span = 589;
  let oblique = 1;
  /** Index izolované vrstvy (hover / focus z obou stran), null = žádná. */
  let active = null;

  /** Svislé vysunutí vrstvy i v plně rozloženém stavu, měřeno od středu
   *  vyhrazené plochy. Kladné = nahoru. Souměrné kolem vrstvy 02, proto se
   *  odečítá půlka rozpětí. */
  const liftOf = (i) => i * gap + (i === LAST ? lift : 0) - span / 2;

  function measure() {
    oblique = parseFloat(getComputedStyle(root).getPropertyValue('--oblique')) || 0;

    /* Dvě nezávislá omezení, bere se přísnější:
         šířka  — šikmý sloupec se rozjede o span × tan12, souměrně kolem
                  osy, takže na každou stranu půlka
         výška  — celý rozložený stack se musí vejít do viewportu, jinak se
                  claim (čistý vzduch mezi kompozitem a labelem) nedá vidět
                  na jeden pohled */
    const spanRatio = (plates.length - 1) * GAP_RATIO + LIFT_RATIO;
    const byWidth = (stage.clientWidth || FRAME_MAX) / (1 + oblique * spanRatio * SKEW_TAN * 0.5);
    const byHeight = (window.innerHeight * VIEWPORT_FIT) / (1 + spanRatio);

    frame = Math.round(Math.max(FRAME_MIN, Math.min(FRAME_MAX, byWidth, byHeight)));
    gap = Math.round(frame * GAP_RATIO);
    lift = Math.round(frame * LIFT_RATIO);
    span = (plates.length - 1) * gap + lift;

    root.style.setProperty('--frame', `${frame}px`);
    root.style.setProperty('--span', `${span}px`);

    /* Spojnice vedou z rohů vrstvy DOLŮ k vrstvě pod ní. Vrstva 00 pod sebou
       nic nemá (dřív jí spojnice visely do prázdna), vrstva 04 má pod sebou
       rozestup i vzduch navíc. */
    plates.forEach((p, i) => {
      const len = i === 0 ? 0 : i === LAST ? gap + lift : gap;
      p.style.setProperty('--gap', `${len}px`);
    });
  }

  function applyPlate(i) {
    const up = liftOf(i);
    const x = drag[i].x + open * (oblique * up * SKEW_TAN + boost[i].v);
    const y = drag[i].y - open * up;
    plates[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function setOpen(v) {
    open = v;
    root.style.setProperty('--open', String(v));
    plates.forEach((_, i) => applyPlate(i));
  }

  /* ── label ──────────────────────────────────────────────────────────── */

  /** Přepíše box i jeho řádek podle posunu vrstvy, ze které pochází.
   *  Posun se normalizuje hranou VRSTVY (--frame), ne šířkou sloupce — kádr
   *  labelu je vrstva, ne stage. */
  function syncLabel(i) {
    const key = DRIVERS[i];
    if (!key) return;

    const row = rows.get(key);
    /* Ořez se počítá jednou a použije se pro čísla i pro kresbu, jinak se
       na kraji rozjede box proti svému řádku. */
    let fx = drag[i].x / frame;
    let fy = drag[i].y / frame;
    if (row?.nums.cx) fx = clamp01(row.nums.cx.base + fx) - row.nums.cx.base;
    if (row?.nums.cy) fy = clamp01(row.nums.cy.base + fy) - row.nums.cy.base;

    const box = boxes.get(key);
    if (box) box.setAttribute('transform', `translate(${fx * 100} ${fy * 100})`);

    const flag = flags.get(key);
    if (flag) {
      flag.el.style.left = `${flag.left + fx * 100}%`;
      flag.el.style.top = `${flag.top + fy * 100}%`;
    }

    if (!row) return;
    const moved = fx !== 0 || fy !== 0;
    row.el.classList.toggle('is-live', moved);
    if (row.nums.cx) row.nums.cx.el.textContent = (row.nums.cx.base + fx).toFixed(6);
    if (row.nums.cy) row.nums.cy.el.textContent = (row.nums.cy.base + fy).toFixed(6);
  }

  /* ── izolace vrstvy (hover / focus, oběma směry) ─────────────────────── */

  /** Zvýrazněná vrstva ještě popojede stranou — samotné ztlumení ostatních
   *  by z pěti soutisků udělalo jeden a vrstva by se neoddělila, jen
   *  prosvítila. Tweenuje se na vlastní hodnotě, viz `boost`. */
  function setBoost(i, target) {
    boostTweens[i]?.kill();
    if (reduced) {
      boost[i].v = target;
      applyPlate(i);
      return;
    }
    boostTweens[i] = gsap.to(boost[i], {
      v: target,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => applyPlate(i),
    });
  }

  function highlight(i) {
    active = i;
    root.classList.toggle('is-isolating', i != null);
    const nudge = frame * 0.11;
    plates.forEach((p, n) => {
      p.classList.toggle('is-active', n === i);
      setBoost(n, n === i ? nudge : 0);
    });
    const noted = i == null ? NOTE_REST : i;
    ops.forEach((o, n) => {
      o.classList.toggle('is-active', n === i);
      o.classList.toggle('is-noted', n === noted);
    });
    if (status) {
      status.textContent =
        i == null
          ? HINT
          : `${plates[i].getAttribute('aria-label')}${DRIVERS[i] ? ' — drag it: the matching label row follows' : ''}`;
    }
  }

  /* ── tah ────────────────────────────────────────────────────────────── */

  const springs = plates.map(() => null);

  function release(i) {
    springs[i]?.kill();
    const from = { ...drag[i] };
    if (reduced) {
      drag[i] = { x: 0, y: 0 };
      applyPlate(i);
      syncLabel(i);
      return;
    }
    springs[i] = gsap.to(from, {
      x: 0,
      y: 0,
      duration: 0.9,
      ease: 'elastic.out(1, 0.55)',
      onUpdate() {
        drag[i] = { x: from.x, y: from.y };
        applyPlate(i);
        syncLabel(i);
      },
    });
  }

  plates.forEach((plate, i) => {
    let pointerId = null;
    let startX = 0;
    let startY = 0;

    plate.addEventListener('pointerdown', (e) => {
      // Coarse pointer: tah by na dotyku ukradl vertikální scroll. Tam je
      // interakce tap → izolace, což je i doporučená degradace pro cursor.
      if (!isFinePointer()) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      springs[i]?.kill();
      plate.setPointerCapture(e.pointerId);
      highlight(i);
      e.preventDefault();
    });

    plate.addEventListener('pointermove', (e) => {
      if (pointerId !== e.pointerId) return;
      // Vrstvy se jen posouvají, nezkosují — posun kurzoru je tedy zároveň
      // posun v souřadnicích kádru a žádný přepočet nepotřebuje.
      drag[i].x = e.clientX - startX;
      drag[i].y = e.clientY - startY;
      applyPlate(i);
      syncLabel(i);
    });

    const end = (e) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      release(i);
    };
    plate.addEventListener('pointerup', end);
    plate.addEventListener('pointercancel', end);

    plate.addEventListener('click', () => {
      if (isFinePointer()) return;
      highlight(plate.classList.contains('is-active') ? null : i);
    });

    plate.addEventListener('pointerenter', () => {
      if (pointerId == null && isFinePointer()) highlight(i);
    });
    plate.addEventListener('pointerleave', () => {
      if (pointerId == null && isFinePointer()) highlight(null);
    });
    plate.addEventListener('focus', () => highlight(i));
    plate.addEventListener('blur', () => {
      highlight(null);
      if (drag[i].x || drag[i].y) release(i);
    });

    /* Klávesnice dostane totéž, co myš: šipky vrstvou hýbou po 8 px kádru,
       takže i bez ukazovátka je vidět, že se label přepisuje. */
    plate.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 24 : 8;
      const moves = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (moves[e.key]) {
        springs[i]?.kill();
        drag[i].x += moves[e.key][0];
        drag[i].y += moves[e.key][1];
        applyPlate(i);
        syncLabel(i);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        release(i);
      }
    });
  });

  ops.forEach((op, i) => {
    if (!op) return;
    op.addEventListener('pointerenter', () => highlight(i));
    op.addEventListener('pointerleave', () => highlight(null));
    op.querySelector('.op__btn')?.addEventListener('focus', () => highlight(i));
    op.querySelector('.op__btn')?.addEventListener('blur', () => highlight(null));
  });

  /* ── scrub ──────────────────────────────────────────────────────────── */

  measure();
  setOpen(open);
  if (status) status.textContent = HINT;

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      const before = frame;
      measure();
      setOpen(open);
      /* Tah je v px kádru; když se kádr přeměřil, poměr by se rozešel
         s labelem. Přepočítat je levnější než dopočítávat rozdíl. */
      if (before !== frame) plates.forEach((_, i) => syncLabel(i));
      if (!reduced) ScrollTrigger.refresh();
    });
  });

  if (!reduced) {
    /* Oba konce jsou kotvené na HORNÍ hranu prvku. Výška prvku se sice teď
       během scrubu nemění, ale `bottom …` by ho i tak svázalo s výškou
       railu vedle — a ten roste s délkou textu. */
    ScrollTrigger.create({
      trigger: stage,
      start: 'top 88%',
      end: 'top 22%',
      scrub: 0.6,
      onUpdate(self) {
        // Rozklad doběhne na 80 % rozsahu — zbytek dráhy je na to, aby
        // otevřený stack chvíli stál a šel uchopit dřív, než odjede z kádru.
        setOpen(clamp01(self.progress / 0.8));
      },
    });
    ScrollTrigger.refresh();
  }
}
