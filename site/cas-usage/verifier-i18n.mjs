// Rend chaque scène (moments, héros, cas) dans une langue et liste les libellés sans traduction.
// Usage : node site/cas-usage/verifier-i18n.mjs [en]  — sort en erreur s'il en manque.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const langue = process.argv[2] || 'en';
const dir = new URL('.', import.meta.url).pathname;
const src = ['commun.js', 'i18n.js', 'scenes.js', 'cas.js'].map(f => readFileSync(dir + f, 'utf8')).join('\n');
const ctx = vm.createContext({ location: { search: `?l=${langue}` }, URLSearchParams, console });
vm.runInContext(src + `
  ;var manquants = new Set();
  var T0 = T; T = s => { try { return T0(s); } catch { manquants.add(s); return s; } };
  toit(); for (const [k, [, , f]] of Object.entries({ ...SCENES, ...CAS })) f();
  manquants = [...manquants];`, ctx);
if (ctx.manquants.length) { console.error(`${ctx.manquants.length} libellés sans traduction (${langue}) :`); console.log(JSON.stringify(ctx.manquants, null, 1)); process.exit(1); }
console.log(`toutes les scènes sont traduites (${langue})`);
