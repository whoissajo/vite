import { zipSync } from 'fflate';

/** Trigger a browser download for a Blob / File. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadText(text, filename, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type }), filename);
}

/**
 * Zip several outputs and download as one file.
 * files: [{ name: string, blob?: Blob, data?: Uint8Array }]
 * Already-compressed formats (jpg/png/mp4...) are stored, text-like data is deflated.
 */
export async function zipFiles(files, { level } = {}) {
  const entries = {};
  const used = new Set();
  for (const f of files) {
    let name = f.name;
    // de-duplicate names inside the archive
    let n = 1;
    while (used.has(name)) {
      const dot = f.name.lastIndexOf('.');
      name = dot > 0 ? `${f.name.slice(0, dot)} (${n})${f.name.slice(dot)}` : `${f.name} (${n})`;
      n++;
    }
    used.add(name);
    const data = f.data || new Uint8Array(await f.blob.arrayBuffer());
    const already = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|mkv|mp3|aac|ogg|flac|zip|pdf)$/i.test(name);
    entries[name] = [data, { level: level ?? (already ? 0 : 6) }];
  }
  return new Blob([zipSync(entries)], { type: 'application/zip' });
}

export async function downloadZip(files, zipName = 'offkit-files.zip') {
  downloadBlob(await zipFiles(files), zipName);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback for insecure contexts / older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* noop */ }
    ta.remove();
    return ok;
  }
}
