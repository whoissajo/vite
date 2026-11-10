import { Image as ImageIcon, FileText, Clapperboard, AudioLines, Type, Braces, FolderArchive } from 'lucide-react';

/** Tool categories. `hue` feeds the per-card accent colour. */
export const GROUPS = [
  { id: 'image', name: 'Image', icon: ImageIcon, hue: 265, blurb: 'Compress, convert, resize, crop and clean photos.' },
  { id: 'pdf', name: 'PDF', icon: FileText, hue: 350, blurb: 'Merge, split, reorder, compress and extract.' },
  { id: 'video', name: 'Video', icon: Clapperboard, hue: 200, blurb: 'Compress, trim, convert and make GIFs with WebCodecs.' },
  { id: 'audio', name: 'Audio', icon: AudioLines, hue: 160, blurb: 'Convert, trim and record audio.' },
  { id: 'text', name: 'Text', icon: Type, hue: 40, blurb: 'Count, clean, diff and transform text.' },
  { id: 'dev', name: 'Developer', icon: Braces, hue: 295, blurb: 'JSON, hashes, JWT, regex, QR and friends.' },
  { id: 'files', name: 'Files', icon: FolderArchive, hue: 25, blurb: 'Zip, unzip and checksum anything.' },
];
export const groupById = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
