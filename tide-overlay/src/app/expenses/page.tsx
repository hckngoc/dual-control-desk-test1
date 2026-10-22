'use client';
import { useEffect, useState } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import './expense.css';

type Approval = {role:string;userId:string;name:string};
type Expense = {id:string;title:string;amountCents:number;status:string;required:string[];submittedByName:string;approvals:Approval[];settlementReference:string|null};
type Audit = {at:string;type:string;by:string;expenseId:string|null;detail:string};
const usd = (cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);

export default function ExpenseDeskPage() {
  const {authenticated,login,logout,secureFetch,getValueFromIdToken} = useTideCloak();
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [events,setEvents] = useState<Audit[]>([]);
  const [title,setTitle] = useState('Cloud hosting renewal');
  const [amount,setAmount] = useState('12000');
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function request(path:string,init:RequestInit={}) {
    // Tide's secureFetch generates an ephemeral DPoP proof bound to this URL/method.
    const response = await secureFetch(`${window.location.origin}${path}`,{
      ...init,headers:{'content-type':'application/json',...(init.headers||{})}
    });
    const json=await response.json();
    if(!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
    return json;
  }
  async function refresh(){
    try{const [e,a]=await Promise.all([request('/api/expenses'),request('/api/audit')]);setExpenses(e);setEvents(a);}
    catch(e){setMessage(e instanceof Error ? e.message : 'Could not load');}
  }
  useEffect(()=>{if(authenticated){void refresh();}},[authenticated]); // refreshing after login only
  async function mutate(path:string,body:unknown={}) {
    setBusy(true);setMessage('');
    try{await request(path,{method:'POST',body:JSON.stringify(body)});setMessage('Action completed');await refresh();}
    catch(e){setMessage(e instanceof Error ? e.message : 'Request failed');}
    finally{setBusy(false);}
  }
  if(!authenticated) return <main className="expense-app"><div className="expense-panel"><h1>Dual-Control Expense Desk</h1><p>Real TideCloak sign-in is required. This is not the offline identity simulator.</p><button onClick={()=>login()}>Sign in with TideCloak</button></div></main>;
  return <main className="expense-app">
    <div className="expense-banner"><div><small>TIDE UNLOCKED · TIDECLOAK CONNECTED</small><h1>Dual-Control Expense Desk</h1><p>Distinct approvers, server-verified Tide roles, mock settlement.</p></div><div className="expense-auth">Logged in: <strong>{String(getValueFromIdToken('preferred_username') || 'Tide user')}</strong><button onClick={()=>logout()}>Log out</button></div></div>
    <div className="expense-note">Role grants/revocations are managed only in the TideCloak Admin Console through IGA. This app does not have an admin role-change API. Business approvals and mock settlement are not Tide-signed.</div>
    {message&&<p role="status" className="expense-message">{message}</p>}
    <div className="expense-columns"><section className="expense-panel"><h2>Submit expense</h2><form onSubmit={e=>{e.preventDefault();void mutate('/api/expenses',{title,amount:Number(amount)});}}><label>Purpose<input value={title} onChange={e=>setTitle(e.target.value)} required minLength={3} maxLength={120}/></label><label>Amount (USD)<input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="0.01" max="1000000" step="0.01" required/></label><p>≥ $10,000 requires Finance + Department sign-offs by separate people. Below $10,000 requires Finance.</p><button disabled={busy} type="submit">Create request</button></form></section><section className="expense-panel"><h2>Business enforcement</h2><ul><li>Requester may never self-approve</li><li>Finance and Department must use different Tide identities</li><li>Executor cannot be a requester or approver</li><li>Each mutation checks roles on verified server-side JWT</li></ul><button disabled={busy} onClick={()=>void refresh()}>Refresh</button></section></div>
    <section className="expense-panel"><h2>Expenses ({expenses.length})</h2>{!expenses.length&&<p>No expenses yet. Log in as a user holding requester role to create one.</p>}{expenses.map(e=><div className="expense-item" key={e.id}><div><strong>{e.title}</strong> <small>{e.id} · {e.status} · {e.submittedByName}</small><p>{usd(e.amountCents)} · approvals: {e.approvals.map(a=>a.role+' ('+a.name+')').join(', ')||'none'}</p>{e.settlementReference&&<small>{e.settlementReference}</small>}</div><div className="expense-actions">{e.status==='PENDING'&&e.required.filter(r=>!e.approvals.some(a=>a.role===r)).map(role=><button disabled={busy} key={role} onClick={()=>void mutate(`/api/expenses/${e.id}/approve`,{role})}>Approve: {role==='finance-approver'?'Finance':'Department'}</button>)}{e.status==='APPROVED'&&<button disabled={busy} onClick={()=>void mutate(`/api/expenses/${e.id}/execute`)}>Mock settle</button>}</div></div>)}</section>
    <section className="expense-panel"><h2>Audit events</h2>{events.length===0&&<p>No events yet.</p>}{events.map((a,i)=><div className="expense-event" key={i}><small>{new Date(a.at).toLocaleString()}</small> · <strong>{a.type}</strong> · {a.by} · {a.expenseId} · {a.detail}</div>)}</section>
  </main>;
}
