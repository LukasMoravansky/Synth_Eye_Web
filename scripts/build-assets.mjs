import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTEXT = path.join(ROOT, '.claude', 'context');
const OUT = path.join(ROOT, 'public', 'images');
const DATA_DIR = path.join(ROOT, 'src', 'data');

// --bg-deep, pozadí sekcí. Sem se slévá alfa transition framů.
const BG_DEEP = { r: 8, g: 8, b: 12 };

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
  // TODO(asset): `transition-src` má být čistý Blender render — 1024×1024,
  // jeden díl na středu, portrétová orientace dílu, pozadí --bg-deep (#08080c),
  // ŽÁDNÉ titulky/popisky, stejný framing jako public/images/gan_generated/.
  // Do dodání aproximuje reálný snímek part_clean.png: správný framing
  // (portrét, díl na středu, dvě díry, dělicí spára) — ale je to fotka, ne
  // render, takže narativ „Blender → GAN" je zatím doložený nepřesně.
  // Čtverec 760² centrovaný na díl (bbox 1145,302 → 1575,976 v 1920×1200,
  // střed 1360,639). Utažený tak, aby díl zabíral ~41 % plochy framu — stejný
  // podíl jako v transition-gan (47 %). Kdyby byl podíl jiný, particle field
  // by musel při transformaci měnit celkové měřítko a čtení „stejný díl,
  // jiný způsob vzniku" by se rozpadlo na „díl se přiblížil".
  {
    src: path.join(CONTEXT, 'context_images', 'part_clean.png'),
    slug: 'transition-src',
    max: 512,
    crop: { left: 980, top: 259, width: 760, height: 760 },
    flatten: BG_DEEP,
  },
  // Target frame — Image_0053 z 80 čistých GAN výstupů. Vybraný proto, že je
  // z osmdesátky nejblíž framingu source framu: portrétový díl, dvě díry nad
  // sebou, vodorovná dělicí spára přes střed, jen mírně pootočený. Silueta se
  // tak kryje se zdrojem a transformace čte jako přeuspořádání téhož dílu,
  // ne jako záměna dvou různých objektů. Zároveň má čisté tmavé pozadí,
  // vysoký kontrast (sd 42) a žádný vypálený text.
  {
    src: path.join(ROOT, 'public', 'images', 'gan_generated', 'Image_0053.png'),
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
  { src: path.join(CONTEXT, 'context_images', 'scheme_1.png'), slug: 'scheme-hw', max: 1600 },
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

async function processAsset({ src, slug, max, crop, upscale = false, flatten = null, gain = null }) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Missing source: ${src}`);
    return;
  }

  const stat = fs.statSync(src);
  const recipe = JSON.stringify({ src, max, crop: crop ?? null, upscale, flatten, gain });
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

  const img = crop ? sharp(src).extract(crop) : sharp(src);
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
