// Generates real media fixtures with ffmpeg (+ sharp for images) so every tool can be tested against real files.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
mkdirSync(dir, { recursive: true });
const f = (n) => path.join(dir, n);
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);

// --- video: 4s 640x360 30fps testsrc with a 440Hz tone (H.264/AAC mp4) and VP9 webm
ff('-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=4', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
   '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-b:v', '2M', '-c:a', 'aac', '-shortest', f('sample.mp4'));
ff('-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=3',
   '-c:v', 'libvpx-vp9', '-b:v', '500k', '-c:a', 'libopus', '-shortest', f('sample.webm'));
// --- audio
ff('-f', 'lavfi', '-i', 'sine=frequency=523:duration=3', '-c:a', 'libmp3lame', f('sample.mp3'));
ff('-f', 'lavfi', '-i', 'sine=frequency=660:duration=3', f('sample.wav'));

// --- images (photo-like noisy gradient so compression has real work to do)
const W = 1600, H = 1000;
const raw = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3, n = (Math.sin(x / 37) + Math.cos(y / 23)) * 40 + (Math.random() * 30);
  raw[i] = Math.max(0, Math.min(255, x / W * 255 + n));
  raw[i + 1] = Math.max(0, Math.min(255, y / H * 255 + n));
  raw[i + 2] = Math.max(0, Math.min(255, 128 + n));
}
const photo = sharp(raw, { raw: { width: W, height: H, channels: 3 } });
await photo.clone().jpeg({ quality: 95 }).withExif({ IFD0: { Copyright: 'OffKit Test', Artist: 'Tester' } }).toFile(f('photo.jpg'));
await photo.clone().png().toFile(f('photo.png'));
await photo.clone().webp({ quality: 90 }).toFile(f('photo.webp'));
// white-background logo with transparent-able subject
await sharp({ create: { width: 400, height: 300, channels: 3, background: '#ffffff' } })
  .composite([{ input: Buffer.from('<svg width="400" height="300"><circle cx="200" cy="150" r="100" fill="#e11d48"/></svg>') }])
  .png().toFile(f('logo-white-bg.png'));

// --- PDFs: 3-page doc with distinct text per page, and a 2-page one
async function makePdf(name, pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  pages.forEach((t, i) => {
    const p = doc.addPage([595, 842]);
    p.drawText(t, { x: 60, y: 760, size: 28, font, color: rgb(0.1, 0.1, 0.1) });
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: 60, y: 720, size: 14, font });
  });
  writeFileSync(f(name), await doc.save());
}
await makePdf('three-pages.pdf', ['Alpha document', 'Bravo document', 'Charlie document']);
await makePdf('two-pages.pdf', ['Delta document', 'Echo document']);

// --- misc
writeFileSync(f('sample.json'), JSON.stringify({ name: 'OffKit', tools: [1, 2, 3], nested: { ok: true } }));
writeFileSync(f('sample.txt'), 'The quick brown fox jumps over the lazy dog.\n'.repeat(50));
console.log('fixtures ready in', dir);
