'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Filter,
  Search,
  Activity,
} from 'lucide-react';

export interface AuditEvent {
  at: string;
  type: string;
  by: string;
  expenseId: string | null;
  detail: string;
}

interface AuditFeedProps {
  events: AuditEvent[];
}

export function AuditFeed({ events }: AuditFeedProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchExpense = e.expenseId?.toLowerCase().includes(q);
      const matchBy = e.by.toLowerCase().includes(q);
      const matchDetail = e.detail.toLowerCase().includes(q);
      return matchExpense || matchBy || matchDetail;
    }
    return true;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/30">
            <Activity className="w-3 h-3 text-teal-400" />
            CREATED
          </span>
        );
      case 'APPROVED_BY_ROLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            APPROVED
          </span>
        );
      case 'REJECTED_BY_ROLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            REJECTED
          </span>
        );
      case 'MOCK_SETTLEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Award className="w-3 h-3 text-indigo-400" />
            SETTLED
          </span>
        );
      case 'ROLE_CHANGE_BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            ATTACK BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Security Telemetry & Cryptographic Audit Trail
          </h2>
          <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
            {events.length} logs
          </span>
        </div>

        {/* Filter Chips & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="pl-7 pr-3 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500 w-36 sm:w-44"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Events</option>
            <option value="CREATED">Created</option>
            <option value="APPROVED_BY_ROLE">Approved</option>
            <option value="REJECTED_BY_ROLE">Rejected</option>
            <option value="MOCK_SETTLEMENT">Settlement</option>
            <option value="ROLE_CHANGE_BLOCKED">Attacks Blocked</option>
          </select>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Event Type</th>
              <th className="py-2.5 px-3">Actor / Subject</th>
              <th className="py-2.5 px-3">Expense ID</th>
              <th className="py-2.5 px-3">Telemetry Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                  No telemetry recorded matching criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(evt.at).toLocaleDateString()} {new Date(evt.at).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">{getEventBadge(evt.type)}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-semibold max-w-[120px] truncate">
                    {evt.by}
                  </td>
                  <td className="py-2.5 px-3 text-teal-400 font-bold whitespace-nowrap">
                    {evt.expenseId || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans text-xs max-w-md truncate">
                    {evt.detail}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
