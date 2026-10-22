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
 assert.equal((await call('frank','/api/audit')).body.length,4);
 const req2=await call('alice','/api/expenses','POST',{title:'Unauthorized purchase',amount:15000});
 const id2=req2.body.id;
 assert.equal((await call('alice',`/api/expenses/${id2}/reject`,'POST',{role:'finance-approver',reason:'Self reject'})).status,403);
 assert.equal((await call('bob',`/api/expenses/${id2}/reject`,'POST',{role:'finance-approver',reason:'Budget exceeded'})).status,200);
 assert.equal((await call('frank',`/api/expenses/${id2}/execute`,'POST',{})).status,409);

 // Policy-Governed Signing & Dual-Control Requests API Flow
 const rCreate = await call('alice', '/api/requests', 'POST', {
   title: 'High-Value Treasury Wire Transfer',
   category: 'Treasury Wire Transfer',
   payload: { amount: 50000, recipient: 'Offshore Vendor Ltd' },
 });
 assert.equal(rCreate.status, 201);
 assert.equal(rCreate.body.status, 'PENDING_QUORUM');
 assert.equal(rCreate.body.requiresDualControl, true);
 const rId = rCreate.body.id;

 // Strict Maker-Checker: Initiator self-approval blocked
 const rSelfApprove = await call('alice', `/api/requests/${rId}/approve`, 'POST', {});
 assert.equal(rSelfApprove.status, 403);
 assert.equal(rSelfApprove.body.error, 'Dual-Control Violation: Initiator cannot approve their own request.');

 // Checker 1 approves
 const rApprove1 = await call('bob', `/api/requests/${rId}/approve`, 'POST', { role: 'finance-approver' });
 assert.equal(rApprove1.status, 200);
 assert.equal(rApprove1.body.status, 'PENDING_QUORUM');

 // Duplicate approval by same checker blocked
 const rDupApprove = await call('bob', `/api/requests/${rId}/approve`, 'POST', { role: 'department-approver' });
 assert.equal(rDupApprove.status, 409);
 assert.equal(rDupApprove.body.error, 'Dual-Control Violation: One identity cannot approve twice in a quorum.');

 // Checker 2 approves -> quorum reached -> transitions to EXECUTED
 const rApprove2 = await call('carol', `/api/requests/${rId}/approve`, 'POST', { role: 'department-approver' });
 assert.equal(rApprove2.status, 200);
 assert.equal(rApprove2.body.status, 'EXECUTED');
 assert.ok(rApprove2.body.execution.executionReference);

 // Rejection test on production firewall change
 const rFirewall = await call('alice', '/api/requests', 'POST', {
   title: 'Production Firewall / IAM Policy Change',
   category: 'Production Firewall / IAM Policy Change',
   payload: { port: 22, cidr: '0.0.0.0/0' },
 });
 assert.equal(rFirewall.status, 201);
 const rFwId = rFirewall.body.id;

 const rReject = await call('bob', `/api/requests/${rFwId}/reject`, 'POST', { reason: 'Public SSH access prohibited by policy' });
 assert.equal(rReject.status, 200);
 assert.equal(rReject.body.status, 'REJECTED');

 // Verify tamper-evident audit log
 const auditRes = await call('frank', '/api/requests/audit');
 assert.equal(auditRes.status, 200);
 assert.equal(auditRes.body.integrity.tamperEvident, true);
 assert.ok(auditRes.body.auditLogs.length >= 6);
 }finally{server.close();await once(server,'close');}
});
