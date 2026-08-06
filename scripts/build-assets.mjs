import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTEXT = path.join(ROOT, '.claude', 'context');
// Rozložené prezentační SVG — texty, šipky a rámečky odstraněné, zůstal obraz.
const DEC = path.join(CONTEXT, 'context_images', 'decomposed');
const OUT = path.join(ROOT, 'public', 'images');
const DATA_DIR = path.join(ROOT, 'src', 'data');

// --bg-deep, pozadí sekcí. Sem se slévá alfa transition framů.
const BG_DEEP = { r: 8, g: 8, b: 12 };

/* Naměřené středy dílu v syntetických dlaždicích 480×300 (prahování: saturace
   > 26 nebo luma > 95 — zachytí díl i jeho zapečený bbox). Číslování odpovídá
   pozici v původní mřížce na slidu, takže pořadí je stabilní. */
const TILE_CENTERS = {
  'front-01': [280, 161], 'front-02': [198, 148], 'front-03': [353, 179], 'front-04': [269, 139],
  'front-05': [247, 114], 'front-06': [184, 190], 'front-07': [351, 116], 'front-08': [326, 182],
  'back-01': [347, 183], 'back-02': [266, 188], 'back-03': [172, 138], 'back-04': [325, 180],
  'back-05': [314, 145], 'back-06': [239, 178], 'back-07': [242, 169], 'back-08': [309, 133],
};
const TILE_CROP = { w: 200, h: 250, frameW: 480, frameH: 300 };

function synthTiles() {
  const { w, h, frameW, frameH } = TILE_CROP;
  return Object.entries(TILE_CENTERS).map(([name, [cx, cy]]) => ({
    src: path.join(DEC, 'pipeline-synthetic', `${name}.jpg`),
    slug: `synth-${name}`,
    max: h,
    crop: {
      left: Math.max(0, Math.min(frameW - w, Math.round(cx - w / 2))),
      top: Math.max(0, Math.min(frameH - h, Math.round(cy - h / 2))),
      width: w,
      height: h,
    },
  }));
}

const ASSETS = [
  { src: path.join(CONTEXT, 'Synth.Eye - html', 'Image_004.png'), slug: 'part-front', max: 2400 },
  // Hero = stejné foto dílu, ale centrovaný crop. Díl je v Image_004 odsazený doprava
  // (bbox 1144,335 → 1713,977 v 1920×1200); tenhle crop ho posadí do středu komory.
  {
    src: path.join(CONTEXT, 'Synth.Eye - html', 'Image_004.png'),
    slug: 'part-hero',
    max: 2400,
    crop: { left: 939, top: 166, width: 980, height: 980 },
  },
  // Reálný párový snímek (clean / defected) — stejný díl, stejná komora, stejné světlo.
  // Defect Revealer je překládá na sebe, takže MUSÍ být registrované.
  //
  // Naměřeno (bbox dílu v 1920×1200, prahování jasu > 110, profily řádků/sloupců):
  //   part_clean     x 1163→1574  y 303→932  center 1368.5,617.5  (411×629)
  //   part_defected  x 1145→1569  y 336→975  center 1357.0,655.5  (424×639)
  //
  // Snímky NEJSOU z jednoho záběru — díl je v defected posunutý o (−11.5, +38) px.
  // Společný crop by tedy pár nezaregistroval (to je oprava původního předpokladu):
  // pod čočkou revealeru by díl při odkrytí poskočil o 38 px = 4 % výšky rámu.
  // Proto crop defected posunutý o týž vektor — po cropu leží díl v obou na
  // stejných souřadnicích. Zbývá rozdíl velikosti 1,6 % (629 vs 639 px výšky,
  // mírně jiná vzdálenost kamery); na hraně dílu je to ~1 % rámu a měkký okraj
  // čočky (radial-gradient maska) to schová.
  {
    src: path.join(CONTEXT, 'context_images', 'part_clean.png'),
    slug: 'part-clean',
    max: 1200,
    crop: { left: 996, top: 184, width: 728, height: 910 },
  },
  {
    src: path.join(CONTEXT, 'context_images', 'part_defected.png'),
    slug: 'part-defected',
    max: 1200,
    crop: { left: 984, top: 222, width: 728, height: 910 },
  },
  // ── Particle Field Transformation ────────────────────────────────────────
  // Sekce potřebuje DVA framy se SHODNÝM aspectem (1:1) a shodným framingem,
  // jinak se každý deformuje jinak a interpolace nečte jako přeuspořádání.
  //
  // Source = cad_render.png, tedy REÁLNÝ Blender render (finální pass téhož
  // dílu). Dřív tu byla fotka part_clean.png, což popíralo labely sekce
  // („Blender · physical render") a celý narativ Blender → GAN.
  //
  // Registrace obou framů (měřeno na hotových 512² assetech, prahování jasu
  // > 80 = týž práh, na kterém culluje particle field):
  //   transition-gan  díl 52,5 % plochy, centroid na (0.458, 0.513) framu
  //   transition-src  crop 688² se stejnými hodnotami
  // Crop 688 = 741 × √(45,2/52,5), tedy zmenšený tak, aby díl zabíral týž
  // podíl plochy jako v GAN framu; s prvním odhadem 741 byl díl v cíli o 15 %
  // větší a transformace se čtla jako „díl se přiblížil", ne jako „týž díl
  // vznikl jinak". Posazení kolem naměřeného centroidu dílu (925,7 / 536,2 ve
  // zdrojovém 1920×1200) drží i těžiště na stejném místě.
  // Silueta se s cílem kryje na IoU 0,72 — zbytek je pootočení o ~3° a hlubší
  // zahloubení děr, tedy právě to, co má transformace ukázat.
  //
  // alphaKey odmaskuje šedé studiové pozadí renderu (jas 40–70, zrno až k 95)
  // na --bg-deep. Dvojí důvod: (1) crossfade i statický fallback stavějí oba
  // framy vedle sebe a GAN výstup má pozadí černé — šedý box by v páru bil do
  // oka; (2) particle field culluje na jasu 30, takže zrno pozadí nad prahem
  // by při 0 % viselo v komoře jako prach. Práh 30 je nutný — vyšší (dřív 80)
  // vyřezával i tmavé pixely samotného dílu a v krajních polohách z nich
  // dělal černé fleky; proto musí alphaKey srazit pozadí opravdu až na
  // --bg-deep (jas ~8), ne jen ztmavit.
  {
    src: path.join(CONTEXT, 'context_images', 'cad_render.png'),
    slug: 'transition-src',
    max: 512,
    crop: { left: 611, top: 183, width: 688, height: 688 },
    alphaKey: { threshold: 95, feather: 30 },
    flatten: BG_DEEP,
  },
  // Target frame — Image_0076 z 80 GAN výstupů (zvoleno ručně; předtím
  // Image_0079, vybraný měřením hlavní osy a polohy defektu).
  // Pozn. proti Image_0079: díl je pootočený, takže se silueta se zdrojovým
  // renderem nekryje tak těsně, a korozní defekt sedí vlevo nahoře místo
  // vpravo od spodní díry. Particle field to unese — korespondence se počítá
  // polárně kolem centroidu každého framu zvlášť, takže pootočení se čte jako
  // součást transformace, ne jako chyba. Defekt se ale během přechodu
  // „přestěhuje", což je vizuálně silnější, ale sémanticky volnější tvrzení.
  {
    src: path.join(ROOT, 'public', 'images', 'gan_generated', 'Image_0076.png'),
    slug: 'transition-gan',
    max: 512,
    upscale: true,
    flatten: BG_DEEP,
  },
  { src: path.join(CONTEXT, 'context_images', 'pbr.png'), slug: 'pbr-render', max: 1600 },
  // ── Real vs. rendered (A/B v sekci Blender) ──────────────────────────────
  // Reálný snímek z komory vs. Blender render téhož typu dílu. Porovnání má
  // smysl jen když díl v obou zabírá STEJNÝ podíl kádru — jinak se čte
  // „jeden je blíž", ne „jeden je render".
  //
  // Naměřeno (bbox dílu v 1920×1200, prahování jasu > 110):
  //   real_before    x 825→1264  y 282→921  center 1044.5,601.5  (439×639)
  //   render_after   x 826→1255  y 285→922  center 1040.5,603.5  (429×637)
  //
  // Framing se liší o ~2 % — sdílený crop 700×900 kolem naměřeného středu
  // tedy stačí, žádná korekce měřítka není potřeba.
  //
  // Vyvážení bílé: pozadí je v obou snímcích skoro totožné (real 76,2/71,2/77,8
  // vs render 71,7/66,8/74,0), rozdíl je na KOVU — real 229,1/207,9/212,0
  // (R−G = +21) proti renderu 186,5/178,0/180,1 (R−G = +8,5). Reálný snímek má
  // tedy teplý cast, který z páru udělá hádanku o vyvážení kamery místo o
  // věrnosti renderu.
  //
  // gain srovnává chromatičnost kovu na render při zachovaném G:
  //   gR = (186,5/178,0) / (229,1/207,9) = 0,9508
  //   gB = (180,1/178,0) / (212,0/207,9) = 0,9923
  // Na pozadí to sedne na 72,4/71,2/77,2 — blíž renderu než před korekcí.
  // Jasový rozdíl kovu (luma 213 vs 180) korekce NEŘEŠÍ; to je expozice,
  // ne tint, a šlo by o výrazně větší zásah do reálného assetu.
  {
    src: path.join(CONTEXT, 'context_images', 'real_before.png'),
    slug: 'compare-real',
    max: 1200,
    crop: { left: 692, top: 152, width: 700, height: 900 },
    gain: [0.9508, 1, 0.9923],
  },
  {
    src: path.join(CONTEXT, 'context_images', 'render_after.png'),
    slug: 'compare-render',
    max: 1200,
    crop: { left: 692, top: 152, width: 700, height: 900 },
  },
  // ── Blender sekce: příčka 01 — digitální dvojče komory ───────────────────
  // Fotka reálného vision standu vedle Blender scény TÉHOŽ rigu: shodný hliníkový
  // rám, kamera na témž příčníku s oranžovými svorkami, díl na stejném místě desky.
  // Srovnání nese příčku „komora existuje dvakrát", takže oba kádry musí mít
  // stejný framing — jinak se čte „dvě podobná zařízení", ne „totéž zařízení".
  //
  // Naměřeno:
  //   scene-blender.png  3840×2160  rig bbox (alfa > 32)  x 1454→2738  y 328→1550
  //   stand-real.jpg     1210×908   rig plní kádr, na okrajích stůl a zeď dílny
  //
  // Cropy srovnané na shodný aspect (1.114 vs 1.111) a shodný podíl rigu v kádru
  // (85 % resp. 86 % šířky). Reálný snímek se cropuje zleva, aby z kádru zmizel
  // kus dílny, který v renderu nemá co odpovídat.
  {
    src: path.join(DEC, 'pipeline-synthetic', 'stand-real.jpg'),
    slug: 'stand-real',
    max: 1200,
    crop: { left: 105, top: 0, width: 1000, height: 900 },
  },
  {
    src: path.join(DEC, 'pipeline-synthetic', 'scene-blender.png'),
    slug: 'scene-twin',
    max: 1400,
    crop: { left: 1316, top: 239, width: 1560, height: 1400 },
    flatten: BG_DEEP,
  },
  // ── Příčka 02 — geometrie → materiál ─────────────────────────────────────
  // Jeden díl, levá část holá geometrie, pravá fotorealistický povrch.
  //
  // Zdrojový clay pass (front-untextured.jpg) je POLOVIČNÍ kádr 987×1200 z 1920×1200
  // a má SVĚTLÉ pozadí (naměřeno luma 202 proti 28 u renderu). Vložený jak je by
  // na --bg-deep byl bílý blok a split by měl uprostřed skok pozadí 202 → 28,
  // tedy by se čet jako dvě slepené fotky, ne jako jeden díl.
  //
  // pbr-front-fingerprint.png je s renderem pixelově registrovaný — naměřeno:
  //   pbr-front-fingerprint  alfa bbox  x 828→1249  y 288→920  center 1039,604
  //   front-render.jpg       luma bbox  x 833→1244  y 288→920  center 1039,604
  // Compose proto vezme z pbr alfu jako siluetu dílu (světlé pozadí se tím
  // odřízne), vlevo od splitu nechá clay, vpravo položí texturovaný pbr.
  //
  // splitX = 986 = šířka clay half-frame, tedy hranice, za kterou clay geometrie
  // NEEXISTUJE. Proto je split statický: scroll-driven wipe by mohl jezdit jen
  // přes x 833→986, tj. 37 % šířky dílu, a zbytek by musel lhát.
  // Hrana v tom místě prochází skrz obě díry — silueta se tedy prokazatelně
  // nemění a rozdíl nese jen přítomnost povrchového detailu.
  //
  // Crop 540×760 kolem naměřeného středu dílu (1039,604) — díl zabírá v kádru
  // 1920×1200 jen 11 % plochy, bez cropu drobek. Po cropu 78 % šířky a 83 %
  // výšky rámu; širší crop (zkoušeno 700×900 jako u compare-* páru) nechával
  // kolem dílu tolik prázdna, že v příčce vedle těsných mat-* cutoutů vypadal
  // nedovřený. Split zůstává na x 986 zdroje, tedy na 40.19 % šířky assetu.
  {
    src: path.join(DEC, 'render-comparison', 'front-untextured.jpg'),
    slug: 'material-split',
    max: 760,
    compose: {
      alphaFrom: path.join(DEC, 'hw-virtualization', 'pbr-front-fingerprint.png'),
      over: path.join(DEC, 'hw-virtualization', 'pbr-front-fingerprint.png'),
      splitX: 986,
    },
    crop: { left: 769, top: 224, width: 540, height: 760 },
    flatten: BG_DEEP,
  },
  // Dva materiály z JEDNÉ geometrie — cutouty dílu bez pozadí, registrované na
  // pixel (obě alfa bbox x 828→1249 y 288→920), takže sdílejí crop a v páru se
  // liší jen povrchem: broušený hliník s otiskem vs. oxidovaný rub.
  // Crop 470×690 kolem středu 1039,604 — těsně na naměřený bbox 421×633 dílu
  // plus ~12 % vzduchu na měkký okraj a stín.
  {
    src: path.join(DEC, 'hw-virtualization', 'pbr-front-fingerprint.png'),
    slug: 'mat-front',
    max: 560,
    crop: { left: 804, top: 259, width: 470, height: 690 },
    flatten: BG_DEEP,
  },
  {
    src: path.join(DEC, 'hw-virtualization', 'pbr-back-oxidized.png'),
    slug: 'mat-back',
    max: 560,
    crop: { left: 804, top: 259, width: 470, height: 690 },
    flatten: BG_DEEP,
  },
  // ── Příčka 03 — generování v měřítku ─────────────────────────────────────
  // Dlaždice mají nativně 480×300 a díl v nich naměřeno ~120×170 px, tj. 11 %
  // plochy → bez cropu drobek v prázdném kádru. Crop 200×250 na naměřený střed
  // dílu (clampnutý do kádru) ho posadí na ~68 % výšky rámu.
  //
  // Rotace (v dlaždicích ±25°) zůstává, u dlaždic, kde clamp střed posune, zůstává
  // i část pozičního rozptylu. Tvrzení „náhodná pozice v kádru" ale nese mono
  // readout u mřížky, ne rastr — v thumbnailu zobrazeném na ~150 px by se stejně
  // nepřečetlo.
  //
  // Zapečený YOLO bbox (modrý front / oranžový back) je tady OBSAH, ne popisek —
  // ilustruje „anotace zadarmo". Proto se přes dlaždice nekreslí vlastní overlay.
  ...synthTiles(),
  // Detailní cropy fingerprint defektu s magentovým bboxem. Díl v nich plní
  // naměřeno 83 % plochy → crop nepotřebují, jen malé nativní zobrazení.
  // Rozměry se mezi snímky liší (212–236 × 316–332), mřížka je proto vyrovnává
  // rámem s pevným aspectem, ne dopočítaným cropem.
  ...[1, 2, 3, 4, 5, 6].map((i) => ({
    src: path.join(DEC, 'pipeline-synthetic', `defect-0${i}.jpg`),
    slug: `synth-defect-0${i}`,
    max: 340,
  })),
  // ── Data Gap / CAD → render (5 fází, scroll-driven) ──────────────────────
  // Čtyři Blender passy téhož dílu: solid (materiál bez textury) → pbr
  // (textury bez světla) → light (anizotropní specular pass, černá s bílými
  // čarami) → render (finál). Vrstvy se překrývají a prolínají, takže MUSÍ
  // být registrované na pixel — jinak díl mezi fázemi poskočí.
  //
  // Naměřeno (bbox dílu v 1920×1200, prahování + eroze):
  //   cad_pbr     x 719→1131  y 221→848   center 925.0,534.5
  //   cad_render  x 716→1131  y 221→854   center 923.5,537.5
  //   cad_light   x 717→1128  y 230→853   center 922.5,541.5
  //   cad_solid   x 831→1244  y 291→916   center 1037.5,603.5  ← POSUNUTÝ
  //
  // pbr/render/light jsou z jedné kamery (rozptyl center ±3 px = šum měření na
  // zrnitém pozadí), solid je vyrenderovaný o +114,+66 px jinde. Proto sdílený
  // crop 660×825 pro trojici a týž crop posunutý o (114,66) pro solid —
  // po cropu leží díl ve všech čtyřech na stejných souřadnicích.
  //
  // Rozměry z naměřeného solidu potvrzují nominály z Measurement sekce
  // (626 px = 60 mm → 10.43 px/mm; bore ⌀61 px = 5.8 mm; rozteč děr 258 px =
  // 24.7 mm; šířka 414 px = 39.7 mm) — wireframe fáze 01 je na nich postavený.
  { src: path.join(CONTEXT, 'context_images', 'cad_solid.png'), slug: 'cad-solid', max: 900, crop: { left: 708, top: 191, width: 660, height: 825 } },
  { src: path.join(CONTEXT, 'context_images', 'cad_pbr.png'), slug: 'cad-pbr', max: 900, crop: { left: 594, top: 125, width: 660, height: 825 } },
  { src: path.join(CONTEXT, 'context_images', 'cad_light.png'), slug: 'cad-light', max: 900, crop: { left: 594, top: 125, width: 660, height: 825 } },
  { src: path.join(CONTEXT, 'context_images', 'cad_render.png'), slug: 'cad-render', max: 900, crop: { left: 594, top: 125, width: 660, height: 825 } },
  { src: path.join(CONTEXT, 'context_images', 'GAN_output.png'), slug: 'gan-output', max: 1600 },
  // scheme_1.png (slug scheme-hw) tu byl pro sekci Blender. Byl to export slidu se
  // zapečenými popisky, šipkami a světlými panely — na --bg-deep se čet jako
  // naskenovaná paper figure. Redesign sekce ho nahradil párem stand-real /
  // scene-twin s popisky nativně v DOM, takže záznam odešel.
  { src: path.join(CONTEXT, 'context_images', 'scheme_2.png'), slug: 'scheme-pipeline', max: 1600 },
  { src: path.join(CONTEXT, 'context_images', 'scheme_3.png'), slug: 'scheme-gan', max: 1600 },
  { src: path.join(CONTEXT, 'context_images', 'measurement.png'), slug: 'measure-front', max: 1600 },
  { src: path.join(CONTEXT, 'context_images', 'measurement_back.png'), slug: 'measure-back', max: 1600 },
  { src: path.join(CONTEXT, 'context_images', 'industry.png'), slug: 'industry', max: 1600 },
  { src: path.join(CONTEXT, 'context_images', 'Logo_white.png'), slug: 'logo-white', max: 800 },
];

const SVG_COPY = {
  src: path.join(CONTEXT, 'Synth.Eye - html', 'logo.svg'),
  dest: path.join(OUT, 'logo.svg'),
};

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const images = {};
const lqip = {};

/**
 * compose: složí jeden asset z víc zdrojů PŘED cropem, ve zdrojových pixelech.
 * Jednoúčelové jako alphaKey — používá jen material-split, viz odůvodnění tam.
 *
 *   alphaFrom  odkud vzít alfu = silueta dílu; určuje, co je díl a co pozadí
 *   over       obraz položený vpravo od splitX
 *   splitX     x hrany v pixelech kádru zdroje
 *
 * `src` smí být užší než kádr (poloviční kádr) — dopadne se doprava, protože ta
 * část stejně padne pod `over`.
 */
async function composeSplit(src, { alphaFrom, over, splitX }) {
  const { width, height } = await sharp(alphaFrom).metadata();
  const maskRaw = await sharp(alphaFrom).ensureAlpha().raw().toBuffer();
  const overRaw = await sharp(over).ensureAlpha().raw().toBuffer();

  const leftMeta = await sharp(src).metadata();
  if (leftMeta.width > width || leftMeta.height !== height) {
    throw new Error(`compose: ${path.basename(src)} (${leftMeta.width}×${leftMeta.height}) nesedí na kádr ${width}×${height}`);
  }
  const leftRaw = await sharp(src)
    .extend({ right: width - leftMeta.width, background: { r: 0, g: 0, b: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const s = x < splitX ? leftRaw : overRaw;
      out[i] = s[i];
      out[i + 1] = s[i + 1];
      out[i + 2] = s[i + 2];
      // Alfa VŽDY ze siluety — tím se odřízne světlé pozadí clay passu.
      out[i + 3] = maskRaw[i + 3];
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } });
}

async function processAsset({ src, slug, max, crop, upscale = false, flatten = null, gain = null, alphaKey = null, compose = null }) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Missing source: ${src}`);
    return;
  }

  const stat = fs.statSync(src);
  // Do recipe patří i mtime compose zdrojů — jinak by se cache neinvalidovala,
  // když se změní obraz, který do assetu vstupuje, ale není to `src`.
  const composeStamp = compose
    ? [compose.alphaFrom, compose.over].map((p) => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0))
    : null;
  const recipe = JSON.stringify({ src, max, crop: crop ?? null, upscale, flatten, gain, alphaKey, compose, composeStamp });
  const metaPath = path.join(OUT, `${slug}.meta.json`);
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (meta.mtime === stat.mtimeMs && meta.recipe === recipe) {
      console.log(`⏭ Skip ${slug} (unchanged)`);
      if (meta.images) Object.assign(images, meta.images);
      if (meta.lqip) Object.assign(lqip, meta.lqip);
      return;
    }
  }

  const base = compose ? await composeSplit(src, compose) : sharp(src);
  const img = crop ? base.extract(crop) : base;
  const orig = crop ? { width: crop.width, height: crop.height } : await img.metadata();
  // upscale: povolené zvětšení nad nativní rozlišení. Používá jen
  // transition-gan (nativně 256²) — particle field ho vzorkuje na grid 384,
  // takže je lepší nechat zvětšení na sharpu než na filtru prohlížeče.
  const scale = upscale ? max / Math.max(orig.width, orig.height) : Math.min(1, max / Math.max(orig.width, orig.height));
  const width = Math.round(orig.width * scale);
  const height = Math.round(orig.height * scale);
  let resized = img.resize(width, height, { fit: 'inside', withoutEnlargement: !upscale });

  // flatten: slož alfu na dané pozadí. GAN výstupy z gan_generated mají REÁLNÝ
  // alfa kanál (Image_0053.png: alpha mean 127) — díl je krytý, pozadí a obě
  // díry průhledné. Bez sloučení to rozbíjí obě cesty:
  //   · <Picture> prosvítá skrz díl na lqip placeholder ve .picture-wrap →
  //     bílé halo kolem dílu a prstence v dírách
  //   · particle field čte getImageData a jas počítá z RGB bez ohledu na alfu,
  //     takže poloprůhledné pixely na hraně bere jako plně krycí světlé
  //     částice → světlý zubatý lem siluety
  // Sloučením na --bg-deep spadne pozadí pod cull threshold a hrana přechází
  // plynule do tmy.
  // alphaKey: pozadí se odmaskuje podle jasu — pod `threshold` plná průhlednost,
  // nad `threshold + feather` plné krytí, mezi tím lineární rampa.
  // Rampa jde POUZE vzhůru od prahu (ne symetricky kolem něj), aby zrno pozadí
  // těsně nad prahem zůstalo prakticky průhledné. Musí běžet PŘED flatten,
  // který vyrobenou alfu slije na cílové pozadí.
  if (alphaKey) {
    const { data, info } = await resized.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const l = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
      const k = (l - alphaKey.threshold) / alphaKey.feather;
      data[i + 3] = k <= 0 ? 0 : k >= 1 ? data[i + 3] : Math.round(k * data[i + 3]);
    }
    resized = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  }

  if (flatten) resized = resized.flatten({ background: flatten });

  // gain: per-kanálové vyvážení bílé, [R,G,B] multiplikátory na sRGB hodnotách
  // (tedy v témže prostoru, ve kterém se měřily průměry kanálů). Používá
  // compare-real — viz odůvodnění u toho assetu.
  if (gain) resized = resized.linear(gain, [0, 0, 0]);

  await resized.clone().avif({ quality: 50 }).toFile(path.join(OUT, `${slug}.avif`));
  await resized.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${slug}.webp`));
  await resized.clone().png({ compressionLevel: 9 }).toFile(path.join(OUT, `${slug}.png`));

  const lqipBuf = await resized.clone().resize(20).blur(2).webp({ quality: 20 }).toBuffer();
  lqip[slug] = `data:image/webp;base64,${lqipBuf.toString('base64')}`;

  images[slug] = {
    slug,
    width,
    height,
    aspect: +(width / height).toFixed(4),
  };

  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      mtime: stat.mtimeMs,
      recipe,
      images: { [slug]: images[slug] },
      lqip: { [slug]: lqip[slug] },
    })
  );
  console.log(`✓ ${slug} (${width}×${height})`);
}

if (fs.existsSync(SVG_COPY.src)) {
  fs.copyFileSync(SVG_COPY.src, SVG_COPY.dest);
  console.log('✓ logo.svg copied');
  // Zdrojové logo je monochromatické #000024 → na #08080c je neviditelné.
  // Světlá varianta pro nav/footer, vektorová (ne raster z Logo_white.png).
  const light = fs
    .readFileSync(SVG_COPY.src, 'utf8')
    .replace(/#000024/gi, '#E8E8EC');
  fs.writeFileSync(path.join(OUT, 'logo-light.svg'), light);
  console.log('✓ logo-light.svg generated');
}

for (const asset of ASSETS) {
  await processAsset(asset);
}

fs.writeFileSync(path.join(DATA_DIR, 'images.json'), JSON.stringify(images, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'lqip.json'), JSON.stringify(lqip, null, 2));
console.log('Done — images.json & lqip.json updated');
