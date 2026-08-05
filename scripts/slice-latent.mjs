import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'images', 'gan_generated');
const OUT = path.join(ROOT, 'public', 'images', 'latent');

const COLS = 10;
const ROWS = 8;
const CELL = 256;
const FEAT = 64; // downsample size for feature extraction
const FG_THRESHOLD = 28; // luma above this counts as part, not background

/**
 * Feature extraction on a 64×64 greyscale downsample.
 * The navigator crossfades the four samples surrounding a point, so neighbours
 * on the lattice must be visually adjacent — otherwise the blend reads as a
 * double exposure instead of a walk through latent space.
 *
 * Returns the foreground centroid (used to align every part concentrically),
 * the principal-axis angle (lattice X) and foreground brightness (lattice Y).
 */
async function features(file) {
  const { data } = await sharp(file)
    .resize(FEAT, FEAT, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let m00 = 0;
  let m10 = 0;
  let m01 = 0;
  let lumaSum = 0;

  for (let y = 0; y < FEAT; y++) {
    for (let x = 0; x < FEAT; x++) {
      const v = data[y * FEAT + x];
      if (v <= FG_THRESHOLD) continue;
      m00 += 1;
      m10 += x;
      m01 += y;
      lumaSum += v;
    }
  }

  if (!m00) return { cx: 0.5, cy: 0.5, angle: 0, luma: 0 };

  const cx = m10 / m00;
  const cy = m01 / m00;

  let mu20 = 0;
  let mu02 = 0;
  let mu11 = 0;
  for (let y = 0; y < FEAT; y++) {
    for (let x = 0; x < FEAT; x++) {
      if (data[y * FEAT + x] <= FG_THRESHOLD) continue;
      const dx = x - cx;
      const dy = y - cy;
      mu20 += dx * dx;
      mu02 += dy * dy;
      mu11 += dx * dy;
    }
  }

  return {
    cx: cx / FEAT,
    cy: cy / FEAT,
    /* Principal axis, radians in (-π/2, π/2] — orientation of a rectangle mod 180°. */
    angle: 0.5 * Math.atan2(2 * mu11, mu20 - mu02),
    luma: lumaSum / m00,
  };
}

/** Recentre the part so the blend only has to interpolate rotation and surface. */
async function alignedCell(file, feat) {
  const shiftX = Math.round((0.5 - feat.cx) * CELL);
  const shiftY = Math.round((0.5 - feat.cy) * CELL);
  const pad = CELL; // room to shift either way without clipping

  /* sharp allows only one extract per pipeline stage — pad and crop in two passes. */
  const padded = await sharp(file)
    .resize(CELL, CELL, { fit: 'cover' })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 8, g: 8, b: 12 } })
    .png()
    .toBuffer();

  return sharp(padded)
    .extract({ left: pad - shiftX, top: pad - shiftY, width: CELL, height: CELL })
    .webp({ quality: 82 })
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.warn('gan_generated folder not found');
    return;
  }

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  if (files.length < COLS * ROWS) {
    console.warn(`Expected ${COLS * ROWS} GAN images, found ${files.length}`);
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });

  const samples = [];
  for (const file of files.slice(0, COLS * ROWS)) {
    const full = path.join(SRC_DIR, file);
    samples.push({ file, full, feat: await features(full) });
  }

  /* Lattice Y = surface state (dark back side → bright front side → defected),
     lattice X = part orientation. Band by brightness, then sort within band. */
  samples.sort((a, b) => a.feat.luma - b.feat.luma);

  const order = [];
  for (let r = 0; r < ROWS; r++) {
    const band = samples.slice(r * COLS, (r + 1) * COLS);
    /* Every band sorts the same direction, so column c holds a comparable
       orientation in every row: horizontal neighbours share a brightness band,
       vertical neighbours share an orientation. */
    band.sort((a, b) => a.feat.angle - b.feat.angle);
    order.push(band);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const s = order[r][c];
      const buf = await alignedCell(s.full, s.feat);
      fs.writeFileSync(path.join(OUT, `${r}-${c}.webp`), buf);
    }
  }

  const manifest = {
    cols: COLS,
    rows: ROWS,
    cell: CELL,
    count: COLS * ROWS,
    aligned: true,
    axes: { x: 'part orientation (principal axis)', y: 'surface state (luminance bands)' },
    grid: order.map((row) => row.map((s) => s.file)),
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Built ${COLS}×${ROWS} aligned latent lattice from ${files.length} real GAN outputs`);
}

main();
