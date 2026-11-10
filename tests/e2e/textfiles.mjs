import { open, gotoTool, check, done, fx, download } from './lib.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { unzipSync } from 'node:zlib';
import crypto from 'node:crypto';
const { browser, page, errors } = await open();
const ids = ['text-counter','text-case','text-diff','text-lines','text-lorem','text-slug','text-markdown','text-escape','zip-create','zip-extract','file-hash'];
for (const id of ids) { await gotoTool(page, id); const b = await page.locator('.tool-body').innerText(); check(b.length > 20, `${id} renders`); }
await gotoTool(page, 'text-counter'); await page.fill('textarea', 'Hello world. This is two sentences!'); let t = await page.locator('.tool-body').innerText(); check(/Words\s*\n?\s*6/i.test(t), 'counter: 6 words');
await gotoTool(page, 'text-case'); t = await page.locator('.tool-body').innerText(); check(t.includes('theQuickBrownFoxJumpsOverTheLazyDog') && t.includes('the_quick_brown_fox'), 'case conversions');
await gotoTool(page, 'text-lines'); const out = await page.locator('textarea').nth(1).inputValue(); check(out === 'apple\nbanana\nCherry', `lines dedupe+sort: ${JSON.stringify(out)}`);
await gotoTool(page, 'text-slug'); const sl = await page.locator('textarea').nth(1).inputValue(); check(sl.startsWith('hello-world-creme-brulee-strasse'), `slug: ${sl}`);
await gotoTool(page, 'text-markdown'); check(await page.locator('[data-testid=md-preview] table').count() === 1 && await page.locator('[data-testid=md-preview] h1').count() === 1, 'markdown renders table+h1');
await gotoTool(page, 'text-diff'); check(await page.locator('.diff-add').count() > 0 && await page.locator('.diff-del').count() > 0, 'diff highlights');
await gotoTool(page, 'text-escape'); const es = await page.locator('textarea').nth(1).inputValue(); check(es.includes('&lt;a href=&quot;x&quot;&gt;Tom &amp;'), 'html escape');
// zip create → verify content
writeFileSync('/tmp/claude-0/a.txt', 'hello hello hello hello '.repeat(500)); 
await gotoTool(page, 'zip-create'); await page.setInputFiles('[data-testid=file-input]', ['/tmp/claude-0/a.txt', fx('sample.wav')]);
await page.getByRole('button', { name: /create zip/i }).click(); const dl = await download(page, () => page.getByRole('button', { name: /^download/i }).click());
const zb = readFileSync(dl.path); check(zb[0] === 0x50 && zb[1] === 0x4b, 'zip magic'); 
// zip extract on that zip
await gotoTool(page, 'zip-extract'); writeFileSync('/tmp/claude-0/t.zip', zb); await page.setInputFiles('[data-testid=file-input]', '/tmp/claude-0/t.zip'); await page.waitForSelector('.out-item'); check((await page.locator('.out-item').count()) === 2, 'zip extract lists 2 entries');
// hash
await gotoTool(page, 'file-hash'); await page.setInputFiles('[data-testid=file-input]', '/tmp/claude-0/a.txt'); await page.waitForSelector('[data-testid=hash-SHA-256]');
const want = crypto.createHash('sha256').update(readFileSync('/tmp/claude-0/a.txt')).digest('hex'); check((await page.locator('[data-testid=hash-SHA-256]').first().innerText()) === want, 'sha256 matches node');
const wantM = crypto.createHash('md5').update(readFileSync('/tmp/claude-0/a.txt')).digest('hex'); check((await page.locator('[data-testid=hash-MD5]').first().innerText()) === wantM, 'md5 matches node');
check(errors.length === 0, 'no console errors ' + errors.slice(0, 3).join('|'));
await browser.close(); done();
