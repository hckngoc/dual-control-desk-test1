import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExpenseDesk, RuleError } from '../core/engine.mjs';

// Deliberately insecure demonstration identities: NEVER DEPLOY THIS SERVER.
export const USERS = {
  alice: { id:'alice',name:'Alice — Requester',roles:['requester'] },
  bob: { id:'bob',name:'Bob — Finance',roles:['finance-approver'] },
  carol: { id:'carol',name:'Carol — Department',roles:['department-approver'] },
  dave: { id:'dave',name:'Dave — Both Roles',roles:['finance-approver','department-approver'] },
  erin: { id:'erin',name:'Erin — Admin',roles:['realm-admin'] },
  frank: { id:'frank',name:'Frank — Treasury',roles:['treasury-executor'] },
  grace: { id:'grace',name:'Grace — Requester + Finance',roles:['requester','finance-approver'] },
};
const base = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
export function createServer(store = new ExpenseDesk()) {
  return http.createServer(async (req,res) => {
    const finish = (status,data) => { res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
    try {
      const url = new URL(req.url,'http://localhost');
      if (url.pathname === '/' || url.pathname === '/styles.css' || url.pathname === '/app.js') {
        const p = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const mime = p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : 'text/html';
        res.writeHead(200,{'content-type':`${mime}; charset=utf-8`,'cache-control':'no-store'});
        return res.end(await fs.readFile(path.join(base,p)));
      }
      if (!url.pathname.startsWith('/api/')) return finish(404,{error:'Not found'});
      const p = USERS[String(req.headers['x-demo-user']||'')];
      if (!p) return finish(401,{error:'Demo: select a test identity (x-demo-user). NO REAL AUTH.'});
      const readBody = async () => {
        let raw=''; for await(const chunk of req) { raw += chunk; if(raw.length>10000) throw new RuleError('Request too large',413); }
        try{return raw ? JSON.parse(raw) : {}}catch{throw new RuleError('Invalid JSON',400)}
      };
      if (req.method==='GET' && url.pathname==='/api/expenses') return finish(200,store.all(p));
      if (req.method==='GET' && url.pathname==='/api/audit') return finish(200,store.audit(p));
      if (req.method==='GET' && url.pathname==='/api/whoami') return finish(200,p);
      if (req.method==='POST' && url.pathname==='/api/expenses') return finish(201,store.create(p,await readBody()));
      if (req.method==='POST' && url.pathname==='/api/admin/roles') return finish(403,{error:'Role changes ONLY through TideCloak IGA; demo has no role mutation endpoint.'});
      const match=url.pathname.match(/^\/api\/expenses\/(EXP-\d+)\/(approve|execute)$/);
      if(match && req.method==='POST') {
        if(match[2]==='approve') return finish(200,store.approve(p,match[1],(await readBody()).role));
        return finish(200,store.execute(p,match[1]));
      }
      return finish(404,{error:'Not found'});
    } catch(e) { if(e instanceof RuleError) return finish(e.status,{error:e.message}); console.error(e); return finish(500,{error:'Server error'}); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const port = Number(process.env.PORT || 4173);
 createServer().listen(port,'127.0.0.1',()=>console.log(`OFFLINE SIMULATOR (NO TIDE): http://localhost:${port}`));
}
