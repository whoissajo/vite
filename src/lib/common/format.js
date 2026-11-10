/** Human readable byte size: 1536 -> "1.5 KB" */
export function formatBytes(bytes = 0, digits = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  return `${i === 0 ? v : v.toFixed(v >= 100 ? 0 : digits)} ${units[i]}`;
}

/** Seconds -> "1:05" or "1:02:03" (optionally with tenths: "1:05.3") */
export function formatDuration(seconds = 0, withTenths = false) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const t = Math.floor((seconds % 1) * 10);
  const core = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  return withTenths ? `${core}.${t}` : core;
}

/** Percent saved between original and new size. Positive = smaller. */
export function percentSaved(original, next) {
  if (!original) return 0;
  return Math.round((1 - next / original) * 1000) / 10;
}

export function baseName(filename = 'file') {
  const i = filename.lastIndexOf('.');
  return i > 0 ? filename.slice(0, i) : filename;
}

export function extOf(filename = '') {
  const i = filename.lastIndexOf('.');
  return i > 0 ? filename.slice(i + 1).toLowerCase() : '';
}

const MIME_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif',
  'image/bmp': 'bmp', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'application/pdf': 'pdf',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/aac': 'aac', 'audio/mp4': 'm4a',
  'application/zip': 'zip', 'application/json': 'json', 'text/plain': 'txt', 'text/csv': 'csv', 'text/html': 'html',
};
export function extFromMime(mime = '') {
  return MIME_EXT[mime.split(';')[0].trim()] || mime.split('/')[1]?.split(';')[0] || 'bin';
}

/** "photo.jpg" + "webp" -> "photo.webp"; with suffix: ("photo.jpg","webp","-small") -> "photo-small.webp" */
export function renameWithExt(filename, ext, suffix = '') {
  return `${baseName(filename)}${suffix}.${ext}`;
}

export function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
export const stripExt = baseName;
