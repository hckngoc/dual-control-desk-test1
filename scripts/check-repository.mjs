import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const normalized = value => value.replace(/\r\n/g,'\n');
async function same(left,right) {
  assert.equal(normalized(await readFile(path.join(root,left),'utf8')),normalized(await readFile(path.join(root,right),'utf8')),`${left} differs from ${right}`);
}
await same('core/engine.mjs','app/src/lib/expense/engine.mjs');
async function checkOverlay(relative='') {
  for(const entry of await readdir(path.join(root,'tide-overlay/src',relative),{withFileTypes:true})) {
    const child=path.join(relative,entry.name);
    if(entry.isDirectory()) await checkOverlay(child);
    else await same(path.join('tide-overlay/src',child),path.join('app/src',child));
  }
}
await checkOverlay();
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=tracked.filter(file=>{
  const base=path.posix.basename(file);
  if(base==='.env.example') return false;
  return /^\.env(?:\.|$)/.test(base)||base==='tidecloak.json'||base==='.skycloak-api-key'||
    /(?:^|\/)(node_modules|\.next)(?:\/|$)/.test(file)||/keycloakdb|\.(?:pem|key|tsbuildinfo)$/.test(base);
});
assert.deepEqual(forbidden,[],'Tracked local secrets or generated files are forbidden');
console.log('PASS: canonical engine/overlay match and tracked-file hygiene (path check only).');
