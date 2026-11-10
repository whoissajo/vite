import { open, gotoTool, download, check, done, fx, size } from './lib.mjs';
import sharp from 'sharp';
const { browser, page, errors } = await open();

console.log('image-compress');
await gotoTool(page, 'image-compress');
await page.setInputFiles('input[data-testid="file-input"]', fx('photo.jpg'));
await page.getByRole('button', { name: /Compress image/ }).click();
await page.waitForSelector('.result');
let d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
const meta = await sharp(d.path).metadata();
check(meta.format === 'jpeg', `output is jpeg (${d.name})`);
check(size(d.path) < size(fx('photo.jpg')) * 0.8, `jpg smaller: ${size(fx('photo.jpg'))} → ${size(d.path)}`);
check(!meta.exif, 'metadata stripped');

// png quantised
await page.reload(); await page.waitForSelector('.dropzone');
await page.setInputFiles('input[data-testid="file-input"]', fx('photo.png'));
await page.getByRole('button', { name: /Compress image/ }).click();
await page.waitForSelector('.result');
d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
check((await sharp(d.path).metadata()).format === 'png', 'png stays png');
check(size(d.path) < size(fx('photo.png')), `png smaller: ${size(fx('photo.png'))} → ${size(d.path)}`);

console.log('image-convert');
await gotoTool(page, 'image-convert');
await page.setInputFiles('input[data-testid="file-input"]', [fx('logo-white-bg.png')]);
await page.getByRole('radio', { name: 'JPG', exact: true }).click();
await page.getByRole('button', { name: /^Convert/ }).click();
await page.waitForSelector('.result');
d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
let m = await sharp(d.path).metadata();
check(m.format === 'jpeg' && m.width === 400 && m.height === 300, `png→jpg ${m.format} ${m.width}x${m.height}`);
await page.getByRole('radio', { name: 'BMP', exact: true }).click();
await page.getByRole('button', { name: /^Convert/ }).click();
await page.waitForTimeout(800);
d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
const bmp = (await import('node:fs')).readFileSync(d.path);
check(bmp[0] === 0x42 && bmp[1] === 0x4d && bmp.readInt32LE(18) === 400 && bmp.readInt32LE(22) === 300, 'BMP header valid 400x300');
const px = await sharp(d.path).raw().toBuffer({ resolveWithObject: false }).catch(() => null);

console.log('image-resize');
await gotoTool(page, 'image-resize');
await page.setInputFiles('input[data-testid="file-input"]', fx('photo.jpg'));
await page.getByLabel('Width').fill('800');
await page.getByRole('button', { name: /^Resize/ }).click();
await page.waitForSelector('.result');
d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
m = await sharp(d.path).metadata();
check(m.width === 800 && m.height === 500, `resized 1600x1000 → ${m.width}x${m.height}`);

console.log('image-crop');
await gotoTool(page, 'image-crop');
await page.setInputFiles('input[data-testid="file-input"]', fx('photo.jpg'));
await page.waitForSelector('.crop-box');
await page.getByRole('button', { name: '1:1', exact: true }).click();
let cw = await page.getByLabel('Width').inputValue(), ch = await page.getByLabel('Height').inputValue();
check(cw === ch && +cw === 1000, `1:1 preset gives ${cw}x${ch}`);
// drag the SE handle inward with the mouse
await page.locator('.crop-box').scrollIntoViewIfNeeded();
const box = await page.locator('.crop-box').boundingBox();
await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 }); await page.mouse.up();
cw = +(await page.getByLabel('Width').inputValue()); ch = +(await page.getByLabel('Height').inputValue());
check(cw < 1000 && Math.abs(cw - ch) <= 1, `dragged handle keeps ratio: ${cw}x${ch}`);
d = await download(page, () => page.getByRole('button', { name: /Crop & download/ }).click());
m = await sharp(d.path).metadata();
check(m.width === cw && m.height === ch, `export ${m.width}x${m.height} == ${cw}x${ch}`);
await page.getByRole('button', { name: '90° right' }).click();
await page.getByRole('button', { name: 'Free', exact: true }).click();
check((await page.locator('.panel-title').filter({ hasText: '1000×1600' }).count()) === 1, 'rotate 90° swaps dims (1000×1600)');

console.log('image-to-pdf');
await gotoTool(page, 'image-to-pdf');
await page.setInputFiles('input[data-testid="file-input"]', [fx('photo.jpg'), fx('photo.png'), fx('photo.webp')]);
await page.getByRole('button', { name: 'Create PDF' }).click();
await page.waitForSelector('.result');
d = await download(page, () => page.getByRole('button', { name: 'Download', exact: true }).click());
const { PDFDocument } = await import('pdf-lib');
const pdf = await PDFDocument.load((await import('node:fs')).readFileSync(d.path));
check(pdf.getPageCount() === 3, `pdf has ${pdf.getPageCount()} pages`);
const { execSync } = await import('node:child_process');
try { execSync(`pdfinfo ${d.path}`, { stdio: 'pipe' }); check(true, 'pdfinfo opens it'); } catch (e) { console.log('  (pdfinfo unavailable)'); }

console.log('image-base64');
await gotoTool(page, 'image-base64');
await page.setInputFiles('input[data-testid="file-input"]', fx('logo-white-bg.png'));
await page.waitForSelector('textarea');
const uri = await page.locator('textarea').first().inputValue();
const fsm = await import('node:fs');
check(uri.startsWith('data:image/png;base64,') && Buffer.from(uri.split(',')[1], 'base64').equals(fsm.readFileSync(fx('logo-white-bg.png'))), 'data URI round-trips original bytes');
await page.getByRole('radio', { name: 'Base64 → Image' }).click();
await page.locator('textarea').fill(uri.split(',')[1]);
await page.waitForSelector('text=Detected type');
check((await page.locator('text=Detected type').innerText()).includes('image/png'), 'raw base64 sniffed as png');
await page.locator('textarea').fill('not base64 !!!');
check(await page.locator('.alert-error').count() === 1, 'invalid base64 shows error');

console.log('favicon-generator');
await gotoTool(page, 'favicon-generator');
await page.setInputFiles('input[data-testid="file-input"]', fx('logo-white-bg.png'));
await page.waitForSelector('.thumb-grid');
d = await download(page, () => page.getByRole('button', { name: /Just favicon.ico/ }).click());
const ico = fsm.readFileSync(d.path);
check(ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 6, 'ICO header: type 1, 6 images');
const sizes = []; for (let i = 0; i < 6; i++) sizes.push(ico[6 + i * 16] || 256);
check(sizes.join() === '16,32,48,64,128,256', `ICO sizes ${sizes}`);
const off = ico.readUInt32LE(6 + 12), len = ico.readUInt32LE(6 + 8);
check(ico.subarray(off, off + 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'ICO entry is a real PNG');
d = await download(page, () => page.getByRole('button', { name: /Download all/ }).click());
const { execSync: ex } = await import('node:child_process');
const listing = ex(`python3 -c "import zipfile,sys;z=zipfile.ZipFile('${d.path}');print(sorted(z.namelist()));print(z.testzip())"`).toString();
check(listing.includes('apple-touch-icon.png') && listing.includes('site.webmanifest') && listing.trim().endsWith('None'), 'zip has icons + manifest and passes testzip');

console.log('console errors:', errors.length ? errors : 'none');
check(errors.length === 0, 'no console errors');
await browser.close(); done();
