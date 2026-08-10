/* Kótovací geometrie pro sekci Measurement — build-time, do prohlížeče nejde.
 *
 * Vstup i výstup jsou souřadnice v NATIVNÍM kádru snímku 1920×1200, tedy v témže
 * prostoru, ve kterém jsou odečtené `outline` / `holes` v gui-demo-frames.js.
 * SVG overlay má viewBox nastavený přesně na crop okno assetu ("left top w h"),
 * takže se nic nepřepočítává a crop se s kótami nemůže rozejít — když se crop
 * změní v measure-sides.js, kóty jdou s ním.
 *
 * Konvence odpovídá technickému výkresu: vynášecí čáry od kótovaného prvku,
 * kótovací linka odsazená mimo díl, šikmé ryskové zakončení, hodnota nad linkou
 * a orientovaná s ní. Ne dekorace — každý bod je odvozený z naměřené geometrie.
 */

const deg = (rad) => (rad * 180) / Math.PI;
const r2 = (n) => +n.toFixed(2);
/** Úsečka pro SVG <line>. */
const seg = (a, b) => ({ x1: r2(a[0]), y1: r2(a[1]), x2: r2(b[0]), y2: r2(b[1]) });

function centroid(pts) {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

/** Jednotková normála hrany a→b odvrácená od bodu `away` (těžiště dílu). */
function outward(a, b, away) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const u = [dx / len, dy / len];
  let n = [-u[1], u[0]];
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const near = (s) => (mid[0] + n[0] * s - away[0]) ** 2 + (mid[1] + n[1] * s - away[1]) ** 2;
  if (near(1) < near(-1)) n = [-n[0], -n[1]];
  return { u, n, len, angle: deg(Math.atan2(dy, dx)) };
}

const add = (p, v, s) => [p[0] + v[0] * s, p[1] + v[1] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1];

/** Text nesmí stát na hlavě — kótu čteme zleva doprava nebo zdola nahoru. */
function readable(angle) {
  let a = angle;
  while (a > 90) a -= 180;
  while (a < -90) a += 180;
  return r2(a);
}

/**
 * Lineární kóta. `edge` udává směr a základnu kótovací linky, `from`/`to` jsou
 * kótované prvky (rohy dílu u rozměrů, středy děr u rozteče). Rozteč se tak
 * kótuje na hraně dílu jako ve výkresu, ne čárou přes díl.
 */
function linearDim({ id, label, text, from, to, edge, away, offset, tick = 20, labelGap = 30 }) {
  const [a, b] = edge;
  const { u, n, angle } = outward(a, b, away);
  // Kótovací linka = množina bodů s (q − a)·n = offset. Pata kótovaného bodu je
  // jeho průmět na tuhle linku ve směru normály.
  const foot = (p) => add(p, n, offset - dot([p[0] - a[0], p[1] - a[1]], n));
  const f1 = foot(from);
  const f2 = foot(to);
  // Ryska = 45° ke kótovací lince, tedy směr `u` pootočený o 45°.
  const s = Math.SQRT1_2;
  const t = [(u[0] - u[1]) * s, (u[0] + u[1]) * s];
  const mid = [(f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2];
  const at = add(mid, n, labelGap);

  return {
    id,
    label,
    text,
    kind: 'linear',
    // Vynášecí čáry: od prvku (s malou mezerou) až za kótovací linku.
    ext: [seg(add(from, n, 8), add(f1, n, 12)), seg(add(to, n, 8), add(f2, n, 12))],
    line: seg(f1, f2),
    ticks: [
      seg(add(f1, t, -tick / 2), add(f1, t, tick / 2)),
      seg(add(f2, t, -tick / 2), add(f2, t, tick / 2)),
    ],
    hit: seg(f1, f2),
    at: { x: r2(at[0]), y: r2(at[1]) },
    rotate: readable(angle),
  };
}

/**
 * Kóta průměru díry: kružnice na naměřeném poloměru, odsazovací čára ven přes
 * `edge` (aby popis dosedl na pozadí, ne na kov), vodorovná police a hodnota.
 */
function diameterDim({ id, label, text, hole, edge, away, beyond = 50, shelf = 60, dir = 1 }) {
  const { cx, cy, r } = hole;
  const { n } = outward(edge[0], edge[1], away);
  // Kolik zbývá od středu díry k hraně dílu — police musí skončit ZA hranou,
  // jinak by hodnota ležela na kovu.
  const toEdge = Math.abs(dot([cx - edge[0][0], cy - edge[0][1]], n));
  const start = add([cx, cy], n, r);
  const knee = add([cx, cy], n, toEdge + beyond);
  const end = [knee[0] + dir * shelf, knee[1]];

  return {
    id,
    label,
    text,
    kind: 'diameter',
    circle: { cx: r2(cx), cy: r2(cy), r: r2(r) },
    ext: [],
    ticks: [],
    leader: seg(start, knee),
    shelf: seg(knee, end),
    hit: seg(start, end),
    at: { x: r2(end[0] + dir * 10), y: r2(end[1]) },
    anchor: dir > 0 ? 'start' : 'end',
    rotate: 0,
  };
}

/**
 * Kompletní sada kót pro jednu stranu dílu.
 * `outline` je 4 rohy po obvodu (P0 vlevo nahoře → po směru), takže P0→P1 je
 * kratší hrana (šířka) a P1→P2 delší (výška) — platí pro oba použité snímky.
 * Rozvržení je zvolené tak, aby se kóty navzájem nepřekrývaly: šířka nahoře,
 * výška vpravo, rozteč děr vlevo, průměr vyvedený spodní hranou doprava.
 */
export function buildDims(side) {
  const { outline, holes, measured, offset, labelGap = 30 } = side;
  const [p0, p1, p2, p3] = outline;
  const c = centroid(outline);
  const [h0, h1] = holes;
  const fmt = (v) => v.toFixed(2);
  const common = { away: c, offset, labelGap };

  return [
    linearDim({ id: 'width', label: 'Width', text: fmt(measured.width), from: p0, to: p1, edge: [p0, p1], ...common }),
    linearDim({ id: 'height', label: 'Height', text: fmt(measured.height), from: p1, to: p2, edge: [p1, p2], ...common }),
    linearDim({
      id: 'hole-distance',
      label: 'Hole dist.',
      text: fmt(measured.holeDist),
      from: [h0.cx, h0.cy],
      to: [h1.cx, h1.cy],
      edge: [p3, p0],
      ...common,
    }),
    diameterDim({
      id: 'hole-diameter',
      label: 'Hole ⌀',
      text: `⌀ ${fmt(measured.holeDia)}`,
      hole: h1,
      edge: [p2, p3],
      away: c,
    }),
  ];
}

/** Měřítko snímku z delší hrany a naměřené výšky — doklad, ne ozdoba. */
export function pxPerMm(side) {
  const [, p1, p2] = side.outline;
  return +(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / side.measured.height).toFixed(2);
}
