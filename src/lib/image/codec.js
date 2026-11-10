import UPNG from 'upng-js';
import { canvasToBlob, createCanvas, loadImage, tick } from '../common/files.js';

export const MIME_BY_EXT = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp' };
export const IMAGE_ACCEPT = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.svg';

/** Draw bitmap into a new canvas of (w,h) with high-quality stepped downscaling. */
export function scaleBitmap(bitmap, w, h, { background } = {}) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  let src = bitmap, sw = bitmap.width, sh = bitmap.height;
  // halve repeatedly while the reduction is more than 2x (avoids aliasing from one-shot big downscale)
  while (sw / 2 >= w && sh / 2 >= h) {
    const c = createCanvas(Math.max(w, Math.floor(sw / 2)), Math.max(h, Math.floor(sh / 2)));
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, c.width, c.height);
    src = c; sw = c.width; sh = c.height;
  }
  const out = createCanvas(w, h);
  const ctx = out.getContext('2d');
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  return out;
}

/** Fit (w,h) inside max box, never upscaling. */
export function fitWithin(w, h, max) {
  if (!max || (w <= max && h <= max)) return [w, h];
  const r = max / Math.max(w, h);
  return [Math.round(w * r), Math.round(h * r)];
}

/** Does the canvas contain any non-opaque pixel? */
export function hasAlpha(canvas) {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

/** Quantised (lossy, colors<=256) or lossless PNG via UPNG. colors=0 → lossless. */
export function encodePng(canvas, colors = 0) {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const buf = UPNG.encode([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)], canvas.width, canvas.height, colors);
  return new Blob([buf], { type: 'image/png' });
}

/** Real 24-bit BMP (BGR, bottom-up) — alpha flattened onto `background`. */
export function encodeBmp(canvas, background = '#ffffff') {
  const w = canvas.width, h = canvas.height;
  const flat = createCanvas(w, h);
  const fx = flat.getContext('2d');
  fx.fillStyle = background; fx.fillRect(0, 0, w, h); fx.drawImage(canvas, 0, 0);
  const { data } = fx.getImageData(0, 0, w, h);
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + rowSize * h;
  const buf = new ArrayBuffer(size);
  const dv = new DataView(buf);
  dv.setUint16(0, 0x4d42, true); dv.setUint32(2, size, true); dv.setUint32(10, 54, true);
  dv.setUint32(14, 40, true); dv.setInt32(18, w, true); dv.setInt32(22, h, true);
  dv.setUint16(26, 1, true); dv.setUint16(28, 24, true); dv.setUint32(34, rowSize * h, true);
  dv.setUint32(38, 2835, true); dv.setUint32(42, 2835, true);
  const u8 = new Uint8Array(buf);
  for (let y = 0; y < h; y++) {
    let o = 54 + (h - 1 - y) * rowSize;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      u8[o++] = data[i + 2]; u8[o++] = data[i + 1]; u8[o++] = data[i];
    }
  }
  return new Blob([buf], { type: 'image/bmp' });
}

/**
 * Encode a canvas to `mime`. quality 0..1 for jpeg/webp/avif; pngColors for PNG (0 = lossless).
 * JPEG/BMP flatten transparency onto `background`.
 */
export async function encodeCanvas(canvas, mime, { quality = 0.8, pngColors = 0, background = '#ffffff' } = {}) {
  if (mime === 'image/png') return encodePng(canvas, pngColors);
  if (mime === 'image/bmp') return encodeBmp(canvas, background);
  let c = canvas;
  if (mime === 'image/jpeg') {
    c = createCanvas(canvas.width, canvas.height);
    const x = c.getContext('2d');
    x.fillStyle = background; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvas, 0, 0);
  }
  const blob = await canvasToBlob(c, mime, quality);
  if (blob.type !== mime) throw new Error(`This browser can't encode ${mime.split('/')[1].toUpperCase()}.`);
  return blob;
}

export async function bitmapToCanvas(file, { maxDim, background } = {}) {
  const bmp = await loadImage(file);
  const [w, h] = fitWithin(bmp.width, bmp.height, maxDim);
  const canvas = (w === bmp.width && h === bmp.height)
    ? (() => { const c = createCanvas(w, h); const x = c.getContext('2d'); if (background) { x.fillStyle = background; x.fillRect(0, 0, w, h); } x.drawImage(bmp, 0, 0); return c; })()
    : scaleBitmap(bmp, w, h, { background });
  const info = { width: bmp.width, height: bmp.height };
  bmp.close?.();
  return { canvas, ...info };
}

/** Binary-search JPEG/WebP quality so the output is <= targetBytes (best effort). */
export async function encodeToTarget(canvas, mime, targetBytes, { background } = {}) {
  let lo = 0.05, hi = 0.95, best = null;
  for (let i = 0; i < 8; i++) {
    const q = (lo + hi) / 2;
    const b = await encodeCanvas(canvas, mime, { quality: q, background });
    if (b.size <= targetBytes) { best = b; lo = q; } else hi = q;
    await tick();
  }
  return best || encodeCanvas(canvas, mime, { quality: 0.05, background });
}

export { tick };
