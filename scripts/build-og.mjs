import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'og-image.png');
const PART = path.join(ROOT, 'public', 'images', 'part-front.webp');
const LOGO = path.join(ROOT, '.claude', 'context', 'Synth.Eye - html', 'logo.svg');

async function main() {
  const w = 1200;
  const h = 630;

  const bg = sharp({
    create: { width: w, height: h, channels: 3, background: { r: 8, g: 8, b: 12 } },
  }).png();

  const composites = [];

  if (fs.existsSync(PART)) {
    const partBuf = await sharp(PART)
      .resize(520, 390, { fit: 'cover' })
      .modulate({ brightness: 0.85 })
      .toBuffer();
    composites.push({ input: partBuf, left: 620, top: 120 });
  }

  const svgText = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#08080c"/>
      <text x="80" y="200" font-family="system-ui,sans-serif" font-size="52" font-weight="700" fill="#e8e8ec">Train on synthetic.</text>
      <text x="80" y="270" font-family="system-ui,sans-serif" font-size="52" font-weight="700" fill="#7B6EF6">Deploy on real.</text>
      <text x="80" y="560" font-family="monospace" font-size="18" fill="#8a8a96">Synth.Eye · MIT · JIC · INTEMAC</text>
      <text x="80" y="80" font-family="monospace" font-size="14" fill="#4a4a56" opacity="0.5">⌜</text>
      <text x="1120" y="80" font-family="monospace" font-size="14" fill="#4a4a56" opacity="0.5">⌝</text>
      <text x="80" y="610" font-family="monospace" font-size="14" fill="#4a4a56" opacity="0.5">⌞</text>
      <text x="1120" y="610" font-family="monospace" font-size="14" fill="#4a4a56" opacity="0.5">⌟</text>
    </svg>`;

  let pipeline = sharp(Buffer.from(svgText)).png();
  if (composites.length) {
    pipeline = pipeline.composite(composites);
  }
  await pipeline.toFile(OUT);
  console.log('✓ og-image.png');

  // Favicon ICO + apple touch
  if (fs.existsSync(LOGO)) {
    await sharp(LOGO)
      .resize(32, 32, { fit: 'contain', background: { r: 8, g: 8, b: 12, alpha: 1 } })
      .png()
      .toFile(path.join(ROOT, 'public', 'favicon.ico'));
    await sharp(LOGO)
      .resize(180, 180, { fit: 'contain', background: { r: 8, g: 8, b: 12, alpha: 1 } })
      .png()
      .toFile(path.join(ROOT, 'public', 'apple-touch-icon.png'));
    fs.copyFileSync(LOGO, path.join(ROOT, 'public', 'favicon.svg'));
  }
}

main();
