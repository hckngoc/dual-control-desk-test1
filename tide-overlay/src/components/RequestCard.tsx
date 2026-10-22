'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  User,
  Building,
  Tag,
  DollarSign,
  Award,
  Key,
  Lock,
  Shield,
  FileCode,
  Fingerprint,
} from 'lucide-react';
import type { SensitiveRequest } from '@/lib/requests/types';

interface RequestCardProps {
  request: SensitiveRequest;
  currentUserId: string;
  currentUserRoles: string[];
  busy: boolean;
  onApprove: (id: string, role?: string) => Promise<void>;
  onReject: (request: SensitiveRequest) => void;
  onExecute: (id: string) => Promise<void>;
}

export function RequestCard({
  request,
  currentUserId,
  currentUserRoles,
  busy,
  onApprove,
  onReject,
  onExecute,
}: RequestCardProps) {
  const isMaker = currentUserId === request.makerId;
  const isHighOrCritical = request.riskLevel === 'HIGH' || request.riskLevel === 'CRITICAL';
  const isChecker = currentUserRoles.some((r) =>
    [
      'checker',
      'finance-approver',
      'department-approver',
      'security-admin',
      'infrastructure-lead',
      'treasury-executor',
    ].includes(r)
  );
  const isAuditor = currentUserRoles.includes('auditor') && !isChecker;

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);

  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING_QUORUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>PENDING QUORUM ({request.approvals.length}/{request.requiredQuorum})</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>APPROVED · Quorum Met</span>
          </span>
        );
      case 'EXECUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>EXECUTED (Policy Enclave)</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>REJECTED by Checker</span>
          </span>
        );
      default:
        return null;
    }
  };

  const hasAlreadyApproved = request.approvals.some((a) => a.userId === currentUserId);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl border border-slate-800 p-5 transition flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950/70 px-2.5 py-1 rounded-lg border border-teal-500/30">
              {request.id}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date(request.createdAt).toLocaleDateString()} {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Title */}
        <div className="mb-2">
          <h3 className="text-base font-bold text-white tracking-tight leading-snug">{request.title}</h3>
        </div>

        {/* Category & Risk Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800/80 text-teal-300 border border-slate-700">
            {request.category === 'Treasury Wire Transfer' ? (
              <DollarSign className="w-3 h-3 text-teal-400" />
            ) : request.category === 'Production Firewall / IAM Policy Change' ? (
              <Shield className="w-3 h-3 text-indigo-400" />
            ) : (
              <Key className="w-3 h-3 text-amber-400" />
            )}
            <span>{request.category}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              request.riskLevel === 'CRITICAL'
                ? 'bg-rose-950/50 text-rose-300 border border-rose-500/40'
                : request.riskLevel === 'HIGH'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40'
                : 'bg-teal-950/50 text-teal-300 border border-teal-500/40'
            }`}
          >
            <span>RISK: {request.riskLevel}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
            {request.requiresDualControl ? 'Dual Control (2-of-2 Quorum)' : 'Single Control (1 Quorum)'}
          </span>
        </div>

        {/* Payload Snapshot */}
        <div className="glass-card-subtle p-3 rounded-xl border border-slate-800/80 mb-3 text-xs">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Operation Payload
          </div>
          {request.payload?.amount !== undefined && (
            <div className="flex justify-between py-0.5 text-slate-300">
              <span className="text-slate-400">Transfer Amount:</span>
              <span className="font-bold text-teal-300 font-mono">{formatUSD(Number(request.payload.amount))}</span>
            </div>
          )}
          {request.payload?.recipient && (
            <div className="flex justify-between py-0.5 text-slate-300">
              <span className="text-slate-400">Recipient:</span>
              <span className="font-medium text-slate-200">{request.payload.recipient}</span>
            </div>
          )}
          {request.payload?.target && (
            <div className="flex justify-between py-0.5 text-slate-300">
              <span className="text-slate-400">Firewall Target:</span>
              <span className="font-mono text-indigo-300 text-[11px]">{request.payload.target}</span>
            </div>
          )}
          {request.payload?.keyAlias && (
            <div className="flex justify-between py-0.5 text-slate-300">
              <span className="text-slate-400">Key Alias:</span>
              <span className="font-mono text-amber-300 text-[11px]">{request.payload.keyAlias}</span>
            </div>
          )}
        </div>

        {/* Maker Identity */}
        <div className="glass-card-subtle p-2.5 rounded-xl border border-slate-800/80 mb-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 border border-slate-700">
              <User className="w-3 h-3" />
            </div>
            <div>
              <div className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                <span>Maker: {request.makerName}</span>
                {isMaker && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    You (Initiator)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                {request.makerEmail} · sub: {request.makerId}
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Quorum & Signatures */}
        <div className="mb-3">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
              <span>Cryptographic Quorum Signatures</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {request.approvals.length} / {request.requiredQuorum} Signed
            </span>
          </div>

          <div className="space-y-1.5">
            {request.approvals.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 text-center italic">
                Awaiting independent checker verification...
              </div>
            ) : (
              request.approvals.map((sig, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sig.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/40 px-1.5 py-0.2 rounded">
                      {sig.role}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[180px]">key: {sig.proof.keyThumbprint || 'sender-constrained'}</span>
                    <span className="text-slate-500">{new Date(sig.approvedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rejection / Execution Metadata */}
        {request.rejection && (
          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 mb-3">
            <div className="font-semibold flex items-center gap-1 text-[11px]">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Rejected by {request.rejection.name} ({request.rejection.role})</span>
            </div>
            <div className="text-[11px] text-rose-200/90 mt-0.5 italic">"{request.rejection.reason}"</div>
          </div>
        )}

        {request.execution && (
          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 mb-3">
            <div className="font-semibold flex items-center gap-1 text-[11px]">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Executed: {request.execution.executionReference}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              by {request.execution.executorName} at {new Date(request.execution.executedAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons with Strict Separation of Duties Enforcement */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        {request.status === 'PENDING_QUORUM' && (
          <div>
            {isMaker ? (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Dual-Control Violation: Initiator cannot approve their own request.</span>
              </div>
            ) : isAuditor ? (
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Auditor View: Read-only access to governance telemetry (Approval restricted to Checkers).</span>
              </div>
            ) : !isChecker ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Awaiting independent Checker sign-off</span>
                <span className="font-mono text-[10px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">Requires 'checker' role</span>
              </div>
            ) : hasAlreadyApproved ? (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Dual-Control Violation: One identity cannot approve twice in a quorum.</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => void onApprove(request.id)}
                  disabled={busy}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sign & Approve Request</span>
                </button>

                <button
                  onClick={() => onReject(request)}
                  disabled={busy}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition disabled:opacity-50 flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        )}

        {request.status === 'APPROVED' && (
          <div>
            {isMaker ? (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300/80 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Separation of Duties: Initiator cannot execute sensitive operation.</span>
              </div>
            ) : isAuditor ? (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-indigo-300/80 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Auditor View: Read-only access to settlement telemetry.</span>
              </div>
            ) : !isChecker ? (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Quorum complete. Awaiting execution</span>
                <span className="font-mono text-[10px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">Requires 'checker' role</span>
              </div>
            ) : (
              <button
                onClick={() => void onExecute(request.id)}
                disabled={busy}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-400 hover:to-teal-400 shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Execute Policy Action</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
