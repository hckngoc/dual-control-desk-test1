// Isolated cryptographic fixtures, generated in memory. These never configure a running Tide app.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { generateKeyPair, exportJWK, calculateJwkThumbprint, SignJWT } from 'jose';
import { NextRequest } from 'next/server.js';
import { GET as configRoute } from '../src/app/api/config/route.ts';
import { GET as list, POST as create } from '../src/app/api/expenses/route.ts';
import { POST as approve } from '../src/app/api/expenses/[id]/approve/route.ts';
import { POST as execute } from '../src/app/api/expenses/[id]/execute/route.ts';
import { GET as audit } from '../src/app/api/audit/route.ts';
import { GET as whoami } from '../src/app/api/whoami/route.ts';
import { GET as customers } from '../src/app/api/customers/route.ts';
import { verifyTideJWT, hasRole } from '../src/lib/auth/tideJWT.ts';
import { validateTideConfig } from '../src/lib/auth/tidecloakConfig.ts';
import { verifyDpop, requestHtu, MemoryJtiStore } from '../src/lib/auth/verifyDpop.ts';
import { withAuth } from '../src/lib/auth/protect.ts';

test('real Next route handlers with isolated JWT and DPoP fixtures (not live Tide)', async t => {
  const previous = process.env.CLIENT_ADAPTER;
  const previousProxy = process.env.TRUST_PROXY_HEADERS;
  delete process.env.TRUST_PROXY_HEADERS;
  t.after(() => {
    if (previous === undefined) delete process.env.CLIENT_ADAPTER; else process.env.CLIENT_ADAPTER = previous;
    if (previousProxy === undefined) delete process.env.TRUST_PROXY_HEADERS; else process.env.TRUST_PROXY_HEADERS = previousProxy;
  });
  const realm = await generateKeyPair('ES256');
  const client = await generateKeyPair('ES256');
  const publicRealm = await exportJWK(realm.publicKey);
  const publicClient = await exportJWK(client.publicKey);
  const jkt = await calculateJwkThumbprint(publicClient);
  const config = {
    realm: 'unit-fixture', resource: 'unit-client', 'auth-server-url': 'https://identity.example.invalid',
    'public-client': true, jwk: { keys: [publicRealm] }, vendorId: 'unit-fixture', homeOrkUrl: 'https://ork.example.invalid',
  };
  process.env.CLIENT_ADAPTER = JSON.stringify(config);
  async function access(claims = {}, signingKey = realm.privateKey) {
    const now = Math.floor(Date.now()/1000);
    return new SignJWT({ iss: config['auth-server-url']+'/realms/'+config.realm, aud: config.resource,
      azp: config.resource, sub: 'requester-sub', iat: now, exp: now+300, cnf: { jkt }, realm_access: {roles:['requester']}, ...claims })
      .setProtectedHeader({alg:'ES256'}).sign(signingKey);
  }
  async function request(path, { method='GET', claims={}, body, raw, token, scheme='DPoP', proofClaims={}, proofKey=client.privateKey, proofJwk=publicClient, headers={} } = {}) {
    token ??= await access(claims);
    const url = 'https://desk.example.invalid'+path;
    const proof = await new SignJWT({ htm:method, htu:new URL(url).origin+new URL(url).pathname,
      iat:Math.floor(Date.now()/1000), jti:randomUUID(), ath:createHash('sha256').update(token).digest('base64url'), ...proofClaims })
      .setProtectedHeader({alg:'ES256',typ:'dpop+jwt',jwk:proofJwk}).sign(proofKey);
    return new NextRequest(url,{method,headers:{authorization:scheme+' '+token,dpop:proof,'content-type':'application/json',...headers},
      ...(raw !== undefined ? {body:raw} : body !== undefined ? {body:JSON.stringify(body)} : {})});
  }
  const identity = (sub,roles) => ({sub,realm_access:{roles}});
  const finance = identity('finance-sub',['finance-approver']);
  const dept = identity('department-sub',['department-approver']);
  const treasury = identity('treasury-sub',['treasury-executor']);
  await t.test('public config is allowlisted, not cached, and fails closed',async()=>{
    process.env.CLIENT_ADAPTER=JSON.stringify({...config,adminPassword:'must-never-be-returned'});
    const response=await configRoute();
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.json()).adminPassword,undefined);
    for(const value of ['', '{', JSON.stringify({...config,jwk:{keys:[]}}), JSON.stringify({...config,credentials:{secret:'unit-only'}})]) {
      process.env.CLIENT_ADAPTER=value;
      assert.equal((await configRoute()).status,503);
    }
    const privateJwk=await exportJWK((await generateKeyPair('ES256',{extractable:true})).privateKey);
    assert.throws(()=>validateTideConfig({...config,jwk:{keys:[privateJwk]}}));
    process.env.CLIENT_ADAPTER=JSON.stringify(config);
  });
  await t.test('no authentication, demo headers and Bearer downgrade are rejected',async()=>{
    for(const handler of [list,audit,whoami,customers,create,approve,execute]) assert.equal((await handler(new NextRequest('https://desk.example.invalid/api/expenses',{headers:{'x-demo-user':'alice'}}))).status,401);
    assert.equal((await list(await request('/api/expenses',{scheme:'Bearer'}))).status,401);
    const req=await request('/api/expenses');req.headers.delete('dpop');
    assert.equal((await list(req)).status,401);
  });
  await t.test('JWT requires verified signature, issuer, audience, azp, expiry, issue time and subject',async()=>{
    for(const claims of [{iss:'https://other.invalid'},{aud:'other-client'},{azp:'other-client'},{exp:0},{exp:undefined},{iat:undefined},{iat:Date.now()/1000+600},{sub:''},{sub:undefined},{cnf:{}}]) {
      assert.equal((await list(await request('/api/expenses',{claims}))).status,401,JSON.stringify(claims));
    }
    const wrong=await generateKeyPair('ES256');
    await assert.rejects(()=>verifyTideJWT('invalid.compact.token'));
    assert.equal((await list(await request('/api/expenses',{token:await access({},wrong.privateKey)}))).status,401);
    assert.equal(hasRole({resource_access:{unrelated:{roles:['finance-approver']}}},'finance-approver'),false);
  });
  await t.test('DPoP rejects mismatched method, URL, token hash, stale proof, key and replay',async()=>{
    for(const proofClaims of [{htm:'POST'},{htm:'get'},{htu:'https://evil.invalid/api/expenses'},{ath:'wrong'},{iat:0},{jti:''}]) {
      assert.equal((await list(await request('/api/expenses',{proofClaims}))).status,401);
    }
    const wrong=await generateKeyPair('ES256');
    assert.equal((await list(await request('/api/expenses',{proofKey:wrong.privateKey,proofJwk:await exportJWK(wrong.publicKey)}))).status,401);
    const req=await request('/api/expenses');
    assert.equal((await list(req)).status,200);
    assert.equal((await list(req)).status,401);
    assert.equal((await list(await request('/api/expenses?filter=all'))).status,200);
  });
  await t.test('proxy headers need explicit trust; future proofs retain their whole replay window',async()=>{
    const req={url:'http://localhost:3000/api/expenses?x=1',headers:new Headers({'x-forwarded-host':'desk.example.invalid','x-forwarded-proto':'https'})};
    assert.equal(requestHtu(req),'http://localhost:3000/api/expenses');
    assert.equal(requestHtu(req,true),'https://desk.example.invalid/api/expenses');
    const iat=Math.floor(Date.now()/1000)+200;
    let expires;
    const token=await access();
    const r=await request('/api/expenses',{token,proofClaims:{iat}});
    await verifyDpop(r,token,{cnf:{jkt}},{jtiStore:{async claim(_id,expiry){expires=expiry;return true;}}});
    assert.equal(expires,(iat+300)*1000);
    const memory=new MemoryJtiStore();assert.equal(await memory.claim('same',Date.now()+1000),true);assert.equal(await memory.claim('same',Date.now()+1000),false);
  });
  await t.test('handler exceptions are not misreported as 401',async()=>{
    const req=await request('/api/expenses');
    await assert.rejects(()=>withAuth(async()=>{throw new Error('handler failure');})(req),/handler failure/);
  });
  await t.test('malformed payloads, role checks and route IDs have consistent statuses',async()=>{
    for(const raw of ['{','null','[]','true','']) assert.equal((await create(await request('/api/expenses',{method:'POST',raw}))).status,400);
    assert.equal((await create(await request('/api/expenses',{method:'POST',raw:' '.repeat(10001)}))).status,413);
    assert.equal((await create(await request('/api/expenses',{method:'POST',body:{title:'Valid title',amount:10},headers:{'content-type':'text/plain'}}))).status,415);
    assert.equal((await create(await request('/api/expenses',{method:'POST',claims:finance,body:{title:'No permission',amount:10}}))).status,403);
    assert.equal((await approve(await request('/api/expenses/bad/approve',{method:'POST',claims:finance,body:{role:'finance-approver'}}))).status,404);
    assert.equal((await create(await request('/api/expenses',{method:'POST',body:{title:'Bad amount',amount:true}}))).status,400);
  });
  await t.test('workflow uses verified sub and realm roles; independent quorum and settlement',async()=>{
    const created=await create(await request('/api/expenses',{method:'POST',body:{title:'Cloud contract',amount:12000,roles:['treasury-executor'],submittedBy:'forged-sub'}}));
    assert.equal(created.status,201);
    const expense=await created.json(),base='/api/expenses/'+expense.id;
    assert.equal(expense.submittedBy,'requester-sub');
    const serverIdentity=await (await whoami(await request('/api/whoami'))).json();
    assert.equal(serverIdentity.id,'requester-sub');
    assert.deepEqual(serverIdentity.roles,['requester']);
    const sign=async(claims,role)=>approve(await request(base+'/approve',{method:'POST',claims,body:{role}}));
    assert.equal((await sign(identity('requester-sub',['finance-approver']),'finance-approver')).status,403);
    assert.equal((await sign(identity('outsider',[]),'finance-approver')).status,403);
    assert.equal((await execute(await request(base+'/execute',{method:'POST',claims:treasury}))).status,409);
    const both=identity('finance-sub',['finance-approver','department-approver']);
    const concurrent=await Promise.all([sign(both,'finance-approver'),sign(both,'finance-approver')]);
    assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
    assert.equal((await sign(both,'department-approver')).status,409);
    const approved=await sign(dept,'department-approver');assert.equal((await approved.json()).status,'APPROVED');
    assert.equal((await execute(await request(base+'/execute',{method:'POST',claims:finance}))).status,403);
    const settled=await execute(await request(base+'/execute',{method:'POST',claims:treasury}));
    assert.equal((await settled.json()).status,'SETTLED_MOCK');
    assert.equal((await execute(await request(base+'/execute',{method:'POST',claims:treasury}))).status,409);
    const events=await (await audit(await request('/api/audit'))).json();
    assert.ok(events.some(e=>e.type==='ACTION_REJECTED'&&e.expenseId===expense.id));
    assert.equal(events.filter(e=>e.type==='APPROVED_BY_ROLE'&&e.expenseId===expense.id).length,2);
    assert.equal(events.filter(e=>e.type==='MOCK_SETTLEMENT'&&e.expenseId===expense.id).length,1);
  });
});
