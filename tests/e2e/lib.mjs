import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');
export const BASE = process.env.BASE || 'http://localhost:5173';
export const fx = (n) => path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', n);
export const size = (p) => statSync(p).size;
export let failures = 0;
export const check = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗ FAIL'} ${msg}`); if (!cond) failures++; };
export async function open(opts = {}) {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { browser, ctx, page, errors };
}
export async function gotoTool(page, id) {
  const url = `${BASE}/#/tool/${id}`;
  const same = page.url() === url;
  await page.goto(url);
  if (same) await page.reload();
  await page.waitForSelector('.tool-body');
}
/** click button, wait for the resulting download, return {path, name} */
export async function download(page, clickFn, timeout = 60000) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout }), clickFn()]);
  const p = await dl.path();
  return { path: p, name: dl.suggestedFilename() };
}
export const done = () => { console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED'); process.exit(failures ? 1 : 0); };
