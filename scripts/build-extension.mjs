// Builds the offline app into extension/app, writes the popup tool index and zips the extension for the website.
//   npm run build:extension
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ext = path.join(root, 'extension');

rmSync(path.join(root, 'public/offkit-extension.zip'), { force: true }); // never bundle an old zip inside the new one
console.log('› vite build --mode extension');
execFileSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', 'extension'], { cwd: root, stdio: 'inherit' });

// tool index for the popup (no icons / loaders — plain JSON)
const { TOOLS, GROUPS } = await import(path.join(root, 'src/registry/index.js'));
const tools = TOOLS.map(({ id, name, tagline, group, keywords = [], popular = false }) => ({ id, name, tagline, group, keywords, popular }));
const groups = GROUPS.filter((g) => tools.some((t) => t.group === g.id)).map(({ id, name }) => ({ id, name }));
writeFileSync(path.join(ext, 'popup/tools.json'), JSON.stringify({ tools, groups }));
console.log(`› popup index: ${tools.length} tools`);

// the extension must not contain files the CSP/manifest can't use
for (const f of ['app/sw.js', 'app/offkit-extension.zip']) rmSync(path.join(ext, f), { force: true });

// zip → public/offkit-extension.zip (served by the website build)
const files = {};
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === '.DS_Store' || name.endsWith('.map')) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files[`offkit-extension/${path.relative(ext, p).split(path.sep).join('/')}`] = [new Uint8Array(readFileSync(p)), { level: /\.(png|woff2|wasm|mp4)$/.test(name) ? 0 : 6 }];
  }
};
walk(ext);
mkdirSync(path.join(root, 'public'), { recursive: true });
const zip = zipSync(files);
writeFileSync(path.join(root, 'public/offkit-extension.zip'), zip);
console.log(`› public/offkit-extension.zip (${(zip.length / 1024 / 1024).toFixed(1)} MB, ${Object.keys(files).length} files)`);
