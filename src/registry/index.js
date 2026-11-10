import { GROUPS, groupById } from './meta.js';
import image from './groups/image.js';
import imageExtra from './groups/image-extra.js';
import pdf from './groups/pdf.js';
import video from './groups/video.js';
import audio from './groups/audio.js';
import text from './groups/text.js';
import dev from './groups/dev.js';
import files from './groups/files.js';

export { GROUPS, groupById };
export const TOOLS = [...image, ...imageExtra, ...pdf, ...video, ...audio, ...text, ...dev, ...files].map((t) => ({ ...t }));
export const toolById = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
export const toolsInGroup = (g) => TOOLS.filter((t) => t.group === g);

/** Lightweight scored search over name / tagline / keywords. */
export function searchTools(query, list = TOOLS) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const words = q.split(/\s+/);
  return list
    .map((t) => {
      const name = t.name.toLowerCase();
      const hay = `${name} ${t.tagline} ${(t.keywords || []).join(' ')} ${t.group}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (name.startsWith(w)) score += 6;
        else if (name.includes(w)) score += 4;
        else if ((t.keywords || []).some((k) => k.toLowerCase().startsWith(w))) score += 3;
        else if (hay.includes(w)) score += 1;
        else return null;
      }
      return { t, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}
