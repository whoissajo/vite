/** Does `file` satisfy an <input accept> style string, e.g. "image/*,.heic,application/pdf"? */
export function matchesAccept(file, accept) {
  if (!accept || accept === '*' || accept === '*/*') return true;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export const readAsText = (file) => file.text();
export const readAsArrayBuffer = (file) => file.arrayBuffer();

export function readAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Decode an image File/Blob to an ImageBitmap with EXIF orientation applied.
 * Falls back to an <img> element decode for formats createImageBitmap rejects (e.g. SVG).
 */
export async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  if (canvas instanceof OffscreenCanvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`This browser can't encode ${type}.`))), type, quality);
  });
}

export function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Can this browser encode the given image mime type via canvas? (webp/avif support varies) */
export async function canEncodeImage(type) {
  try {
    const c = createCanvas(2, 2);
    const blob = await new Promise((r) => c.toBlob(r, type, 0.8));
    return !!blob && blob.type === type;
  } catch {
    return false;
  }
}

/** Yield to the event loop so the UI can repaint during long loops. */
export const tick = () => new Promise((r) => setTimeout(r, 0));
