'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTideCloak } from '@tidecloak/nextjs';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Layers,
  Terminal,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SecurityMetrics } from '@/components/SecurityMetrics';
import { ArchitectureInfo } from '@/components/ArchitectureInfo';
import { ExpenseCard, type Expense } from '@/components/ExpenseCard';
import { RequestCard } from '@/components/RequestCard';
import { CreateExpenseModal } from '@/components/CreateExpenseModal';
import { RejectModal } from '@/components/RejectModal';
import { AuditFeed, type AuditEvent } from '@/components/AuditFeed';
import type { SensitiveRequest } from '@/lib/requests/types';

export default function ExpenseDeskPage() {
  const { authenticated, login, logout, secureFetch, getValueFromIdToken, isInitializing } =
    useTideCloak();

  // Mode View: Policy-Governed Requests vs Expenses
  const [activeWorkflow, setActiveWorkflow] = useState<'REQUESTS' | 'EXPENSES'>('REQUESTS');

  // Active Role Viewpoint for testing Maker / Checker / Auditor
  const [activeRoleView, setActiveRoleView] = useState<'maker' | 'checker' | 'auditor'>('maker');

  // State for Sensitive Requests (/api/requests)
  const [requests, setRequests] = useState<SensitiveRequest[]>([]);
  const [chainIntegrity, setChainIntegrity] = useState<any>(null);

  // State for Expenses (/api/expenses)
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  // User State
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userSub, setUserSub] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Effective roles for UI gating based on active viewpoint
  const effectiveRoles = useMemo(() => {
    if (activeRoleView === 'auditor') return ['auditor'];
    if (activeRoleView === 'checker') {
      return ['checker', 'finance-approver', 'department-approver', 'security-admin', 'infrastructure-lead'];
    }
    return ['maker', 'requester'];
  }, [activeRoleView]);

  // Filtering & Search
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SETTLED' | 'REJECTED'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectExpenseTarget, setRejectExpenseTarget] = useState<{ expense: Expense; role: string } | null>(
    null
  );
  const [rejectRequestTarget, setRejectRequestTarget] = useState<SensitiveRequest | null>(null);

  // Notifications & Telemetry
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [attackResult, setAttackResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  // Secure API caller with error parsing
  async function requestApi(path: string, init: RequestInit = {}) {
    const origin = window.location.origin;
    const response = await secureFetch(`${origin}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-role-view': activeRoleView,
        ...(init.headers || {}),
      },
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || `HTTP ${response.status} Request Failed`);
    }
    return json;
  }

  // Refresh all state
  async function refresh() {
    try {
      const [reqData, auditData, whoData, expData] = await Promise.all([
        requestApi('/api/requests').catch(() => []),
        requestApi('/api/requests/audit').catch(() => ({ auditLogs: [], integrity: {} })),
        requestApi('/api/whoami').catch(() => null),
        requestApi('/api/expenses').catch(() => []),
      ]);

      setRequests(reqData);
      setExpenses(expData);

      if (auditData.auditLogs && auditData.auditLogs.length > 0) {
        setEvents(auditData.auditLogs);
        setChainIntegrity(auditData.integrity);
      } else {
        const fallbackAudit = await requestApi('/api/audit').catch(() => []);
        setEvents(fallbackAudit);
      }

      if (whoData) {
        setUserRoles(whoData.roles || []);
        setUserSub(whoData.sub || '');
        setUserName(whoData.username || '');
      } else {
        const tokenSub = String(getValueFromIdToken('sub') || '');
        const tokenUser = String(getValueFromIdToken('preferred_username') || tokenSub);
        setUserSub(tokenSub);
        setUserName(tokenUser);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch desk telemetry',
      });
    }
  }

  useEffect(() => {
    if (authenticated) {
      void refresh();
    }
  }, [authenticated]);

  // Toast auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Create Request
  const handleCreate = async (data: {
    title: string;
    amount: number;
    category: string;
    vendor: string;
    justification: string;
    payload?: Record<string, any>;
  }) => {
    setBusy(true);
    try {
      // Create sensitive request via /api/requests
      const created = await requestApi('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          category: data.category,
          payload: data.payload || { amount: data.amount, recipient: data.vendor, justification: data.justification },
        }),
      });

      // Also submit to expenses if treasury
      if (data.amount > 0) {
        await requestApi('/api/expenses', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            amount: data.amount,
            category: data.category,
            vendor: data.vendor,
            justification: data.justification,
          }),
        }).catch(() => null);
      }

      setCreateModalOpen(false);
      setNotification({
        type: 'success',
        message: `Request ${created.id} initiated! Status: PENDING_QUORUM. Quorum: ${created.requiredQuorum} checker(s).`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Request creation failed',
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle Approve Request (/api/requests/[id]/approve)
  const handleApproveRequest = async (id: string, role?: string) => {
    setBusy(true);
    try {
      const updated = await requestApi(`/api/requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      setNotification({
        type: 'success',
        message: `Approved ${id}! Status transitioned to ${updated.status}. Quorum: ${updated.approvals.length}/${updated.requiredQuorum}.`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Approval failed',
      });
      // Increment blocked count on violation
      if (err instanceof Error && err.message.includes('Dual-Control Violation')) {
        setBlockedCount((prev) => prev + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  // Handle Reject Request (/api/requests/[id]/reject)
  const handleRejectRequest = async (id: string, reason: string) => {
    setBusy(true);
    try {
      const updated = await requestApi(`/api/requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      setRejectModalOpen(false);
      setRejectRequestTarget(null);
      setNotification({
        type: 'info',
        message: `Request ${id} formally REJECTED and appended to tamper-evident audit log.`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Rejection failed',
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle Execute Request (/api/requests/[id]/execute)
  const handleExecuteRequest = async (id: string) => {
    setBusy(true);
    try {
      const updated = await requestApi(`/api/requests/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      setNotification({
        type: 'success',
        message: `Executed ${id}! Settlement Reference: ${updated.execution?.executionReference}`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      setBusy(false);
    }
  };

  // Legacy Expense Handlers for complete backward compatibility
  const handleApproveExpense = async (id: string, role: string) => {
    setBusy(true);
    try {
      const updated = await requestApi(`/api/expenses/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      setNotification({
        type: 'success',
        message: `Recorded signature for ${id}. Status: ${updated.status}`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Approval failed',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExecuteExpense = async (id: string) => {
    setBusy(true);
    try {
      const updated = await requestApi(`/api/expenses/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setNotification({
        type: 'success',
        message: `Settled ${id}. Ref: ${updated.settlementReference}`,
      });
      await refresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      setBusy(false);
    }
  };

  // Simulate Privilege Escalation Attack
  const handleSimulateAttack = async () => {
    setBusy(true);
    setAttackResult(null);
    try {
      const origin = window.location.origin;
      const res = await secureFetch(`${origin}/api/admin/roles`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: userSub, role: 'finance-approver' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAttackResult(`HTTP ${res.status} BLOCKED: ${data.error}`);
        setBlockedCount((prev) => prev + 1);
        await refresh();
      }
    } catch (err) {
      setAttackResult(
        `BLOCKED: ${err instanceof Error ? err.message : 'Privilege escalation rejected by server'}`
      );
      setBlockedCount((prev) => prev + 1);
    } finally {
      setBusy(false);
    }
  };

  // Filtered lists
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterTab === 'PENDING' && r.status !== 'PENDING_QUORUM') return false;
      if (filterTab === 'APPROVED' && r.status !== 'APPROVED') return false;
      if (filterTab === 'SETTLED' && r.status !== 'EXECUTED') return false;
      if (filterTab === 'REJECTED' && r.status !== 'REJECTED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.makerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, filterTab, searchQuery]);

  // Unauthenticated Hero
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-cyber">
        <Navbar
          authenticated={false}
          username=""
          sub=""
          roles={[]}
          activeRoleView={activeRoleView}
          onRoleViewChange={setActiveRoleView}
          onLogin={login}
          onLogout={logout}
        />

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-3xl w-full text-center space-y-8 py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>RMIT HACKATHON 2026 · GROUP: RMIT_SGS_N3T_C2</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
                Dual Control Desk
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Policy-Governed Signing & Dual-Control Maker-Checker Engine powered by{' '}
                <span className="text-teal-300 font-semibold">TideCloak MultiAdmin Fabric</span>,{' '}
                <span className="text-emerald-300 font-semibold">RFC 9449 DPoP</span>, and decentralized quorum consensus.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" /> Policy-Governed Signing
                </div>
                <p className="text-xs text-slate-400">
                  Treasury transfers &gt;$10k, production firewall updates, and emergency HSM key rotations mandate strict dual-control quorum.
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Key className="w-4 h-4" /> Sender-Constrained DPoP
                </div>
                <p className="text-xs text-slate-400">
                  Ephemerally binds every request to the client key thumbprint, preventing token replay attacks.
                </p>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Lock className="w-4 h-4" /> Separation of Duties
                </div>
                <p className="text-xs text-slate-400">
                  Makers can never self-approve. Enclave MultiAdmin consensus blocks unilateral admin escalation.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={login}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with TideCloak</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-cyber">
      <Navbar
        authenticated={true}
        username={userName}
        sub={userSub}
        roles={userRoles}
        activeRoleView={activeRoleView}
        onRoleViewChange={setActiveRoleView}
        onLogin={login}
        onLogout={logout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auditor Compliance Banner */}
        {activeRoleView === 'auditor' && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Auditor Compliance Mode Active</strong>: You have read-only access to operational requests, blast-radius metrics, and cryptographic audit logs. Initiating and approving requests is restricted.
              </span>
            </div>
            <button
              onClick={() => setActiveRoleView('maker')}
              className="text-indigo-400 hover:text-white underline text-[11px] font-mono shrink-0"
            >
              Switch to Maker View →
            </button>
          </div>
        )}

        {/* Toast */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center justify-between border transition animate-in fade-in slide-in-from-top-4 ${
              notification.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-teal-950/40 border-teal-500/40 text-teal-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : notification.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              [close]
            </button>
          </div>
        )}

        {/* Security Architecture & Threat Attack Simulation */}
        <ArchitectureInfo
          onSimulateAttack={handleSimulateAttack}
          attackResult={attackResult}
          busy={busy}
        />

        {/* Live Metrics */}
        <SecurityMetrics
          expenses={
            requests.map((r) => ({
              id: r.id,
              amountCents: Number(r.payload?.amount || 0) * 100,
              status: r.status === 'PENDING_QUORUM' ? 'PENDING' : r.status === 'EXECUTED' ? 'SETTLED_MOCK' : r.status,
            }))
          }
          blockedCount={blockedCount}
        />

        {/* Workflow Switcher & Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveWorkflow('REQUESTS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeWorkflow === 'REQUESTS'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Policy-Governed Requests (Raziel MCP)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-950/60 font-mono">
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveWorkflow('EXPENSES')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeWorkflow === 'EXPENSES'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Expense Desk</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-950/60 font-mono">
                {expenses.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {chainIntegrity && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>SHA-256 Audit Chain Verified</span>
              </span>
            )}

            <button
              onClick={() => void refresh()}
              disabled={busy}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {activeRoleView === 'auditor' ? (
              <span
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 cursor-not-allowed"
                title="Auditors have read-only access to audit logs and metrics"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auditor (Read-Only)</span>
              </span>
            ) : (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'ALL' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending Quorum
            </button>
            <button
              onClick={() => setFilterTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'APPROVED' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterTab('SETTLED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'SETTLED' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Executed
            </button>
            <button
              onClick={() => setFilterTab('REJECTED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'REJECTED' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, or category..."
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="mb-10">
          {activeWorkflow === 'REQUESTS' ? (
            filteredRequests.length === 0 ? (
              <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto text-slate-600 mb-3 border border-slate-800">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">No Policy-Governed Requests Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Initiate a Treasury Wire Transfer (&gt;$10k), Production Firewall change, or Emergency HSM Key Rotation.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Initiate First Request</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    currentUserId={userSub}
                    currentUserRoles={userRoles}
                    busy={busy}
                    onApprove={handleApproveRequest}
                    onReject={(r) => {
                      setRejectRequestTarget(r);
                      setRejectModalOpen(true);
                    }}
                    onExecute={handleExecuteRequest}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {expenses.map((exp) => (
                <ExpenseCard
                  key={exp.id}
                  expense={exp}
                  currentUserId={userSub}
                  currentUserRoles={userRoles}
                  busy={busy}
                  onApprove={handleApproveExpense}
                  onReject={(e, role) => {
                    setRejectExpenseTarget({ expense: e, role });
                    setRejectModalOpen(true);
                  }}
                  onExecute={handleExecuteExpense}
                />
              ))}
            </div>
          )}
        </div>

        {/* Security Audit Telemetry Feed */}
        <AuditFeed events={events} />

        {/* Modals */}
        <CreateExpenseModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreate}
          busy={busy}
        />

        <RejectModal
          isOpen={rejectModalOpen}
          expense={
            rejectRequestTarget
              ? {
                  id: rejectRequestTarget.id,
                  title: rejectRequestTarget.title,
                  amountCents: Number(rejectRequestTarget.payload?.amount || 0) * 100,
                  status: rejectRequestTarget.status === 'PENDING_QUORUM' ? 'PENDING' : 'APPROVED',
                  required: rejectRequestTarget.requiredRoles,
                  submittedByName: rejectRequestTarget.makerName,
                  submittedBy: rejectRequestTarget.makerId,
                  createdAt: rejectRequestTarget.createdAt,
                  approvals: [],
                  settlementReference: null,
                }
              : rejectExpenseTarget?.expense || null
          }
          role={rejectExpenseTarget?.role || 'checker'}
          onClose={() => {
            setRejectModalOpen(false);
            setRejectExpenseTarget(null);
            setRejectRequestTarget(null);
          }}
          onConfirm={async (id, role, reason) => {
            if (rejectRequestTarget) {
              await handleRejectRequest(id, reason);
            } else {
              // Expense reject
              await requestApi(`/api/expenses/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ role, reason }),
              });
              setRejectModalOpen(false);
              await refresh();
            }
          }}
          busy={busy}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Dual Control Desk</span>
            <span>·</span>
            <span>RMIT Hackathon 2026 (Group: RMIT_SGS_N3T_C2)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>TideCloak MultiAdmin IGA</span>
            <span>·</span>
            <span>RFC 9449 DPoP Sender Binding</span>
            <span>·</span>
            <span>Policy-Governed Signing Enclave</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
