'use client';
import { useEffect, useRef, useState } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import './expense.css';

type Approval = {role:string;userId:string;name:string};
type Expense = {id:string;title:string;amountCents:number;status:string;required:string[];submittedBy:string;submittedByName:string;approvals:Approval[];settlementReference:string|null};
type Audit = {at:string;type:string;by:string;expenseId:string|null;detail:string};
type Identity = {id:string;name:string;roles:string[]};
const usd = (cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const roleLabel = (role:string)=>role==='finance-approver'?'Finance':'Department';

export default function ExpenseDeskPage() {
  const {authenticated,login,logout,secureFetch,token} = useTideCloak();
  const session = useRef(token);
  session.current = token;
  const [identity,setIdentity] = useState<Identity|null>(null);
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [events,setEvents] = useState<Audit[]>([]);
  const [title,setTitle] = useState('Cloud hosting renewal');
  const [amount,setAmount] = useState('12000');
  const [message,setMessage] = useState('');
  const [isError,setIsError] = useState(false);
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(false);
  async function request(path:string,init:RequestInit={}) {
    const response = await secureFetch(new URL(path,window.location.origin).href,{
      ...init,headers:{'content-type':'application/json',...init.headers},cache:'no-store'
    });
    const json=await response.json();
    if(!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
    return json;
  }
  async function refresh() {
    const currentToken=token;
    setLoading(true);
    try {
      const [e,a,who]=await Promise.all([request('/api/expenses'),request('/api/audit'),request('/api/whoami')]);
      if(session.current===currentToken){setExpenses(e);setEvents(a);setIdentity(who);}
    } finally {if(session.current===currentToken)setLoading(false);}
  }
  function report(error:unknown) {setIsError(true);setMessage(error instanceof Error?error.message:'Request failed');}
  useEffect(()=>{
    setIdentity(null);setExpenses([]);setEvents([]);setMessage('');
    if(authenticated&&token) void refresh().catch(report);
  },[authenticated,token]);
  async function mutate(path:string,body:unknown={}) {
    setBusy(true);setMessage('');
    try {
      const result=await request(path,{method:'POST',body:JSON.stringify(body)});
      setIsError(false);setMessage(`${result.id}: ${result.status.replaceAll('_',' ')}`);
    } catch(error) {report(error);}
    finally {
      // Rejected business actions also create audit events.
      await refresh().catch(report);
      setBusy(false);
    }
  }
  function blocked(e:Expense,role:string) {
    if(!identity?.roles.includes(role)) return `Requires ${role}`;
    if(e.submittedBy===identity.id) return 'Requester cannot approve their own expense';
    if(e.approvals.some(a=>a.userId===identity.id)) return 'An independent second identity is required';
    return '';
  }
  function settlementBlocked(e:Expense) {
    if(!identity?.roles.includes('treasury-executor')) return 'Requires treasury-executor';
    if(e.submittedBy===identity.id||e.approvals.some(a=>a.userId===identity.id)) return 'Executor must be separate from requester and approvers';
    return '';
  }
  if(!authenticated) return <main className="expense-app"><section className="expense-panel"><small>RMIT HACKATHON 2026 · RMIT_SGS_N3T_C2</small><h1>Dual-Control Expense Desk</h1><p>Independent approvals for important spending. Sign in with your real TideCloak identity to submit, review or mock settle expenses.</p><p>This prototype records mock settlements only. No real money moves.</p>{message&&<p role="alert">{message}</p>}<button onClick={()=>void login().catch(report)}>Sign in with TideCloak</button></section></main>;
  const disabled=busy||loading;
  return <main className="expense-app" aria-busy={disabled}>
    <header className="expense-banner"><div><small>RMIT_SGS_N3T_C2 · TIDECLOAK SESSION</small><h1>Dual-Control Expense Desk</h1><p>Distinct approvers, server-verified roles, mock settlement.</p></div><div className="expense-auth"><span>Logged in: <strong>{identity?.name||'Loading identity…'}</strong></span><span className="expense-roles">Roles: {identity?.roles.join(', ')||'No expense roles'}</span><button disabled={busy} onClick={()=>void logout().catch(report)}>Log out</button></div></header>
    <aside className="expense-note">Role changes belong in TideCloak IGA. MultiAdmin protection requires a separately verified governance threshold. Expense approvals are application rules; settlement is a mock. Records and audit events are held in this server process and are lost on restart.</aside>
    {message&&<p role={isError?'alert':'status'} className={`expense-message ${isError?'expense-error':''}`}>{message}</p>}
    {loading&&<p role="status">Loading expenses, verified identity and audit trail…</p>}
    <div className="expense-columns">
      <section className="expense-panel"><h2>Submit expense</h2><form onSubmit={event=>{event.preventDefault();void mutate('/api/expenses',{title,amount:Number(amount)});}}>
        <label htmlFor="purpose">Business purpose<input id="purpose" value={title} onChange={e=>setTitle(e.target.value)} required minLength={3} maxLength={120} disabled={disabled}/></label>
        <label htmlFor="amount">Amount (USD)<input id="amount" type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="0.01" max="1000000" step="0.01" required disabled={disabled} aria-describedby="approval-policy"/></label>
        <p id="approval-policy">$10,000 and above requires Finance + Department approval by separate people. Below $10,000 requires Finance.</p>
        {!identity?.roles.includes('requester')&&<p>Creating expenses requires the requester role.</p>}
        <button disabled={disabled||!identity?.roles.includes('requester')} type="submit">{busy?'Working…':'Create request'}</button>
      </form></section>
      <section className="expense-panel"><h2>Business enforcement</h2><ul><li>Requesters cannot approve their own expenses</li><li>Finance and Department use different Tide subjects</li><li>The treasury executor is separate from requester and approvers</li><li>Every protected API verifies the access token and DPoP proof</li></ul><button disabled={disabled} onClick={()=>void refresh().catch(report)}>Refresh records</button><p><a href="/dashboard">Starter customer API example</a></p></section>
    </div>
    <section className="expense-panel"><h2>Expenses ({expenses.length})</h2>
      {!loading&&!expenses.length&&<p>No expenses yet. A requester can create the first request.</p>}
      {expenses.map(e=><article className="expense-item" key={e.id}>
        <div><strong>{e.title}</strong><p><span className={`expense-status expense-status-${e.status.toLowerCase()}`}>{e.status.replaceAll('_',' ')}</span> <small>{e.id} · {e.submittedByName}</small></p>
          <p>{usd(e.amountCents)} · {e.approvals.length}/{e.required.length} approvals</p>
          <ul className="expense-progress">{e.required.map(role=>{const approval=e.approvals.find(a=>a.role===role);return <li key={role}>{roleLabel(role)}: {approval?`Approved by ${approval.name}`:'Awaiting independent approval'}</li>;})}</ul>
          {e.settlementReference&&<small>{e.settlementReference} · No real transfer executed</small>}
        </div>
        <div className="expense-actions">
          {e.status==='PENDING'&&e.required.filter(role=>!e.approvals.some(a=>a.role===role)).map(role=>{const reason=blocked(e,role);return <div key={role}><button disabled={disabled||!!reason} title={reason||`Approve as ${roleLabel(role)}`} onClick={()=>void mutate(`/api/expenses/${e.id}/approve`,{role})}>Approve: {roleLabel(role)}</button>{reason&&<small className="expense-action-reason">{reason}</small>}</div>;})}
          {e.status==='APPROVED'&&<div><button disabled={disabled||!!settlementBlocked(e)} onClick={()=>void mutate(`/api/expenses/${e.id}/execute`)}>Mock settle</button>{settlementBlocked(e)&&<small className="expense-action-reason">{settlementBlocked(e)}</small>}</div>}
        </div>
      </article>)}
    </section>
    <section className="expense-panel"><h2>Audit trail</h2>{!loading&&!events.length&&<p>No events recorded yet.</p>}
      {events.map((event,index)=><div className="expense-event" key={index}><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time> · <strong>{event.type}</strong> · {event.by} · {event.expenseId||'—'} · {event.detail}</div>)}
    </section>
    <footer>RMIT Hackathon 2026 — Challenge 2 · Mock settlements only</footer>
  </main>;
}
