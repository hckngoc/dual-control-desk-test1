// Run against a separately started build with NO adapter; never inject fake runtime configuration.
import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:3100';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname),'Smoke target must be local');
for(const [path,expected] of [['/api/config',503],['/api/expenses',401],['/api/audit',401],['/api/whoami',401],['/api/customers',401]]) {
  const response=await fetch(new URL(path,origin),{headers:{'x-demo-user':'alice'}});
  assert.equal(response.status,expected,path);
  assert.equal(response.headers.get('cache-control'),'no-store',path);
  console.log(`PASS ${path}: ${expected}`);
}
for(const path of ['/expenses','/dashboard','/auth/redirect']) {
  const response=await fetch(new URL(path,origin));
  assert.equal(response.status,200,path);
  console.log(`PASS ${path}: 200`);
}
const root=await fetch(origin,{redirect:'manual'});
assert.equal(root.status,307);
assert.equal(root.headers.get('location'),'/expenses');
console.log('PASS /: 307 to /expenses');
