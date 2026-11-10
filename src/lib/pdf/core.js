import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl; // bundled locally → works offline and in the extension

export const PDF_ACCEPT = 'application/pdf,.pdf';

const friendly = (e) => {
  const m = String(e?.message || e);
  if (/encrypt|password/i.test(m) || e?.name === 'PasswordException') return new Error('This PDF is password-protected. Remove the password first, then try again.');
  if (/Invalid PDF|No PDF header|bad XRef|Failed to parse/i.test(m)) return new Error('This file doesn’t look like a valid PDF (it may be corrupt).');
  return e instanceof Error ? e : new Error(m);
};

/** Load with pdf-lib (editing). Throws a friendly error for encrypted/corrupt files. */
export async function loadPdfLib(fileOrBytes) {
  const bytes = fileOrBytes instanceof Uint8Array ? fileOrBytes : new Uint8Array(await fileOrBytes.arrayBuffer());
  try { return { bytes, doc: await PDFDocument.load(bytes) }; } catch (e) { throw friendly(e); }
}

/** Open with pdf.js (rendering / text). Caller must `await doc.destroy()`. */
export async function openPdfJs(fileOrBytes) {
  const bytes = fileOrBytes instanceof Uint8Array ? fileOrBytes : new Uint8Array(await fileOrBytes.arrayBuffer());
  try {
    const task = pdfjs.getDocument({ data: bytes.slice() });
    const doc = await task.promise;
    doc.destroy = () => task.destroy(); // pdf.js v6 only exposes destroy on the loading task
    return doc;
  } catch (e) { throw friendly(e); }
}

/** Render one page to a canvas at `scale` (1 = 72 dpi). */
export async function renderPage(pdf, pageNo, scale = 1, canvas = document.createElement('canvas')) {
  const page = await pdf.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, canvas, viewport }).promise;
  page.cleanup();
  return canvas;
}

/** "1-3, 5, 8-" → sorted unique 1-based page numbers; throws with a helpful message. */
export function parseRanges(text, total) {
  const out = [];
  for (const part of text.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*(?:-\s*(\d*))?$/);
    if (!m || (!m[1] && !m[2])) throw new Error(`“${part}” is not a valid page or range.`);
    const a = m[1] ? +m[1] : 1;
    const b = part.includes('-') ? (m[2] ? +m[2] : total) : a;
    if (a < 1 || b > total || a > b) throw new Error(`“${part}” is outside 1–${total} (or backwards).`);
    out.push([a, b]);
  }
  if (!out.length) throw new Error('Enter at least one page or range.');
  return out;
}
export const rangeToPages = ([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export async function copyPagesInto(target, srcDoc, indices) {
  const pages = await target.copyPages(srcDoc, indices);
  pages.forEach((p) => target.addPage(p));
}
export const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' });
