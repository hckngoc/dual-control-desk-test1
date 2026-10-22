import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../demo/server.mjs';

test('HTTP API: no identity, role bypass and success path',async()=>{
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const url=`http://127.0.0.1:${server.address().port}`;
 const call=async(user,route,method='GET',body)=>{const r=await fetch(url+route,{method,headers:{...(user?{'x-demo-user':user}:{}),'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}};
 try {
 assert.equal((await call(null,'/api/expenses')).status,401);
 assert.equal((await call('erin','/api/expenses','POST',{title:'Expense',amount:100})).status,403);
 assert.equal((await call('erin','/api/admin/roles','POST',{userId:'erin',role:'finance-approver'})).status,403);
 const created=await call('alice','/api/expenses','POST',{title:'Cloud contract',amount:14000});assert.equal(created.status,201);
 const id=created.body.id;
 assert.equal((await call('alice',`/api/expenses/${id}/approve`,'POST',{role:'finance-approver'})).status,403);
 assert.equal((await call('frank',`/api/expenses/${id}/execute`,'POST',{})).status,409);
 assert.equal((await call('bob',`/api/expenses/${id}/approve`,'POST',{role:'finance-approver'})).status,200);
 assert.equal((await call('carol',`/api/expenses/${id}/approve`,'POST',{role:'department-approver'})).body.status,'APPROVED');
 assert.equal((await call('frank',`/api/expenses/${id}/execute`,'POST',{})).body.status,'SETTLED_MOCK');
 const audit=(await call('frank','/api/audit')).body;
 assert.equal(audit.filter(e=>e.type==='APPROVED_BY_ROLE').length,2);
 assert.equal(audit.filter(e=>e.type==='ACTION_REJECTED').length,3);
 assert.equal(audit[0].type,'MOCK_SETTLEMENT');
 }finally{server.close();await once(server,'close');}
});
