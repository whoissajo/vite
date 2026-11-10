# OffKit — offline-first toolbox

Image, PDF, video, audio, text, developer and file tools that run **entirely in your browser**. No uploads, no accounts, no fake results — every tool does the real work with real codecs and libraries, and works with no internet once loaded.

- **Website** (React 19 + Vite, hash-routed, installable PWA with a service worker for offline use)
- **Browser extension** (`extension/`, Manifest V3) — all tools offline on your PC, no website needed

## Install the extension (Chrome, Edge, Brave, Opera, Firefox)
1. Download `offkit-extension.zip` from the site's *Extension* section (or run `npm run build` and take it from `public/`) and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`), enable **Developer mode**.
3. Click **Load unpacked** and choose the unzipped `offkit-extension` folder (or this repo's `extension/` after building).
4. Pin OffKit; click its icon for the launcher.

Firefox: `about:debugging` → *This Firefox* → *Load Temporary Add-on* → pick `manifest.json`.

## Develop
```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # builds extension/app + zip, then the website into dist/
npm run build:extension
npm run test:e2e       # Playwright suites in tests/e2e (needs `npm run dev`)
```

## Deploy to Vercel
Import the repo — `vercel.json` already sets the build command, output directory and cache headers. Or run `npx vercel --prod`.

## Adding a tool
Create a component in `src/tools/<group>/`, add an entry to `src/registry/groups/<group>.js` (see `src/tools/README.md`). It appears on the site, in search, in the command palette and in the extension popup automatically.

## Honest limits
Video/audio encoding uses WebCodecs (Chrome/Edge/Brave/Opera, Safari 17+; Firefox partial). Codecs the browser can't encode (e.g. AAC on some Linux builds) are reported instead of faked. MP3 uses a bundled WASM encoder.
