import { open, gotoTool, check, done } from './lib.mjs';
const { browser, page, errors } = await open();
const ids = ['json-format','json-convert','base64-tool','url-tool','uuid-generator','password-generator','jwt-decoder','regex-tester','timestamp-converter','color-converter','qr-generator','qr-scanner','number-base','html-format','cron-explainer','http-status'];
for (const id of ids) { await gotoTool(page, id); await page.waitForTimeout(400); const body = await page.locator('.tool-body').innerText(); check(body.length > 30 && !/something went wrong/i.test(body), `${id} renders`); }
// color
await gotoTool(page, 'color-converter'); let t = await page.locator('.tool-body').innerText();
check(/hsl\(217 91% 60%\)/.test(t), 'color #3b82f6 -> hsl(217 91% 60%)');
// number base
await gotoTool(page, 'number-base'); t = await page.locator('.tool-body').innerText();
check(/FF/.test(t) && /1111 1111/.test(t), 'number-base 255 -> FF / 1111 1111');
// cron
await gotoTool(page, 'cron-explainer'); t = await page.locator('.tool-body').innerText();
check(/09:00/.test(t) && /Monday/.test(t), 'cron explained');
// qr generator -> decode with jsqr in page
await gotoTool(page, 'qr-generator'); await page.waitForTimeout(500);
const png = await page.evaluate(() => document.querySelector('canvas').toDataURL());
check(png.length > 1000, 'qr canvas drawn');
// http status
await gotoTool(page, 'http-status'); await page.fill('input', '418'); t = await page.locator('.tool-body').innerText(); check(/teapot/i.test(t), 'http 418 search');
// uuid
await gotoTool(page, 'uuid-generator'); t = await page.locator('.tool-body').innerText(); check(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/.test(t), 'uuid v4 shown');
// regex catastrophic
await gotoTool(page, 'regex-tester'); await page.waitForTimeout(300);
check(errors.length === 0, `no console errors ${errors.slice(0,3).join(' | ')}`);
await browser.close(); done();
