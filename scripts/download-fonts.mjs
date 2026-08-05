import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const FONTS = path.join(ROOT, 'public', 'fonts');
const TMP = path.join(ROOT, '.tmp-fonts');

const FONTSHARE = [
  { family: 'clash-display', files: {
    'ClashDisplay-Semibold.woff2': /Semibold\.woff2$/i,
    'ClashDisplay-Bold.woff2': /Bold\.woff2$/i,
  }},
  { family: 'satoshi', files: {
    'Satoshi-Regular.woff2': /Regular\.woff2$/i,
    'Satoshi-Medium.woff2': /Medium\.woff2$/i,
    'Satoshi-Bold.woff2': /Bold\.woff2$/i,
  }},
];

const JB = {
  'JetBrainsMono-Regular.woff2': 'https://github.com/JetBrains/JetBrainsMono/raw/master/web/woff2/JetBrainsMono-Regular.woff2',
  'JetBrainsMono-Medium.woff2': 'https://github.com/JetBrains/JetBrainsMono/raw/master/web/woff2/JetBrainsMono-Medium.woff2',
};

fs.mkdirSync(FONTS, { recursive: true });

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

async function download(url, dest) {
  if (fs.existsSync(dest)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function fontshare(family, mapping) {
  const zipPath = path.join(TMP, `${family}.zip`);
  fs.mkdirSync(TMP, { recursive: true });
  await download(`https://api.fontshare.com/v2/fonts/download/${family}`, zipPath);
  const extractDir = path.join(TMP, family);
  fs.mkdirSync(extractDir, { recursive: true });
  execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`);
  const all = walk(extractDir);
  for (const [destName, pattern] of Object.entries(mapping)) {
    const match = all.find((f) => pattern.test(f));
    if (match) {
      fs.copyFileSync(match, path.join(FONTS, destName));
      console.log(`✓ ${destName}`);
    } else {
      console.warn(`⚠ No match for ${destName}`);
    }
  }
}

for (const { family, files } of FONTSHARE) {
  try {
    await fontshare(family, files);
  } catch (e) {
    console.warn(`⚠ ${family}: ${e.message}`);
  }
}

for (const [name, url] of Object.entries(JB)) {
  try {
    await download(url, path.join(FONTS, name));
    console.log(`✓ ${name}`);
  } catch (e) {
    console.warn(`⚠ ${name}: ${e.message}`);
  }
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log('Font download complete');
