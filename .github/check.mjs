#!/usr/bin/env node
// Vérification d'intégrité du studio — sans dépendance, sans exécuter les modules.
// Ce que ça attrape vraiment :
//   1. une erreur de syntaxe dans un .mjs (service/server.mjs est lancé par systemd :
//      une faute ici = le service ne démarre plus, et ça ne se voit qu'en prod) ;
//   2. un import relatif qui ne résout pas (module renommé/déplacé → crash au boot) ;
//   3. un .json cassé (assets/icons.json, cards/usecases.json, brand/slider/tokens.json
//      sont lus par les gabarits et par les consommateurs du design system) ;
//   4. un token CSS du thème qui pointe un fichier @import absent.
// On ne fait PAS `import()` : server.mjs ouvre un port et écrit sur le disque au
// chargement. `node --check` + résolution statique donnent le même filet sans effet de bord.
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, extname } from 'node:path';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);

const errors = [];
const fail = (f, msg) => errors.push(`${f}: ${msg}`);

// 1 + 2 — les modules JS
const js = files.filter(f => ['.mjs', '.js'].includes(extname(f)));
for (const f of js) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    fail(f, `syntaxe invalide\n${(e.stderr || '').toString().trim()}`);
    continue;
  }
  const src = readFileSync(f, 'utf8');
  const specs = [...src.matchAll(/(?:^|\s)(?:import|export)[^;]*?from\s*['"](\.[^'"]+)['"]/gs),
                 ...src.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)];
  for (const [, spec] of specs) {
    const target = resolve(dirname(f), spec);
    if (!existsSync(target)) fail(f, `import relatif introuvable : ${spec}`);
  }
}

// 3 — les JSON
for (const f of files.filter(f => extname(f) === '.json')) {
  try { JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { fail(f, `JSON invalide : ${e.message}`); }
}

// 4 — les @import CSS
for (const f of files.filter(f => extname(f) === '.css')) {
  const src = readFileSync(f, 'utf8');
  for (const [, spec] of src.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) {
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue; // paquet (ex. "tailwindcss")
    if (!existsSync(resolve(dirname(f), spec))) fail(f, `@import introuvable : ${spec}`);
  }
}

const checked = js.length + files.filter(f => ['.json', '.css'].includes(extname(f))).length;
if (errors.length) {
  console.error(`✗ ${errors.length} problème(s) sur ${checked} fichier(s) vérifié(s) :\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
if (!js.length) { console.error('✗ aucun module JS vérifié — le filet ne couvre rien'); process.exit(1); }
console.log(`✓ ${checked} fichier(s) vérifié(s) : ${js.length} module(s) JS, imports relatifs résolus, JSON et @import CSS valides`);
