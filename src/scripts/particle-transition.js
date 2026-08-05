import { ScrollTrigger, prefersReducedMotion } from './lib/motion.js';

/**
 * Particle Field Transformation.
 *
 * Renderovací strategie: částice se zapisují po jednom pixelu do offscreen
 * ImageData o velikosti BUF², které se pak jedním `drawImage` roztáhne na
 * canvas s bilineárním filtrem. Tím je cena jednoho framu konstantní
 * (nezávislá na DPR i na velikosti viewportu), takže 4K stojí stejně jako
 * 1080p, a při progressu 0 % / 100 % je zápis bijektivní — každá částice sedí
 * na vlastním pixelu, takže výsledek JE zdrojový obraz, ne tečkovaná mřížka.
 * Původní verze psala 14 400 izolovaných 1px pixelů do bufferu v device
 * rozlišení (~1800×1100), tedy plnila 0,7 % plochy → tečkovaný šum.
 */

/* Grid = plošné rozlišení particle fieldu. 384² → ~66k částic po cullu.
   Oba framy jsou v assetech 512², takže grid 384 vzorkuje reálný obsah;
   výš už by se jen zvyšovalo CPU za detail, který v 256px GAN výstupu
   nikdy nebyl. */
const GRID = 384;
/* Volný okraj bufferu, aby rozptýlené částice nevypadly z kádru. Rozptyl je
   převážně tangenciální (viz níž), takže stačí ~19 % gridu; radiální explozí
   by tady musel být PAD dvojnásobný a obraz by se pak na plate scvrkl. */
const PAD = 72;
const BUF = GRID + PAD * 2;
/* Pod touto hodnotou progressu se kreslí ostrý bitmap místo particle fieldu —
   při env ≈ 0 sedí každá částice na vlastním pixelu, takže obě cesty jsou
   geometricky totožné a přechod je bezešvý. Krajní polohy tak nejsou
   limitované rozlišením gridu. */
const SHARP_EPS = 0.004;
/* Pod tímto jasem je pixel fotografické pozadí, ne díl. Histogramy oba framy
   dělí čistě bimodálně (backdrop < 70, kov > 110), takže cull odstraní i to,
   že zdrojový frame má šedý kartonový backdrop a cílový černé pozadí —
   částicuje se jen samotný díl na --bg-deep. */
const LUMA_CULL = 80;
const MAX_DPR = 2;
/* --accent #7B6EF6 — tint chaotické fáze. */
const ACC_R = 123;
const ACC_G = 110;
const ACC_B = 246;

const SRC_IMAGE = '/images/transition-src.webp';
const TGT_IMAGE = '/images/transition-gan.webp';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Vykresli frame do čtverce `size` COVER cropem (ne stretchem — oba framy
 *  jsou 1:1, ale invariant musí platit i pro dodaný Blender render s jiným
 *  aspectem; jinak by se každý deformoval jinak a interpolace by nečetla
 *  jako přeuspořádání téhož dílu). */
function squareCanvas(img, size, willRead) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: !!willRead });
  const s = Math.max(size / img.width, size / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return { c, ctx };
}

/** Bitmap pro krajní polohy, s odmaskovaným pozadím ve STEJNÉM prahu jako
 *  particle field. Bez toho by na 0 % svítil šedý kartonový backdrop
 *  zdrojové fotky, který v particle fázi (culled) chybí — a přepnutí na
 *  ostrý bitmap by tím pádem viditelně bliklo.
 *  Feather jde POUZE nahoru od prahu (80 → 120), ne symetricky: šedý
 *  backdrop zdrojové fotky sahá k jasu ~70, takže symetrický feather by ho
 *  vrátil zpět jako průsvitný závoj. Rampa vzhůru zároveň vyhladí zubatou
 *  siluetu na hraně GAN dílu, kde jas kolem prahu šumí. */
function culledBitmap(img) {
  const size = 512;
  const { c, ctx } = squareCanvas(img, size, true);
  const d = ctx.getImageData(0, 0, size, size);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const l = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
    const a = (l - LUMA_CULL) / 40;
    px[i + 3] = a <= 0 ? 0 : a >= 1 ? 255 : a * 255;
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

/** Odečti frame na GRID² a vrať jen pixely dílu, seřazené pro korespondenci. */
function readFrame(img) {
  const { ctx } = squareCanvas(img, GRID, true);
  const { data } = ctx.getImageData(0, 0, GRID, GRID);

  const pts = [];
  let sx = 0;
  let sy = 0;
  for (let i = 0, px = 0; px < GRID * GRID; px++, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = (r * 299 + g * 587 + b * 114) / 1000;
    if (l <= LUMA_CULL) continue;
    const x = px % GRID;
    const y = (px / GRID) | 0;
    pts.push({ x, y, r, g, b, l });
    sx += x;
    sy += y;
  }
  if (!pts.length) return null;

  const cx = sx / pts.length;
  const cy = sy / pts.length;

  /* Korespondence zdroj→cíl. Původní kód měl x1 === x0 pro každou částici,
     takže se nikdy nic nepřeuspořádalo — byl to crossfade s třesem.
     Tady se oba seznamy seřadí polárně kolem svého centroidu (úhel v 240
     bucketech, uvnitř bucketu podle radiusu) a pak se spárují podle ranku.
     Výsledek je spojité polární přemapování: částice na jednom paprsku
     zdroje míří na odpovídající paprsek cíle, takže tok čitelně reflowuje
     místo aby náhodně přeskakoval napříč kádrem. */
  const BUCKETS = 240;
  for (const p of pts) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const ang = Math.atan2(dy, dx) + Math.PI; // 0..2π
    p.rad = Math.hypot(dx, dy);
    p.key = ((ang / (Math.PI * 2)) * BUCKETS) | 0;
  }
  pts.sort((a, b) => a.key - b.key || a.rad - b.rad);

  return { pts, cx, cy };
}

/** Deterministický per-index hash → [0,1). Nahrazuje sin(i·0.17), které bylo
 *  periodické v indexu, a tvořilo tak moiré pruhy podle řádků gridu. */
function hash(i) {
  let h = (i * 2654435761) & 0xffffffff;
  h ^= h >>> 15;
  h = (h * 2246822519) & 0xffffffff;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/* Dramaturgie podle konceptu: 0 % celistvý obraz · 30 % se začíná rozpadat
   · 60 % chaos · 100 % složeno. Exponent 2,2 na nástupu drží obraz čitelný
   dlouho do první třetiny (env 0,03 na 10 %, 0,26 na 30 % — na 30 % je díl
   ještě rozeznatelný včetně obou děr) a teprve pak akceleruje;
   plateau 55–68 % je držený chaos. Původní symetrický
   easeInOutQuad neměl plateau ani zdržení — na 30 % už bylo rozprášeno
   všechno a celý oblouk působil plochý.
   Kolaps musí dosáhnout nuly do 95 %, ne až do 100 %: krajní polohy kreslí
   ostrý bitmap (SHARP_EPS) a kdyby v 95 % ještě zbýval rozptyl, přepnutí
   na bitmap by poskočilo. */
function envelope(p) {
  if (p <= 0 || p >= 0.95) return 0;
  if (p < 0.55) return (p / 0.55) ** 2.2;
  if (p < 0.68) return 1;
  return 1 - ((p - 0.68) / 0.27) ** 1.4;
}

/** Pozice A→B, easeInOutCubic. */
function mixEase(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/* Okno citátu 30–60 %: nástup 30–40 %, drží 40–50 %, odchod do 60 %.
   Sedí přes fázi rozpadu — otázka „co kdyby" zní ve chvíli, kdy se starý
   řád rozsypává. Do 60 %, kde je chaos na maximu, je citát už venku, takže
   vrchol vizuální energie nikdo nepřekrývá. */
function quoteAmount(p) {
  if (p < 0.3 || p > 0.6) return 0;
  if (p < 0.4) return (p - 0.3) / 0.1;
  if (p < 0.5) return 1;
  return 1 - (p - 0.5) / 0.1;
}

export default function init(root) {
  const canvas = root.querySelector('[data-particle-canvas]');
  const frames = root.querySelector('[data-particle-frames]');
  const quote = root.querySelector('[data-transition-text]');
  const pct = root.querySelector('[data-ptf-pct]');

  /* `(pointer: coarse)` je přesný test na touch. Původní gate byl
     isFinePointer() === (hover: hover) and (pointer: fine), což shodí do
     fallbacku i prohlížeč, který hlásí `pointer: none` (headless Chrome,
     některé desktopové sestavy) — a tím pádem particle varianta nikdy
     nedostala příležitost běžet a odladit se. */
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  const framesHome = frames?.parentNode ?? null;

  /** Přepni sekci do daného režimu a vyhoď nepoužitou variantu z DOM.
   *  Odstranění z DOM (ne `hidden`, ne class) je jediný mechanismus, který
   *  nejde přebít specificitou — fallback a canvas tak nemohou být nikdy
   *  v layoutu současně, v žádném režimu. */
  const setMode = (mode) => {
    root.dataset.ptfMode = mode;
    if (mode === 'particles') {
      frames?.remove();
    } else {
      canvas?.remove();
      /* particles režim se nastavuje optimisticky, ještě než dojdou obrázky —
         když načtení selže, framy se musí vrátit zpět do plate. */
      if (frames && !frames.isConnected && framesHome) framesHome.prepend(frames);
    }
    ScrollTrigger.refresh();
  };

  const setVars = (p) => {
    const q = quoteAmount(p);
    root.style.setProperty('--lp', p.toFixed(4));
    root.style.setProperty('--q', q.toFixed(3));
    if (quote) quote.setAttribute('aria-hidden', q > 0.5 ? 'false' : 'true');
    if (pct) {
      const v = Math.round(p * 100);
      const next = `transform ${String(v).padStart(3, '0')}%`;
      if (pct.textContent !== next) pct.textContent = next;
    }
  };

  if (prefersReducedMotion()) {
    setMode('static');
    return;
  }

  if (coarse) {
    setMode('crossfade');
    ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => setVars(self.progress),
      onRefresh: (self) => setVars(self.progress),
    });
    return;
  }

  /* Režim se přepíná hned, ne až po načtení obrázků: sekce v particle režimu
     měří 280vh a pinuje se, ve statickém je vysoká jako obsah. Kdyby se
     atribut nastavil až v .then(), skočil by layout právě v momentě, kdy
     k sekci dojíždí scroll. Plate je tmavý, takže prázdný canvas do doby
     prvního renderu splývá s --bg-deep. */
  setMode('particles');

  Promise.all([loadImage(SRC_IMAGE), loadImage(TGT_IMAGE)])
    .then(([imgA, imgB]) => {
      const A = readFrame(imgA);
      const B = readFrame(imgB);
      if (!A || !B) throw new Error('empty frame after luma cull');

      const nA = A.pts.length;
      const nB = B.pts.length;
      /* Počty se liší (27,6k vs 31,2k), proto se indexuje podílem, ne modulem:
         modulo by po přetečení kratšího seznamu smyklo ~11 % částic přes celý
         kádr. Podíl je monotónní — část zdrojových pixelů se zdvojí, žádný
         se nepřeskočí. */
      const n = Math.max(nA, nB);

      const x0 = new Float32Array(n);
      const y0 = new Float32Array(n);
      const x1 = new Float32Array(n);
      const y1 = new Float32Array(n);
      const dx = new Float32Array(n);
      const dy = new Float32Array(n);
      const c0 = new Uint8Array(n * 3);
      const c1 = new Uint8Array(n * 3);
      const lum = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
        const a = A.pts[((i / n) * nA) | 0];
        const b = B.pts[((i / n) * nB) | 0];
        x0[i] = a.x + PAD;
        y0[i] = a.y + PAD;
        x1[i] = b.x + PAD;
        y1[i] = b.y + PAD;
        const j = i * 3;
        c0[j] = a.r; c0[j + 1] = a.g; c0[j + 2] = a.b;
        c1[j] = b.r; c1[j + 1] = b.g; c1[j + 2] = b.b;
        lum[i] = (a.l + b.l) / 2;

        /* Rozptyl je převážně TANGENCIÁLNÍ: každá částice se otočí kolem
           centroidu o vlastní úhel (±1,0 rad) a mírně změní radius
           (−30 %…+15 %, tedy s biasem dovnitř). Čistě radiální exploze by
           kádr rozfoukala a vynutila si dvojnásobný PAD; smyk okolo středu
           drží cloud v komoře a čte se jako „částice hledají novou pozici",
           ne jako výbuch. */
        const vx = a.x - A.cx;
        const vy = a.y - A.cy;
        const phi = (hash(i) - 0.5) * 2.0;
        const rho = 0.7 + hash(i + 0x9e37) * 0.45;
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);
        dx[i] = (vx * cp - vy * sp) * rho - vx;
        dy[i] = (vx * sp + vy * cp) * rho - vy;
      }

      const sharpA = culledBitmap(imgA);
      const sharpB = culledBitmap(imgB);

      const ctx = canvas.getContext('2d', { alpha: true });
      const off = document.createElement('canvas');
      off.width = BUF;
      off.height = BUF;
      const offCtx = off.getContext('2d');
      const imgData = offCtx.createImageData(BUF, BUF);
      const buf = imgData.data;

      let progress = 0;
      let lastP = -1;
      let active = false;
      let raf = 0;

      /* Rozměry se čtou z layoutu, ne při načtení obrázků — rozbitý layout
         dřív dával cw ≈ 50 px a z něj scaleX ≈ 0.4, takže se celý obraz
         složil do levého horního rohu. */
      function resize() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        if (w !== canvas.width || h !== canvas.height) {
          canvas.width = w;
          canvas.height = h;
          ctx.imageSmoothingEnabled = true;
          /* 'medium' záměrně, ne 'high'. Měřeno na 1600×950 @ DPR 2:
             s 'high' dával particle field 24 fps, s 'medium' 55 fps, přičemž
             cena drawImage uvnitř render() je v obou případech pod 0,1 ms —
             ten rozdíl padá celý na resampling v kompozitoru, ne do JS.
             Particle cloud navíc nemá vysokofrekvenční detail, který by
             z kvalitnějšího filtru profitoval. */
          ctx.imageSmoothingQuality = 'medium';
          lastP = -1;
        }
        return true;
      }

      /* Mapování bufferu na canvas: BUF² → celý canvas, takže oblast gridu
         (obraz) leží uvnitř s okrajem PAD. Ostrá varianta krajních poloh
         musí kreslit do přesně stejného rectu, jinak by přechod poskočil. */
      function gridRect() {
        const s = canvas.width / BUF;
        return { x: PAD * s, y: PAD * s, d: GRID * s };
      }

      function render(time) {
        const p = progress;
        const env = envelope(p);
        const mix = mixEase(p);

        /* Krajní polohy: ostrý bitmap v plném rozlišení canvasu. Splňuje
           „při 0 % celistvý source obrázek, při 100 % celistvý GAN výstup",
           bez ohledu na rozlišení gridu. */
        if (p <= SHARP_EPS || p >= 1 - SHARP_EPS) {
          const g = gridRect();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(p <= SHARP_EPS ? sharpA : sharpB, g.x, g.y, g.d, g.d);
          buf.fill(0); // ať trail nezačne z ustáleného framu
          return;
        }

        if (env > 0.05) {
          /* Motion trail — místo tvrdého clearu se doznívá alfa. Drží se jen
             v chaotické fázi; na krajích musí být obraz čistý. */
          for (let j = 3; j < buf.length; j += 4) buf[j] = buf[j] * 0.5;
        } else {
          buf.fill(0);
        }

        /* Chaotický vektor se pomalu otáčí → cloud víří. Jedna dvojice
           sin/cos na frame, ne 31k jako u per-částicového šumu. */
        const th = time * 0.00022 * env;
        const cth = Math.cos(th);
        const sth = Math.sin(th);

        for (let i = 0; i < n; i++) {
          const ox = dx[i];
          const oy = dy[i];
          const bx = x0[i] + (x1[i] - x0[i]) * mix + (ox * cth - oy * sth) * env;
          const by = y0[i] + (y1[i] - y0[i]) * mix + (ox * sth + oy * cth) * env;
          const px = bx | 0;
          const py = by | 0;
          if (px < 0 || px >= BUF || py < 0 || py >= BUF) continue;

          const j = i * 3;
          let r = c0[j] + (c1[j] - c0[j]) * mix;
          let g = c0[j + 1] + (c1[j + 1] - c0[j + 1]) * mix;
          let b = c0[j + 2] + (c1[j + 2] - c0[j + 2]) * mix;

          if (env > 0) {
            /* Indigo tint proporčně ke TMAVOSTI částice: kovové odlesky
               zůstanou ocelové, midtony a stíny jdou do accentu. Uniformní
               wash by kov zploštil. */
            const k = env * 0.62 * (1 - lum[i] / 255);
            r += (ACC_R - r) * k;
            g += (ACC_G - g) * k;
            b += (ACC_B - b) * k;
          }

          /* Alfa: plná na krajích (frame musí být věrný obraz), v chaosu
             klesá podle jasu → světlé částice zůstanou pevné, tmavé
             přízračné. Nahrazuje velikost částice, kterou 1px zápis
             do bufferu nabídnout neumí. Pokles je mírný (max −43 % u nejtmavší
             částice), jinak se cloud v chaotické fázi rozplyne do neviditelna. */
          const idx = (py * BUF + px) * 4;
          const a = env > 0 ? 255 - env * (110 - lum[i] * 0.3) : 255;
          buf[idx] = r;
          buf[idx + 1] = g;
          buf[idx + 2] = b;
          if (a > buf[idx + 3]) buf[idx + 3] = a;
        }

        offCtx.putImageData(imgData, 0, 0);
        /* 'copy' místo clearRect + source-over: jeden průchod místo dvou přes
           celou plochu canvasu, což na 4K / vysokém DPR není zanedbatelné. */
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(off, 0, 0, BUF, BUF, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      function frame(time) {
        if (!active) return;
        /* Dirty check — původní smyčka přeplňovala buffer 60× za sekundu
           i při nezměněném progressu. Kreslí se, když se progress hnul,
           nebo když víří chaos (tam je pohyb i beze scrollu). */
        if (progress !== lastP || envelope(progress) > 0.05) {
          if (resize()) {
            render(time);
            lastP = progress;
          }
        }
        raf = requestAnimationFrame(frame);
      }

      const start = () => {
        if (active) return;
        active = true;
        lastP = -1;
        raf = requestAnimationFrame(frame);
      };
      /** ScrollTrigger deaktivuje trigger v momentě, kdy progress dosáhne
       *  krajní hodnoty — rAF smyčka se tedy zastaví PŘED vykreslením
       *  ustáleného framu a v komoře zůstane zamrzlý chaos (přesně to se
       *  dělo na 100 %). Proto se při zastavení dokresluje ručně. */
      const stop = (settled) => {
        active = false;
        cancelAnimationFrame(raf);
        progress = settled;
        setVars(progress);
        lastP = progress;
        if (resize()) render(performance.now());
      };

      const st = ScrollTrigger.create({
        trigger: root,
        /* Kryje se 1:1 se sticky oknem: 'top top' = moment, kdy sticky
           zabere, 'bottom bottom' = kdy pustí. Proto je scroll nahoru
           symetrický ke scrollu dolů. Žádný `pin` — pinuje CSS sticky
           (viz komentář v PipelineTransition.astro). */
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate(self) {
          progress = self.progress;
          setVars(progress);
        },
        onRefresh(self) {
          progress = self.progress;
          setVars(progress);
          lastP = -1;
        },
        /* onToggle místo onEnter/onLeave/onEnterBack/onLeaveBack: pokrývá
           i případ, kdy stránka nabootuje uvnitř sekce (scroll restore,
           #transition v URL) — tam žádný onEnter nefire a canvas zůstal
           černý. */
        onToggle(self) {
          if (self.isActive) start();
          else stop(self.progress >= 0.5 ? 1 : 0);
        },
      });

      /* První frame nakresli hned, ať sekce není černá, než do ní scroll dojde. */
      progress = st.progress;
      setVars(progress);
      if (resize()) render(0);
      if (st.isActive) start();

      if ('ResizeObserver' in window) {
        new ResizeObserver(() => {
          lastP = -1;
          if (resize() && !active) render(performance.now());
        }).observe(canvas);
      }

      /* Změna DPR (přetažení okna na jiný monitor / zoom) nezmění CSS rozměr,
         takže ResizeObserver nefire — hlídá se zvlášť. */
      window.addEventListener(
        'resize',
        () => {
          lastP = -1;
          if (resize() && !active) render(performance.now());
        },
        { passive: true }
      );
    })
    .catch((err) => {
      console.error('particle-transition: falling back to static frames', err);
      setMode('static');
    });
}
