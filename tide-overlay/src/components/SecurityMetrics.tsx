'use client';

import React from 'react';
import { DollarSign, Clock, CheckCircle2, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

interface SecurityMetricsProps {
  expenses: Array<{
    id: string;
    amountCents: number;
    status: string;
  }>;
  blockedCount: number;
}

export function SecurityMetrics({ expenses, blockedCount }: SecurityMetricsProps) {
  const totalCount = expenses.length;
  const totalVolumeCents = expenses.reduce((acc, curr) => acc + curr.amountCents, 0);

  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length;
  const pendingVolumeCents = expenses
    .filter((e) => e.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.amountCents, 0);

  const readyCount = expenses.filter((e) => e.status === 'APPROVED').length;
  const settledCount = expenses.filter((e) => e.status === 'SETTLED_MOCK').length;
  const rejectedCount = expenses.filter((e) => e.status === 'REJECTED').length;

  const formatUSD = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Total Volume */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Pipeline</span>
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">{formatUSD(totalVolumeCents)}</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
          <span>{totalCount} total request{totalCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Awaiting Quorum */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-amber-500/30 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Awaiting Quorum</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-amber-300 tracking-tight">{pendingCount} Pending</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400/80">
          <span>{formatUSD(pendingVolumeCents)} in review</span>
        </div>
      </div>

      {/* Ready to Settle */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-emerald-500/30 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Quorum Achieved</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-emerald-300 tracking-tight">{readyCount} Ready</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400/80">
          <span>Dual verification complete</span>
        </div>
      </div>

      {/* Mock Settled */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-indigo-500/30 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Mock Settled</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-indigo-300 tracking-tight">{settledCount} Settled</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
          <span>Independent Treasury</span>
        </div>
      </div>

      {/* Breach Immunity / Interceptions */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-rose-500/30 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Policy Interceptions</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-300 tracking-tight">{blockedCount + rejectedCount} Blocked</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
          <span>{rejectedCount} rejected · {blockedCount} attacks</span>
        </div>
      </div>
    </section>
  );
}
