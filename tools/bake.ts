import { writeFileSync } from 'node:fs';
import { bakeAll } from '../src/content/bake';
const b = bakeAll();
writeFileSync(new URL('../src/content/baked.json', import.meta.url), JSON.stringify(b));
console.log('baked', Object.entries(b).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(' '));
