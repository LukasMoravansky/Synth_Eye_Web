/* Sekce Measurement — dvě strany dílu, jeden zdroj pravdy.
 *
 * Snímky: reálné fotky z inspekční komory, TÉŽ sada, ze které losuje GUI demo
 * (`.claude/context/gui_demo/`). Dřív tu byly `measurement.png` /
 * `measurement_back.png`, což ale nejsou fotky dílu s kótami, nýbrž screenshoty
 * CELÉ PyQt aplikace ve světlém theme — díl v nich zabíral ~15 % plochy v levé
 * horní čtvrtině, zbytek byl bílý panel s loggerem. Kóty tedy padaly na text
 * loggeru a sekce si do tmavého webu vsadila světlý obdélník. Proto výběr:
 *
 *   front → insp-front-03 (Image_189) — díl je téměř osově zarovnaný, broušený
 *           povrch, díry se zahloubením; svislé/vodorovné kóty jsou nejčitelnější
 *   back  → insp-back-01  (Image_001) — naklopený ~22°, hrubý oxidovaný povrch,
 *           průchozí díra BEZ zahloubení; přepnutí tabu je tím vizuálně čitelné
 *
 * `crop` je v pixelech nativního kádru 1920×1200 a je posazený na naměřený bbox
 * dílu (poměr 4:5 u obou, aby přepnutí strany nepřelilo layout). Sdílí ho
 * build-assets.mjs (extract) i Measurement.astro (viewBox SVG overlaye), takže
 * kóty a crop nemohou vyjít z jiných čísel.
 *
 *   front-03  bbox 455→868 × 218→808   crop 270,23  784×980   díl 60 % výšky
 *   back-01   bbox 752→1338 × 155→850  crop 629,0   832×1040  díl 67 % výšky
 *
 * `offset` = odsazení kótovací linky od hrany dílu v px kádru; u back je menší,
 * protože naklopený díl nechává po stranách jen ~123 px místa proti 186 u front.
 */
import { frames, NOMINAL } from './gui-demo-frames.js';

const VIEWS = [
  {
    side: 'front',
    slug: 'measure-front',
    frameId: 'front-03',
    source: 'Image_189',
    crop: { left: 270, top: 23, width: 784, height: 980 },
    method: 'hough_circles',
    offset: 74,
    labelGap: 30,
  },
  {
    side: 'back',
    slug: 'measure-back',
    frameId: 'back-01',
    source: 'Image_001',
    crop: { left: 629, top: 0, width: 832, height: 1040 },
    method: 'contour_analysis',
    offset: 58,
    labelGap: 26,
  },
];

export const MEASURE_CROPS = VIEWS.map(({ slug, source, crop }) => ({ slug, source, crop }));

/** Kótované rozměry v pořadí, ve kterém stojí gauges. */
export const DIM_SPECS = [
  { id: 'height', label: 'Height', key: 'height', ref: NOMINAL.height },
  { id: 'width', label: 'Width', key: 'width', ref: NOMINAL.width },
  { id: 'hole-diameter', label: 'Hole ⌀', key: 'holeDia', ref: NOMINAL.holeDia },
  { id: 'hole-distance', label: 'Hole dist.', key: 'holeDist', ref: NOMINAL.holeDist },
];

export const TOLERANCE = NOMINAL.tol;

export const sides = VIEWS.map((view) => {
  const frame = frames.find((f) => f.id === view.frameId);
  if (!frame) throw new Error(`measure-sides: frame ${view.frameId} chybí v gui-demo-frames.js`);
  return {
    ...view,
    outline: frame.outline,
    holes: frame.holes,
    measured: frame.measured,
    objectConfidence: frame.objectConfidence,
    detectionLabel: view.side === 'front' ? 'Cls_Obj_Front_Side' : 'Cls_Obj_Back_Side',
  };
});
