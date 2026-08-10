/* Framy GUI Dema — 15 reálných snímků z inspekční komory.
 *
 * Geometrie je odečtená v NATIVNÍM kádru snímku 1920×1200 a v pixelech se
 * i používá: overlay je SVG s viewBox="0 0 1920 1200", takže se souřadnice
 * nemusí nikde přepočítávat a jsou nezávislé na výsledném rozlišení assetu.
 *
 *   outline  4 rohy dílu v pořadí po obvodu (rotovaný obdélník, ne bbox)
 *   holes    středy a poloměr díry; `ring` je vnější poloměr zahloubení a má ho
 *            JEN přední strana. Zadní strana je průchozí díra bez zahloubení,
 *            takže `ring` nemá — druhý kroužek by anotoval hranu, která na
 *            snímku neexistuje. drawMeasure() kreslí vnější kroužek podle
 *            přítomnosti `ring`, ne podle `side`.
 *   defects  bboxy otisků prstů; jen u NOK framů
 *
 * Detekční bbox pro ANALYZE se z `outline` dopočítá (min/max + padding), aby se
 * s obrysem nemohl rozejít.
 *
 * Naměřené hodnoty leží všechny uvnitř tolerance ±3 mm proti nominálu
 * (60 × 40 mm, ⌀ 6 mm, rozteč 25 mm), takže measurement vždy skončí PASS —
 * verdikt OK/NOK nese výhradně detekce defektu, ne metrologie.
 *
 * Dva framy nesou hodnoty odečtené z reálných běhů aplikace (logger na
 * .claude/context/context_images/measurement*.png) a slouží zároveň sekci
 * Measurement, která si je bere odsud přes measure-sides.js:
 *   front-03  62.08 / 41.02 / 6.10 / 25.20   `[16:18:54] … on front side`
 *   back-01   61.65 / 40.78 / 6.09 / 25.23   `[16:21:37] … on back side`
 * Kanonická front sada z konceptu (62.08 …) do 08-10 omylem sedla na back-01,
 * takže back stranu popisovala front čísla a reálná back data ležela nepoužitá
 * v loggeru na screenshotu. `angle` se NEPŘEROVNÁVAL — ten je odečtený z pózy
 * dílu na konkrétním snímku, ne z běhu měření.
 */

const NOMINAL = { height: 60.0, width: 40.0, holeDia: 6.0, holeDist: 25.0, tol: 3.0 };

export const frames = [
  // ── Zadní strana — hrubý oxidovaný povrch, díry bez zahloubení ──────────
  {
    id: 'back-01', slug: 'insp-back-01', side: 'back', verdict: 'OK',
    objectConfidence: 94.31, verdictConfidence: 99.62,
    outline: [[972, 155], [1338, 300], [1118, 850], [752, 700]],
    holes: [{ cx: 1045, cy: 363, r: 27 }, { cx: 952, cy: 592, r: 27 }],
    defects: [],
    measured: { height: 61.65, width: 40.78, holeDia: 6.09, holeDist: 25.23, angle: 68.2 },
  },
  {
    id: 'back-02', slug: 'insp-back-02', side: 'back', verdict: 'OK',
    objectConfidence: 92.87, verdictConfidence: 99.41,
    outline: [[1218, 133], [1600, 5], [1780, 565], [1398, 690]],
    holes: [{ cx: 1412, cy: 248, r: 26 }, { cx: 1492, cy: 485, r: 27 }],
    defects: [],
    measured: { height: 61.74, width: 40.86, holeDia: 6.04, holeDist: 25.05, angle: 107.8 },
  },
  {
    id: 'back-03', slug: 'insp-back-03', side: 'back', verdict: 'OK',
    objectConfidence: 95.16, verdictConfidence: 99.78,
    outline: [[383, 35], [890, 325], [680, 655], [196, 363]],
    holes: [{ cx: 455, cy: 240, r: 26 }, { cx: 672, cy: 362, r: 27 }],
    defects: [],
    measured: { height: 62.31, width: 41.15, holeDia: 6.12, holeDist: 25.34, angle: 150.2 },
  },
  {
    id: 'back-04', slug: 'insp-back-04', side: 'back', verdict: 'OK',
    objectConfidence: 93.44, verdictConfidence: 99.55,
    outline: [[862, 113], [1222, 268], [1000, 790], [645, 640]],
    holes: [{ cx: 938, cy: 318, r: 26 }, { cx: 845, cy: 545, r: 27 }],
    defects: [],
    measured: { height: 61.95, width: 40.72, holeDia: 5.98, holeDist: 24.91, angle: 67.0 },
  },
  {
    id: 'back-05', slug: 'insp-back-05', side: 'back', verdict: 'OK',
    objectConfidence: 91.98, verdictConfidence: 99.24,
    outline: [[940, 655], [1512, 533], [1590, 908], [1015, 1030]],
    holes: [{ cx: 1152, cy: 850, r: 27 }, { cx: 1395, cy: 795, r: 27 }],
    defects: [],
    measured: { height: 62.44, width: 41.28, holeDia: 6.15, holeDist: 25.42, angle: 12.0 },
  },

  // ── Přední strana, čistá — broušený povrch, zahloubené díry ─────────────
  {
    id: 'front-01', slug: 'insp-front-01', side: 'front', verdict: 'OK',
    objectConfidence: 96.02, verdictConfidence: 99.86,
    outline: [[955, 105], [1168, 432], [672, 735], [468, 412]],
    holes: [{ cx: 740, cy: 518, r: 33, ring: 57 }, { cx: 952, cy: 388, r: 33, ring: 57 }],
    defects: [],
    measured: { height: 62.20, width: 41.10, holeDia: 6.22, holeDist: 25.18, angle: 32.2 },
  },
  {
    id: 'front-02', slug: 'insp-front-02', side: 'front', verdict: 'OK',
    objectConfidence: 94.77, verdictConfidence: 99.71,
    outline: [[1495, 48], [1748, 555], [1398, 730], [1148, 215]],
    holes: [{ cx: 1428, cy: 258, r: 33, ring: 57 }, { cx: 1538, cy: 478, r: 33, ring: 57 }],
    defects: [],
    measured: { height: 61.86, width: 40.95, holeDia: 6.16, holeDist: 24.97, angle: 116.5 },
  },
  {
    id: 'front-03', slug: 'insp-front-03', side: 'front', verdict: 'OK',
    objectConfidence: 97.13, verdictConfidence: 99.91,
    outline: [[462, 218], [868, 222], [852, 808], [455, 805]],
    holes: [{ cx: 705, cy: 388, r: 33, ring: 57 }, { cx: 700, cy: 632, r: 33, ring: 57 }],
    defects: [],
    measured: { height: 62.08, width: 41.02, holeDia: 6.10, holeDist: 25.20, angle: 89.3 },
  },
  {
    id: 'front-04', slug: 'insp-front-04', side: 'front', verdict: 'OK',
    objectConfidence: 95.60, verdictConfidence: 99.80,
    outline: [[398, 160], [790, 120], [878, 690], [487, 742]],
    holes: [{ cx: 568, cy: 312, r: 33, ring: 57 }, { cx: 600, cy: 548, r: 33, ring: 57 }],
    defects: [],
    measured: { height: 61.92, width: 40.79, holeDia: 6.07, holeDist: 24.88, angle: 98.8 },
  },
  {
    id: 'front-05', slug: 'insp-front-05', side: 'front', verdict: 'OK',
    objectConfidence: 93.89, verdictConfidence: 99.58,
    outline: [[1338, 340], [1730, 378], [1652, 940], [1262, 900]],
    holes: [{ cx: 1548, cy: 538, r: 33, ring: 57 }, { cx: 1518, cy: 772, r: 33, ring: 57 }],
    defects: [],
    measured: { height: 62.11, width: 41.18, holeDia: 6.20, holeDist: 25.24, angle: 82.1 },
  },

  // ── Přední strana s fingerprint defektem ────────────────────────────────
  {
    id: 'defect-01', slug: 'insp-defect-01', side: 'front', verdict: 'NOK',
    objectConfidence: 95.08, verdictConfidence: 93.74,
    outline: [[800, 168], [1178, 325], [930, 855], [555, 700]],
    holes: [{ cx: 877, cy: 378, r: 33, ring: 57 }, { cx: 773, cy: 600, r: 33, ring: 57 }],
    defects: [
      { x: 740, y: 215, w: 175, h: 240, confidence: 93.74 },
      { x: 930, y: 335, w: 160, h: 170, confidence: 88.41 },
    ],
    measured: { height: 62.25, width: 41.42, holeDia: 6.31, holeDist: 25.20, angle: 64.9 },
  },
  {
    id: 'defect-02', slug: 'insp-defect-02', side: 'front', verdict: 'NOK',
    objectConfidence: 94.35, verdictConfidence: 92.93,
    outline: [[912, 300], [1275, 157], [1487, 690], [1122, 840]],
    holes: [{ cx: 1112, cy: 405, r: 33, ring: 57 }, { cx: 1197, cy: 635, r: 33, ring: 57 }],
    defects: [
      { x: 960, y: 262, w: 125, h: 260, confidence: 92.93 },
      { x: 1170, y: 255, w: 145, h: 200, confidence: 89.43 },
    ],
    measured: { height: 61.88, width: 41.05, holeDia: 6.24, holeDist: 25.11, angle: 111.7 },
  },
  {
    id: 'defect-03', slug: 'insp-defect-03', side: 'front', verdict: 'NOK',
    objectConfidence: 96.41, verdictConfidence: 91.06,
    outline: [[1297, 413], [1690, 437], [1665, 1010], [1272, 988]],
    holes: [{ cx: 1527, cy: 590, r: 33, ring: 57 }, { cx: 1512, cy: 845, r: 33, ring: 57 }],
    defects: [
      { x: 1320, y: 745, w: 145, h: 210, confidence: 91.06 },
      { x: 1555, y: 780, w: 117, h: 220, confidence: 90.22 },
    ],
    measured: { height: 62.15, width: 40.94, holeDia: 6.18, holeDist: 25.48, angle: 87.5 },
  },
  {
    id: 'defect-04', slug: 'insp-defect-04', side: 'front', verdict: 'NOK',
    objectConfidence: 93.62, verdictConfidence: 94.85,
    outline: [[258, 392], [630, 270], [822, 822], [448, 948]],
    holes: [{ cx: 540, cy: 478, r: 33, ring: 57 }, { cx: 622, cy: 712, r: 33, ring: 57 }],
    defects: [
      { x: 435, y: 635, w: 143, h: 227, confidence: 94.85 },
      { x: 655, y: 570, w: 117, h: 275, confidence: 87.19 },
    ],
    measured: { height: 62.02, width: 41.33, holeDia: 6.27, holeDist: 25.06, angle: 109.2 },
  },
  {
    id: 'defect-05', slug: 'insp-defect-05', side: 'front', verdict: 'NOK',
    objectConfidence: 95.74, verdictConfidence: 90.38,
    outline: [[672, 85], [888, 405], [390, 730], [180, 398]],
    holes: [{ cx: 452, cy: 502, r: 33, ring: 57 }, { cx: 668, cy: 375, r: 33, ring: 57 }],
    defects: [
      { x: 285, y: 300, w: 190, h: 155, confidence: 90.38 },
      { x: 338, y: 515, w: 254, h: 125, confidence: 92.60 },
    ],
    measured: { height: 61.79, width: 40.88, holeDia: 6.09, holeDist: 25.29, angle: 32.5 },
  },
];

export const FRAME_W = 1920;
export const FRAME_H = 1200;
export { NOMINAL };
