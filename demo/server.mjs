import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExpenseDesk, RuleError } from '../core/engine.mjs';
import { RequestDesk, DualControlError } from '../core/requests-engine.mjs';

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

export function createServer(store = new ExpenseDesk(), reqStore = new RequestDesk()) {
  return http.createServer(async (req, res) => {
    const finish = (status, data) => {
      res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(JSON.stringify(data));
    };

    try {
      const url = new URL(req.url, 'http://localhost');

      // Static assets
      if (url.pathname === '/' || url.pathname === '/styles.css' || url.pathname === '/app.js') {
        const p = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const mime = p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : 'text/html';
        res.writeHead(200, { 'content-type': `${mime}; charset=utf-8`, 'cache-control': 'no-store' });
        return res.end(await fs.readFile(path.join(base, p)));
      }

      if (!url.pathname.startsWith('/api/')) return finish(404, { error: 'Not found' });

      const p = USERS[String(req.headers['x-demo-user'] || '')];
      if (!p) return finish(401, { error: 'Demo: select a test identity (x-demo-user). NO REAL AUTH.' });

      const readBody = async () => {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 10000) throw new RuleError('Request too large', 413);
        }
        try {
          return raw ? JSON.parse(raw) : {};
        } catch {
          throw new RuleError('Invalid JSON', 400);
        }
      };

      // Expense APIs
      if (req.method === 'GET' && url.pathname === '/api/expenses') return finish(200, store.all(p));
      if (req.method === 'GET' && url.pathname === '/api/audit') return finish(200, store.audit(p));
      if (req.method === 'GET' && url.pathname === '/api/whoami') return finish(200, p);
      if (req.method === 'POST' && url.pathname === '/api/expenses') return finish(201, store.create(p, await readBody()));
      if (req.method === 'POST' && url.pathname === '/api/admin/roles') {
        return finish(403, {
          error: 'Role changes ONLY through TideCloak IGA; demo has no role mutation endpoint.',
          breachImmunity: true,
        });
      }

      const matchExp = url.pathname.match(/^\/api\/expenses\/(EXP-\d+)\/(approve|reject|execute)$/);
      if (matchExp && req.method === 'POST') {
        const body = await readBody();
        if (matchExp[2] === 'approve') return finish(200, store.approve(p, matchExp[1], body.role));
        if (matchExp[2] === 'reject') return finish(200, store.reject(p, matchExp[1], body.role, body.reason));
        return finish(200, store.execute(p, matchExp[1]));
      }

      // Sensitive Requests APIs (Policy-Governed Signing Workflow)
      if (req.method === 'GET' && url.pathname === '/api/requests') return finish(200, reqStore.all(p));
      if (req.method === 'GET' && url.pathname === '/api/requests/audit') {
        const integrity = reqStore.verifyAuditIntegrity();
        return finish(200, {
          auditLogs: reqStore.audit(p),
          integrity: {
            tamperEvident: integrity.valid,
            chainIntegrity: integrity.valid ? 'VERIFIED_CRYPTOGRAPHIC_CHAIN' : 'COMPROMISED',
            totalEntries: integrity.totalEntries,
            hashingAlgorithm: 'SHA-256 Chained Blocks',
          },
        });
      }
      if (req.method === 'POST' && url.pathname === '/api/requests') {
        return finish(201, reqStore.create(p, await readBody()));
      }

      const matchReq = url.pathname.match(/^\/api\/requests\/(REQ-\d+)\/(approve|reject|execute)$/);
      if (matchReq && req.method === 'POST') {
        const body = await readBody();
        if (matchReq[2] === 'approve') return finish(200, reqStore.approve(p, matchReq[1], body));
        if (matchReq[2] === 'reject') return finish(200, reqStore.reject(p, matchReq[1], body.reason));
        return finish(200, reqStore.execute(p, matchReq[1]));
      }

      return finish(404, { error: 'Not found' });
    } catch (e) {
      if (e instanceof RuleError || e instanceof DualControlError) {
        return finish(e.status, { error: e.message, code: e.code });
      }
      console.error(e);
      return finish(500, { error: 'Server error' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  createServer().listen(port, '127.0.0.1', () =>
    console.log(`OFFLINE SIMULATOR (NO TIDE): http://localhost:${port}`)
  );
}
