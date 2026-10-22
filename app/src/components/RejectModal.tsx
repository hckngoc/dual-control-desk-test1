'use client';

import React, { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import type { Expense } from './ExpenseCard';

interface RejectModalProps {
  isOpen: boolean;
  expense: Expense | null;
  role: string;
  onClose: () => void;
  onConfirm: (id: string, role: string, reason: string) => Promise<void>;
  busy: boolean;
}

export function RejectModal({
  isOpen,
  expense,
  role,
  onClose,
  onConfirm,
  busy,
}: RejectModalProps) {
  const [reason, setReason] = useState('Insufficient budgetary allocation for Q4');

  if (!isOpen || !expense) return null;

  const roleLabel = role === 'finance-approver' ? 'Finance' : 'Department';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(expense.id, role, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-2xl border border-rose-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reject Expense Request</h2>
              <p className="text-xs text-rose-300 font-mono">Checker Role: {roleLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div className="font-semibold text-white">{expense.title}</div>
            <div className="text-slate-400 mt-1 flex justify-between">
              <span>ID: {expense.id}</span>
              <span>Amount: ${(expense.amountCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Rejection Rationale <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              placeholder="State the formal reason for rejection..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-200/90 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span>
              This rejection will be permanently recorded in the cryptographic audit telemetry.
              No further approvals or execution will be allowed for this expense.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-50"
            >
              {busy ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
