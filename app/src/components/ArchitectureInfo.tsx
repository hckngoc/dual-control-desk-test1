'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  ArrowRight,
  Terminal,
  AlertOctagon,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ArchitectureInfoProps {
  onSimulateAttack: () => Promise<void>;
  attackResult: string | null;
  busy: boolean;
}

export function ArchitectureInfo({
  onSimulateAttack,
  attackResult,
  busy,
}: ArchitectureInfoProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-300 mt-1">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Trust Architecture & Separation of Duties</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Breach Immune
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              High-value spend approvals ($10,000+) mandate independent Finance and Department sign-offs.
              Identity governance is decoupled from application code through TideCloak MultiAdmin Fabric consensus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={onSimulateAttack}
            disabled={busy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition disabled:opacity-50"
            title="Attempts unauthorized admin role mutation via /api/admin/roles"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Privilege Escalation Attack</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition"
            aria-label="Toggle architecture details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Attack Feedback Banner */}
      {attackResult && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-rose-300">CRITICAL SECURITY ENFORCEMENT VERIFIED</div>
            <div className="font-mono text-[11px] text-rose-200/90">{attackResult}</div>
          </div>
        </div>
      )}

      {/* Expandable Architecture Explanations */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="glass-card-subtle p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-semibold text-teal-300 mb-2">
              <span className="flex h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 items-center justify-center text-[10px]">
                01
              </span>
              Maker-Checker Dual Control
            </div>
            <p className="text-slate-400 leading-relaxed">
              A Maker (requester) initiates spending but is cryptographically prevented from self-approving.
              Expenses ≥$10,000 require two distinct checkers: Finance and Department. Neither checker can sign twice.
            </p>
          </div>

          <div className="glass-card-subtle p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-2">
              <span className="flex h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-300 items-center justify-center text-[10px]">
                02
              </span>
              Independent Mock Settlement
            </div>
            <p className="text-slate-400 leading-relaxed">
              Execution requires the <code className="text-emerald-300">treasury-executor</code> role.
              The executor must be completely distinct from both the maker and all checkers, guaranteeing complete separation.
            </p>
          </div>

          <div className="glass-card-subtle p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 font-semibold text-indigo-300 mb-2">
              <span className="flex h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-300 items-center justify-center text-[10px]">
                03
              </span>
              Tide MultiAdmin Governance
            </div>
            <p className="text-slate-400 leading-relaxed">
              Unlike traditional IAM where a single super-admin can silently grant themselves approval roles,
              TideCloak IGA forces all role mutations into a pending multi-admin quorum with enclave cryptographic signing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
