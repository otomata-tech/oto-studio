// Rend le fond de visio : la boucle MP4 (Zoom, Teams, ou Meet via une caméra virtuelle)
// et l'image fixe PNG — la seule que Meet accepte en fond personnalisé.
//   node posts/build-fond-visio.mjs   →  out/visio/fond-visio-otomata.{mp4,png}
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../service/render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const html = read('posts/fond-visio.html')
  .replace('/* __FONTS__ */', read('assets/fonts.css'))
  .replace('<!--__MARK__-->', read('brand/logos/otomata/otomata-mark.svg'));

const OUT = join(ROOT, 'out', 'visio'), tmp = join(OUT, '.rendu');
mkdirSync(OUT, { recursive: true });
const { files, ms } = await render({ html, dir: tmp, width: 1920, height: 1080, fps: 25, formats: ['png', 'mp4'] });
copyFileSync(join(tmp, files.png), join(OUT, 'fond-visio-otomata.png'));
copyFileSync(join(tmp, files.mp4), join(OUT, 'fond-visio-otomata.mp4'));
rmSync(tmp, { recursive: true, force: true });
console.log(`fond de visio rendu en ${(ms / 1000).toFixed(1)} s → out/visio/`);
process.exit(0);
