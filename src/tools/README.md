# Writing a tool

A tool = one default-exported React component in `src/tools/<group>/<Name>.jsx` + one entry in `src/registry/groups/<group>.js`.

```js
// src/registry/groups/image.js
import { Minimize2 } from 'lucide-react';
export default [
  {
    id: 'image-compress',              // url: #/tool/image-compress  (kebab-case, unique, prefixed by group where natural)
    name: 'Compress Image',
    tagline: 'Shrink JPG, PNG and WebP — visibly identical, a fraction of the size.', // card text, ≤ 80 chars
    description: 'Longer sentence for the tool page header.',
    group: 'image',                    // image | pdf | video | audio | text | dev | files
    icon: Minimize2,                   // a lucide-react component
    keywords: ['reduce size', 'optimize', 'jpeg', 'webp'],   // search synonyms
    popular: true,                     // optional: eligible for the landing page showcase
    needs: ['webcodecs'],              // optional: shows a warning if the browser lacks it
    load: () => import('../../tools/image/ImageCompress.jsx'),
  },
];
```

The tool page already renders the title, description, "stays on your device" badges and related tools — the component
only renders the workspace. Use `ToolGrid` (workspace left, options right) and the kit in `src/components/ui`.
Use `useTask()` (`src/lib/common/hooks.js`) for anything slow: progress, cancel and error display come for free via `<TaskBar task={task} />`.

## Non-negotiable rules
1. **Real work only.** A "compressor" must compress, a "converter" must convert, and the result must be verifiable. Show real before/after sizes.
2. **Never present a worse result as a win.** If output is larger than the input, say so (`sizeStats` / `OutputList` already do) and offer/keep the original.
3. **100% local.** No `fetch` to the network, no CDN scripts, no remote fonts/wasm. Everything must be bundled so it works offline and inside the MV3 extension (no inline scripts, no `eval`/`new Function`; wasm is allowed).
4. **Honest errors.** Unsupported codec/format/browser → a clear `Alert` explaining what and why, not a silent failure or a fake output.
5. **Responsive**: usable at 360px wide. Use the layout primitives (`ToolGrid`, `.two-col`, `.stack`, `.row`) and avoid fixed widths.
6. Free memory: revoke object URLs (`useObjectUrl`), close `ImageBitmap`s.
7. Downloads via `downloadBlob`/`downloadZip` (`src/lib/common/download.js`). Names via `renameWithExt` etc. (`format.js`).
