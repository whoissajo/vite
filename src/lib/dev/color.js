export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function hexToRgb(h) {
  let s = h.trim().replace(/^#/, ''); if (s.length === 3 || s.length === 4) s = [...s].map((c) => c + c).join('');
  if (!/^([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16), a: s.length === 8 ? parseInt(s.slice(6), 16) / 255 : 1 };
}
export const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0; const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}
export function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}
export function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}
export function rgbToCmyk({ r, g, b }) {
  r /= 255; g /= 255; b /= 255; const k = 1 - Math.max(r, g, b); if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return { c: ((1 - r - k) / (1 - k)) * 100, m: ((1 - g - k) / (1 - k)) * 100, y: ((1 - b - k) / (1 - k)) * 100, k: k * 100 };
}
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export function rgbToOklch({ r, g, b }) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb); return { l: L * 100, c: C, h: C < 1e-4 ? 0 : (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360 };
}
export const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
/** Parse any CSS colour via hex fast-path, then the browser's own parser. */
export function parseColor(str) {
  const s = str.trim(); if (!s) return null;
  const h = hexToRgb(s); if (h) return h;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = '#010203'; ctx.fillStyle = s; const a = ctx.fillStyle;
  ctx.fillStyle = '#040506'; ctx.fillStyle = s; const b = ctx.fillStyle;
  if (a !== b) return null; // invalid string leaves the previous sentinel colour
  if (a.startsWith('#')) return hexToRgb(a);
  const m = a.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, bb, al = 1] = m[1].split(',').map(Number); return { r, g, b: bb, a: al };
}
export const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
