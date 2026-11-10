import { open, gotoTool, check, done, fx, download, size } from './lib.mjs';
import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
const { browser, page, errors } = await open();
const probe = (p) => JSON.parse(execSync(`ffprobe -v error -show_format -show_streams -of json "${p}"`).toString());
const up = (p) => page.setInputFiles('[data-testid=file-input]', p);
const click = (n) => page.getByRole('button', { name: n }).first().click();
const W = 90000;

// compress
await gotoTool(page, 'video-compress'); await up(fx('big.mp4')); await page.waitForSelector('.chip');
await page.getByRole('radio', { name: /smallest/i }).click(); await page.locator('select').first().selectOption('360');
let d = await download(page, async () => { await click(/compress video/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
let pr = probe(d.path); let v = pr.streams.find((s) => s.codec_type === 'video');
check(size(d.path) < size(fx('big.mp4')) && v.height <= 360, `compress ${size(fx('big.mp4'))} → ${size(d.path)} (${v.width}x${v.height}, ${v.codec_name})`);
// convert → webm
await gotoTool(page, 'video-convert'); await up(fx('sample.mp4')); await page.waitForSelector('.chip'); await page.getByRole('radio', { name: 'WebM' }).click();
d = await download(page, async () => { await click(/^convert$/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
pr = probe(d.path); check(/matroska|webm/.test(pr.format.format_name) && pr.streams.some((s) => s.codec_type === 'video'), `convert → ${pr.format.format_name}`);
// trim
await gotoTool(page, 'video-trim'); await up(fx('sample.mp4')); await page.waitForSelector('.chip');
const nums = page.locator('input[type=number]'); await nums.nth(0).fill('0.5'); await nums.nth(1).fill('1.5');
d = await download(page, async () => { await click(/trim video/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
const dur = Number(probe(d.path).format.duration); check(Math.abs(dur - 1) < 0.3, `trim duration ${dur}`);
// mute
await gotoTool(page, 'video-mute'); await up(fx('sample.mp4')); await page.waitForSelector('.chip');
d = await download(page, async () => { await click(/remove audio/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
pr = probe(d.path); check(!pr.streams.some((s) => s.codec_type === 'audio') && pr.streams.some((s) => s.codec_type === 'video'), 'mute: no audio stream');
// gif
await gotoTool(page, 'video-to-gif'); await up(fx('sample.mp4')); await page.waitForSelector('.chip');
d = await download(page, async () => { await click(/create gif/i); await page.waitForSelector('[data-testid=gif-out]', { timeout: W }); await click(/download gif/i); });
pr = probe(d.path); check(pr.streams[0].codec_name === 'gif', `gif ${pr.streams[0].width}x${pr.streams[0].height} ${size(d.path)}B`);
// frames
await gotoTool(page, 'video-frames'); await up(fx('sample.mp4')); await page.waitForSelector('.chip');
d = await download(page, () => click(/extract/i)); check(size(d.path) > 500, 'frame download'); 
// transform rotate
await gotoTool(page, 'video-transform'); await up(fx('sample.mp4')); await page.waitForSelector('.chip'); await page.getByRole('radio', { name: '90°' }).click();
d = await download(page, async () => { await click(/^apply/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
v = probe(d.path).streams.find((s) => s.codec_type === 'video'); const iv = probe(fx('sample.mp4')).streams.find((s) => s.codec_type === 'video');
check(v.width === iv.height && v.height === iv.width, `rotate ${iv.width}x${iv.height} → ${v.width}x${v.height}`);
// media info
await gotoTool(page, 'media-info'); await up(fx('sample.mp4')); await page.waitForSelector('dl.kv'); check(/H\.264|VP9|AV1/.test(await page.locator('.tool-body').innerText()), 'media-info shows codec');
// audio convert wav → mp3
await gotoTool(page, 'audio-convert'); await up(fx('sample.wav')); await page.waitForSelector('.chip');
d = await download(page, async () => { await click(/convert audio/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
pr = probe(d.path); check(pr.streams[0].codec_name === 'mp3', `wav→mp3 ${pr.streams[0].codec_name} ${size(d.path)}B`);
// extract audio from video → wav
await gotoTool(page, 'audio-extract'); await up(fx('sample.mp4')); await page.waitForSelector('.chip'); await page.getByRole('radio', { name: 'WAV' }).click();
d = await download(page, async () => { await click(/extract audio/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
pr = probe(d.path); check(pr.streams.length === 1 && pr.streams[0].codec_type === 'audio', `extract → ${pr.streams[0].codec_name}`);
// audio trim
await gotoTool(page, 'audio-trim'); await up(fx('sample.wav')); await page.waitForSelector('.chip');
await page.locator('input[type=number]').nth(1).fill('1');
d = await download(page, async () => { await click(/trim audio/i); await page.waitForSelector('[data-testid=out-media]', { timeout: W }); await click(/^download/i); });
check(Math.abs(Number(probe(d.path).format.duration) - 1) < 0.2, 'audio trim ~1s');
// recorder (fake mic)
await gotoTool(page, 'audio-voice-recorder'); await click(/start recording/i); await page.waitForTimeout(1500); await click(/^stop/i); await page.waitForSelector('[data-testid=rec-audio]'); check(true, 'recorder produced audio');
check(errors.length === 0, 'no console errors ' + errors.slice(0, 3).join(' | '));
await browser.close(); done();
