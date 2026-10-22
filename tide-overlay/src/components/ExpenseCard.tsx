'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  User,
  Building,
  Tag,
  DollarSign,
  Award,
  FileText,
} from 'lucide-react';

export interface Approval {
  role: string;
  userId: string;
  name: string;
  at?: string;
}

export interface Expense {
  id: string;
  title: string;
  amountCents: number;
  category?: string;
  vendor?: string;
  justification?: string;
  status: 'PENDING' | 'APPROVED' | 'SETTLED_MOCK' | 'REJECTED';
  required: string[];
  submittedBy: string;
  submittedByName: string;
  createdAt: string;
  approvals: Approval[];
  settlementReference: string | null;
  rejection?: {
    role: string;
    userId: string;
    name: string;
    reason: string;
    at: string;
  } | null;
}

interface ExpenseCardProps {
  expense: Expense;
  currentUserId: string;
  currentUserRoles: string[];
  busy: boolean;
  onApprove: (id: string, role: string) => Promise<void>;
  onReject: (expense: Expense, role: string) => void;
  onExecute: (id: string) => Promise<void>;
}

export function ExpenseCard({
  expense,
  currentUserId,
  currentUserRoles,
  busy,
  onApprove,
  onReject,
  onExecute,
}: ExpenseCardProps) {
  const isMaker = currentUserId === expense.submittedBy;
  const isHighValue = expense.amountCents >= 1_000_000; // >= $10,000

  const formatUSD = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100);

  // Status badges & styles
  const getStatusBadge = () => {
    switch (expense.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Quorum Pending ({expense.approvals.length}/{expense.required.length})</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quorum Met · Ready to Settle</span>
          </span>
        );
      case 'SETTLED_MOCK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Settled (Mock Treasury)</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected by Checker</span>
          </span>
        );
      default:
        return null;
    }
  };

  const hasAlreadyApproved = expense.approvals.some((a) => a.userId === currentUserId);
  const isMakerOrChecker = isMaker || hasAlreadyApproved;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl border border-slate-800 p-5 transition flex flex-col justify-between">
      <div>
        {/* Top Header: ID, Date, Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-500/30">
              {expense.id}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date(expense.createdAt).toLocaleDateString()} {new Date(expense.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Title & Amount */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-white tracking-tight">{expense.title}</h3>
          <div className="text-xl font-extrabold text-teal-300 font-mono tracking-tight">
            {formatUSD(expense.amountCents)}
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          {expense.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
              <Tag className="w-3 h-3 text-teal-400" />
              <span>{expense.category}</span>
            </span>
          )}
          {expense.vendor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
              <Building className="w-3 h-3 text-indigo-400" />
              <span>{expense.vendor}</span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium text-[11px] ${
              isHighValue
                ? 'bg-amber-950/50 text-amber-300 border border-amber-600/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>{isHighValue ? 'Dual Control (2-of-2 Checkers)' : 'Single Control (Finance Only)'}</span>
          </span>
        </div>

        {/* Maker Information */}
        <div className="glass-card-subtle p-3 rounded-xl border border-slate-800 mb-4 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-teal-300 font-bold text-xs border border-slate-700">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>Maker: {expense.submittedByName}</span>
                {isMaker && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    You
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                sub: {expense.submittedBy}
              </div>
            </div>
          </div>
        </div>

        {/* Quorum Progress Stepper */}
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
            <span>Cryptographic Quorum Status</span>
            <span className="text-[11px] font-mono text-slate-500">
              {expense.approvals.length} / {expense.required.length} Approved
            </span>
          </div>

          <div className="space-y-1.5">
            {expense.required.map((reqRole) => {
              const approval = expense.approvals.find((a) => a.role === reqRole);
              const isApproved = Boolean(approval);
              const label = reqRole === 'finance-approver' ? 'Finance Checker' : 'Department Checker';

              return (
                <div
                  key={reqRole}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs border transition ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : expense.status === 'REJECTED'
                      ? 'bg-slate-900/40 border-slate-800 text-slate-500'
                      : 'bg-amber-950/10 border-amber-500/20 text-amber-200/90'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : expense.status === 'REJECTED' ? (
                      <XCircle className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    )}
                    <span className="font-medium">{label}</span>
                  </div>

                  {isApproved ? (
                    <span className="text-[11px] font-mono text-emerald-300">
                      Signed by {approval?.name}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {expense.status === 'REJECTED' ? 'Blocked' : 'Awaiting sign-off'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection / Settlement Details */}
        {expense.rejection && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 mb-4">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Rejected by {expense.rejection.name} ({expense.rejection.role})</span>
            </div>
            <div className="text-[11px] text-rose-200/80 italic">Reason: "{expense.rejection.reason}"</div>
          </div>
        )}

        {expense.settlementReference && (
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 mb-4">
            <div className="font-semibold flex items-center gap-1.5 mb-0.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mock Settlement Executed</span>
            </div>
            <div className="font-mono text-[11px] text-indigo-200/80">Ref: {expense.settlementReference}</div>
          </div>
        )}
      </div>

      {/* Action Buttons with Strict Separation of Duties Enforcement */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        {expense.status === 'PENDING' && (
          <div className="space-y-2">
            {/* Checker Approval Buttons */}
            {expense.required
              .filter((reqRole) => !expense.approvals.some((a) => a.role === reqRole))
              .map((role) => {
                const roleLabel = role === 'finance-approver' ? 'Finance' : 'Department';
                const hasRole = currentUserRoles.includes(role);

                // Rule 3: Maker CANNOT self-approve
                if (isMaker) {
                  return (
                    <div
                      key={role}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-rose-300/80 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Self-Approval Forbidden: Maker cannot act as {roleLabel} Checker</span>
                    </div>
                  );
                }

                // Rule 3: Cannot approve twice under different roles
                if (hasAlreadyApproved) {
                  return (
                    <div
                      key={role}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300/80 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Double Approval Forbidden: You already signed one checker step</span>
                    </div>
                  );
                }

                // User does not hold the role
                if (!hasRole) {
                  return (
                    <div
                      key={role}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500 flex items-center justify-between"
                    >
                      <span>Awaiting {roleLabel} sign-off</span>
                      <span className="font-mono text-[10px] text-slate-600">Requires {role}</span>
                    </div>
                  );
                }

                // Eligible checker!
                return (
                  <div key={role} className="flex gap-2">
                    <button
                      onClick={() => void onApprove(expense.id, role)}
                      disabled={busy}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve as {roleLabel}</span>
                    </button>

                    <button
                      onClick={() => onReject(expense, role)}
                      disabled={busy}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition disabled:opacity-50 flex items-center gap-1"
                      title="Reject request as checker"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* Ready for Mock Settlement Execution */}
        {expense.status === 'APPROVED' && (
          <div>
            {isMakerOrChecker ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300/80 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Separation of Duties: Treasury Executor must be independent from Maker & Checkers</span>
              </div>
            ) : !currentUserRoles.includes('treasury-executor') ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Quorum complete. Awaiting Treasury</span>
                <span className="font-mono text-[10px] text-slate-600">Requires treasury-executor</span>
              </div>
            ) : (
              <button
                onClick={() => void onExecute(expense.id)}
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Execute Mock Treasury Settlement</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
