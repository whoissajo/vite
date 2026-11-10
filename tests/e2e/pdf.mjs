import { open, gotoTool, download, check, done, fx, size } from './lib.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
const T = '/tmp/claude-0/pdf-test'; fs.mkdirSync(T, { recursive: true });
const { browser, page, errors } = await open();
const dl = (name = 'Download') => download(page, () => page.getByRole('button', { name, exact: true }).first().click());
const pages = (p) => +execSync(`pdfinfo ${p}`).toString().match(/Pages:\s+(\d+)/)[1];
const text = (p) => execSync(`pdftotext ${p} -`).toString();
const valid = (p) => { try { execSync(`qpdf --check ${p}`, { stdio: 'pipe' }); return true; } catch { return false; } };

// photo-heavy PDF for compression
const doc = await PDFDocument.create();
const jpg = await doc.embedJpg(fs.readFileSync(fx('photo.jpg')));
for (let i = 0; i < 3; i++) { const pg = doc.addPage([595, 842]); pg.drawImage(jpg, { x: 20, y: 200, width: 555, height: 347 }); }
fs.writeFileSync(`${T}/photos.pdf`, await doc.save());

console.log('pdf-merge');
await gotoTool(page, 'pdf-merge');
await page.setInputFiles('input[data-testid="file-input"]', [fx('three-pages.pdf'), fx('two-pages.pdf')]);
await page.getByRole('button', { name: /Merge 2 PDFs/ }).click(); await page.waitForSelector('.result');
let d = await dl();
check(pages(d.path) === 5 && valid(d.path), `merged = ${pages(d.path)} pages, qpdf valid`);
const t = text(d.path); check(t.indexOf('Alpha') < t.indexOf('Charlie') && t.indexOf('Charlie') < t.indexOf('Delta'), 'page order preserved');

console.log('pdf-split');
await gotoTool(page, 'pdf-split');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.waitForSelector('.page-card');
await page.getByLabel('Pages').fill('2-3');
await page.getByRole('button', { name: 'Split PDF' }).click(); await page.waitForSelector('.result');
d = await dl();
check(pages(d.path) === 2 && /Bravo/.test(text(d.path)) && /Charlie/.test(text(d.path)) && !/Alpha/.test(text(d.path)), 'range 2-3 extracted Bravo+Charlie');
await page.getByRole('radio', { name: 'Every page' }).click();
await page.getByRole('button', { name: 'Split PDF' }).click(); await page.waitForTimeout(800);
d = await download(page, () => page.getByRole('button', { name: /Download all/ }).click());
const names = execSync(`python3 -c "import zipfile;print(sorted(zipfile.ZipFile('${d.path}').namelist()))"`).toString();
check(/page-1/.test(names) && /page-3/.test(names), `every-page zip: ${names.trim()}`);
await page.getByLabel('Pages').fill('1-9').catch(() => {});

console.log('pdf-organize');
await gotoTool(page, 'pdf-organize');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.waitForSelector('.page-card');
await page.getByRole('button', { name: 'Delete page' }).first().click();
await page.getByRole('button', { name: 'Rotate 90°' }).first().click();
await page.getByRole('button', { name: 'Move later' }).first().click();
await page.getByRole('button', { name: 'Save new PDF' }).click(); await page.waitForSelector('.result');
d = await dl();
const od = await PDFDocument.load(fs.readFileSync(d.path));
check(od.getPageCount() === 2, 'deleted one page → 2');
check(od.getPage(1).getRotation().angle === 90 && /Charlie/.test(text(d.path)) , 'rotation 90 applied to moved page; order Charlie→Bravo');
check(text(d.path).indexOf('Charlie') < text(d.path).indexOf('Bravo'), 'reordered');

console.log('pdf-to-images');
await gotoTool(page, 'pdf-to-images');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.waitForFunction(() => document.body.innerText.includes('3 pages detected'));
await page.getByRole('button', { name: 'Convert to images' }).click(); await page.waitForSelector('.result');
d = await download(page, () => page.getByRole('button', { name: /Download all/ }).click());
execSync(`cd ${T} && rm -rf z && mkdir z && python3 -c "import zipfile;zipfile.ZipFile('${d.path}').extractall('z')"`);
const imgs = fs.readdirSync(`${T}/z`); const m = await sharp(`${T}/z/${imgs[0]}`).metadata();
check(imgs.length === 3, `3 images (${imgs[0]})`);
check(Math.abs(m.width - Math.round(595.28 * 150 / 72)) <= 2, `150 DPI width ${m.width} ≈ ${Math.round(595.28 * 150 / 72)}`);
const st = await sharp(`${T}/z/${imgs[0]}`).stats(); check(st.channels[0].min < 100 && st.channels[0].max === 255, 'rendered page has dark text on white');

console.log('pdf-to-text');
await gotoTool(page, 'pdf-to-text');
await page.setInputFiles('input[data-testid="file-input"]', fx('two-pages.pdf'));
await page.waitForSelector('textarea');
await page.waitForFunction(() => document.querySelector('textarea').value.includes('Echo'));
const tv = await page.locator('textarea').inputValue();
check(/Delta/.test(tv) && /Echo/.test(tv) && /Page 2/.test(tv), 'text extracted with separators');
await page.setInputFiles('input[data-testid="file-input"]', []).catch(() => {});

console.log('pdf-compress');
await gotoTool(page, 'pdf-compress');
await page.setInputFiles('input[data-testid="file-input"]', `${T}/photos.pdf`);
await page.getByRole('button', { name: 'Compress PDF' }).click(); await page.waitForSelector('.result, .alert-warn');
const before = size(`${T}/photos.pdf`);
d = await dl();
check(size(d.path) < before * 0.6 && valid(d.path) && pages(d.path) === 3, `optimize: ${before} → ${size(d.path)} (valid, 3 pages)`);
// second pass on the already-compressed output must be honest
await gotoTool(page, 'pdf-compress');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.getByRole('button', { name: 'Compress PDF' }).click(); await page.waitForSelector('.result, .alert-warn');
check(await page.locator('.alert-warn').count() + await page.locator('.result').count() === 1, 'tiny text PDF: honest outcome shown (' + (await page.locator('.alert-warn').count() ? 'could not shrink' : 'shrunk') + ')');
await gotoTool(page, 'pdf-compress');
await page.setInputFiles('input[data-testid="file-input"]', `${T}/photos.pdf`);
await page.getByRole('radio', { name: 'Maximum' }).click();
await page.getByRole('button', { name: 'Compress PDF' }).click(); await page.waitForSelector('.result, .alert-warn', { timeout: 60000 });
d = await dl();
check(size(d.path) < before && pages(d.path) === 3 && valid(d.path), `maximum: ${before} → ${size(d.path)}`);

console.log('pdf-watermark');
await gotoTool(page, 'pdf-watermark');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.getByLabel('Text', { exact: true }).fill('SECRET');
await page.getByRole('button', { name: /Apply/ }).click(); await page.waitForSelector('.result');
d = await dl();
const wt = text(d.path);
check(/SECRET/.test(wt.replace(/\s/g, '')) && (wt.match(/Page 1 of 3/g) || []).length === 2 && valid(d.path), 'watermark text + stamped number added (fixture already had its own footer → 2×)');

console.log('pdf-info');
await gotoTool(page, 'pdf-info');
await page.setInputFiles('input[data-testid="file-input"]', fx('three-pages.pdf'));
await page.getByLabel('Title').fill('My Title'); await page.getByLabel('Author').fill('Ada');
await page.getByRole('button', { name: 'Save changes' }).click(); await page.waitForSelector('.result');
d = await dl();
check(/My Title/.test(execSync(`pdfinfo ${d.path}`).toString()) && /Ada/.test(execSync(`pdfinfo ${d.path}`).toString()), 'metadata persisted');
await page.getByRole('button', { name: 'Strip all metadata' }).click(); await page.waitForTimeout(600);
d = await dl();
check(!/Ada/.test(execSync(`pdfinfo ${d.path}`).toString()), 'metadata stripped');

check(errors.length === 0, 'no console errors: ' + JSON.stringify(errors.slice(0, 3)));
await browser.close(); done();
