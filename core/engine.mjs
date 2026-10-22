/**
 * Demo business rules. TideCloak verifies identity and governance OUTSIDE this module.
 * This module is NOT cryptographic approval and does NOT move real money.
 */
export const THRESHOLD_CENTS = 1_000_000; // USD 10,000.00
export const ROLE_REQUESTER = 'requester';
export const ROLE_FINANCE = 'finance-approver';
export const ROLE_DEPARTMENT = 'department-approver';
export const ROLE_TREASURY = 'treasury-executor';

export class RuleError extends Error {
  constructor(message, status = 403) { super(message); this.name = 'RuleError'; this.status = status; }
}

const clean = (x) => String(x ?? '').trim();
export class ExpenseDesk {
  constructor() { this.expenses = []; this.events = []; this.sequence = 0; }
  identity(principal) {
    if (!principal || typeof principal.id !== 'string' || !principal.id.trim()) throw new RuleError('Verified identity required', 401);
    return { id: clean(principal.id), name: clean(principal.name) || clean(principal.id), roles: Array.isArray(principal.roles) ? principal.roles : [] };
  }
  requireRole(principal, role) {
    const p = this.identity(principal);
    if (!p.roles.includes(role)) throw new RuleError(`Role required: ${role}`);
    return p;
  }
  event(type, by, expenseId, detail='') {
    const e = { at: new Date().toISOString(), type, by, expenseId, detail };
    this.events.unshift(e);
    return e;
  }
  action(principal, expenseId, action, perform) {
    const p = this.identity(principal);
    if (action === 'APPROVE') this.event('APPROVAL_ATTEMPT', p.id, expenseId);
    try { return perform(p); }
    catch (error) {
      if (error instanceof RuleError) this.event('ACTION_REJECTED', p.id, expenseId, `${action}: ${error.message}`);
      throw error;
    }
  }
  create(principal, data) {
    return this.action(principal, null, 'CREATE', p => {
      this.requireRole(p, ROLE_REQUESTER);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new RuleError('JSON object required', 400);
      if (typeof data.title !== 'string') throw new RuleError('Title must be a string', 400);
      const title = data.title.trim();
      const amount = data.amount;
      if (title.length < 3 || title.length > 120) throw new RuleError('Title must contain 3–120 characters', 400);
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0.01 || amount > 1_000_000 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) {
        throw new RuleError('Amount must be USD 0.01–1,000,000.00 with max two decimals', 400);
      }
      const amountCents = Math.round(amount * 100);
      const expense = {
        id: `EXP-${String(++this.sequence).padStart(4,'0')}`, title, amountCents,
        submittedBy: p.id, submittedByName: p.name,
        createdAt: new Date().toISOString(), status: 'PENDING', approvals: [],
        required: amountCents >= THRESHOLD_CENTS ? [ROLE_FINANCE, ROLE_DEPARTMENT] : [ROLE_FINANCE],
        settlementReference: null,
      };
      this.expenses.unshift(expense);
      this.event('CREATED', p.id, expense.id, `${title}: $${(amountCents / 100).toFixed(2)}`);
      return expense;
    });
  }
  all(principal) { this.identity(principal); return this.expenses; }
  audit(principal) { this.identity(principal); return this.events; }
  one(id) { const e = this.expenses.find(x => x.id === id); if (!e) throw new RuleError('Expense not found', 404); return e; }
  approve(principal, id, role) {
    return this.action(principal, id, 'APPROVE', p => {
      if (![ROLE_FINANCE, ROLE_DEPARTMENT].includes(role)) throw new RuleError('A valid approval role is required', 400);
      this.requireRole(p, role);
      const e = this.one(id);
      if (e.status !== 'PENDING') throw new RuleError('Expense is not pending', 409);
      if (!e.required.includes(role)) throw new RuleError('This approver role is not required', 400);
      if (e.submittedBy === p.id) throw new RuleError('Requester cannot self-approve');
      if (e.approvals.some(a => a.userId === p.id)) throw new RuleError('One identity cannot approve twice', 409);
      if (e.approvals.some(a => a.role === role)) throw new RuleError('This approval category is already complete', 409);
      e.approvals.push({ role, userId: p.id, name: p.name, at: new Date().toISOString() });
      e.status = e.required.every(r => e.approvals.some(a => a.role === r)) ? 'APPROVED' : 'PENDING';
      this.event('APPROVED_BY_ROLE', p.id, id, role);
      return e;
    });
  }
  execute(principal, id) {
    return this.action(principal, id, 'EXECUTE', p => {
      this.requireRole(p, ROLE_TREASURY);
      const e = this.one(id);
      if (e.status !== 'APPROVED') throw new RuleError('All required approvals must be completed first', 409);
      if (e.submittedBy === p.id || e.approvals.some(a => a.userId === p.id)) throw new RuleError('Executor must be separate from requester and approvers');
      // A MOCK SETTLEMENT. No bank or payment API is called.
      e.status = 'SETTLED_MOCK';
      e.settlementReference = `MOCK-${id}`;
      this.event('MOCK_SETTLEMENT', p.id, id, 'No real transfer executed');
      return e;
    });
  }
  attemptRoleChange(principal) {
    const p = this.identity(principal);
    this.event('ROLE_CHANGE_BLOCKED', p.id, null, 'Manage roles in TideCloak IGA; this application has no escalation API');
    throw new RuleError('Role changes must occur through TideCloak IGA, not the expense app');
  }
}
