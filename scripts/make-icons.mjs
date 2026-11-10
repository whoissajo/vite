import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
const svg = readFileSync('public/icon.svg');
mkdirSync('public/icons', { recursive: true });
mkdirSync('extension/icons', { recursive: true });
const out = async (size, file, pad = 0) => {
  const inner = Math.round(size * (1 - pad * 2));
  const base = await sharp(svg, { density: 512 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: pad ? '#6a6bff' : { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: base, gravity: 'center' }]).png().toFile(file);
};
await out(192, 'public/icons/icon-192.png');
await out(512, 'public/icons/icon-512.png');
await out(512, 'public/icons/icon-maskable-512.png', 0.12);
await out(180, 'public/icons/apple-touch-icon.png');
for (const s of [16, 32, 48, 128]) await out(s, `extension/icons/icon-${s}.png`);
console.log('icons written');
