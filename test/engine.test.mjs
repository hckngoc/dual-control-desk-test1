import test from 'node:test';
import assert from 'node:assert/strict';
import { ExpenseDesk, RuleError } from '../core/engine.mjs';
const requester={id:'alice',roles:['requester']};
const finance={id:'bob',roles:['finance-approver']};
const dept={id:'carol',roles:['department-approver']};
const executor={id:'frank',roles:['treasury-executor']};
const both={id:'dave',roles:['finance-approver','department-approver']};
const self={id:'alice',roles:['requester','finance-approver']};
const otherRequester={id:'zoe',roles:['requester']};
const bad=fn=>assert.throws(fn,RuleError);
test('large expense requires two different roles',()=>{const d=new ExpenseDesk();const e=d.create(requester,{title:'Data center',amount:12000});assert.equal(e.required.length,2);d.approve(finance,e.id,'finance-approver');assert.equal(e.status,'PENDING');d.approve(dept,e.id,'department-approver');assert.equal(e.status,'APPROVED');});
test('low value requires finance only',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Keyboard',amount:99.99});d.approve(finance,e.id,'finance-approver');assert.equal(e.status,'APPROVED');});
test('valid decimal prices are accepted',()=>{const d=new ExpenseDesk();assert.equal(d.create(requester,{title:'Printed cards',amount:0.29}).amountCents,29);});
test('boundary 10000 requires dual control',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Legal services',amount:10000});assert.equal(e.required.length,2);});
test('no self approval',()=>{const d=new ExpenseDesk(),e=d.create(self,{title:'Legitimate expense',amount:100});bad(()=>d.approve(self,e.id,'finance-approver'));});
test('same user cannot satisfy both roles',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Servers',amount:23000});d.approve(both,e.id,'finance-approver');bad(()=>d.approve(both,e.id,'department-approver'));assert.equal(e.status,'PENDING');});
test('no duplicate role approval',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Servers',amount:23000});d.approve(finance,e.id,'finance-approver');bad(()=>d.approve({id:'other',roles:['finance-approver']},e.id,'finance-approver'));});
test('no execution without all approvals',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Servers',amount:23000});bad(()=>d.execute(executor,e.id));d.approve(finance,e.id,'finance-approver');bad(()=>d.execute(executor,e.id));});
test('mock execution with three distinct people',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Servers',amount:23000});d.approve(finance,e.id,'finance-approver');d.approve(dept,e.id,'department-approver');assert.equal(d.execute(executor,e.id).status,'SETTLED_MOCK');assert.equal(d.events[0].type,'MOCK_SETTLEMENT');});
test('one time only execute',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Services',amount:200});d.approve(finance,e.id,'finance-approver');d.execute(executor,e.id);bad(()=>d.execute(executor,e.id));});
test('no unauthorized requester',()=>{const d=new ExpenseDesk();bad(()=>d.create(finance,{title:'Servers',amount:20000}));});
test('no unauthorized approver',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Services',amount:200});bad(()=>d.approve(otherRequester,e.id,'finance-approver'));});
test('no unauthorized executor',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Services',amount:200});d.approve(finance,e.id,'finance-approver');bad(()=>d.execute(finance,e.id));});
test('invalid amounts blocked',()=>{const d=new ExpenseDesk();for(const amount of [0,1e-10,-1,NaN,'abc',1.001,1000001]) bad(()=>d.create(requester,{title:'Invalid amount',amount}));});
test('unknown expense returns 404',()=>{const d=new ExpenseDesk();assert.throws(()=>d.approve(finance,'EXP-9999','finance-approver'),e=>e.status===404);});
test('no app role mutation',()=>{const d=new ExpenseDesk();bad(()=>d.attemptRoleChange({id:'erin',roles:['realm-admin']}));});
test('audit trail records steps',()=>{const d=new ExpenseDesk(),e=d.create(requester,{title:'Services',amount:200});d.approve(finance,e.id,'finance-approver');assert.deepEqual(d.audit(requester).map(x=>x.type),['APPROVED_BY_ROLE','APPROVAL_ATTEMPT','CREATED']);});

test('strict input types reject coercion without creating expenses',()=>{
 const d=new ExpenseDesk();
 for(const data of [null,[],true,'request',{}, {title:123,amount:10}, {title:['abc'],amount:10},
   ...[true,'12.00',[12],{},null,Infinity].map(amount=>({title:'Invalid types',amount}))]) {
   assert.throws(()=>d.create(requester,data),e=>e.status===400);
 }
 assert.equal(d.all(requester).length,0);
 assert.ok(d.audit(requester).every(e=>e.type==='ACTION_REJECTED'));
 assert.equal(d.create(requester,{title:'Valid after failures',amount:0.01}).id,'EXP-0001');
});
test('rejected approval is audited and leaves state unchanged',()=>{
 const d=new ExpenseDesk(),e=d.create(self,{title:'Self approval',amount:12000});
 const before=structuredClone(e);
 assert.throws(()=>d.approve(self,e.id,'finance-approver'),e=>e.status===403);
 assert.deepEqual(e,before);
 assert.deepEqual(d.audit(self).slice(0,2).map(e=>e.type),['ACTION_REJECTED','APPROVAL_ATTEMPT']);
 assert.throws(()=>d.approve(finance,e.id,null),e=>e.status===400);
});
test('executor must be separate even when holding treasury role',()=>{
 const d=new ExpenseDesk(),e=d.create(requester,{title:'Services',amount:100});
 d.approve(finance,e.id,'finance-approver');
 for(const id of ['alice','bob']) assert.throws(()=>d.execute({id,roles:['treasury-executor']},e.id),e=>e.status===403);
 assert.equal(e.status,'APPROVED');
 d.execute(executor,e.id);
 assert.throws(()=>d.execute(executor,e.id),e=>e.status===409);
});
