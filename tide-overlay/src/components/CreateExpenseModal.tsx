'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Key,
  Shield,
  Send,
} from 'lucide-react';

export const OFFICIAL_CATEGORIES = [
  'Treasury Wire Transfer',
  'Production Firewall / IAM Policy Change',
  'Emergency Database Key Rotation',
] as const;

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    category: string;
    vendor: string;
    justification: string;
    payload?: Record<string, any>;
  }) => Promise<void>;
  busy: boolean;
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  busy,
}: CreateExpenseModalProps) {
  const [category, setCategory] = useState<string>(OFFICIAL_CATEGORIES[0]);
  const [title, setTitle] = useState('High-Value Treasury Settlement Transfer');
  const [amount, setAmount] = useState('24500');
  const [vendor, setVendor] = useState('International Medical Logistics AG');
  const [firewallTarget, setFirewallTarget] = useState('Port 443 -> DMZ Cluster vpc-prod-01');
  const [keyAlias, setKeyAlias] = useState('hsm/master/database-aes-256');
  const [justification, setJustification] = useState(
    'Strict policy-governed transaction requiring independent multi-party dual control quorum.'
  );

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const isTreasury = category === 'Treasury Wire Transfer';
  const isFirewall = category === 'Production Firewall / IAM Policy Change';
  const isKeyRotation = category === 'Emergency Database Key Rotation';

  const requiresDualControl = isTreasury ? numAmount > 10000 : true;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (cat === 'Treasury Wire Transfer') {
      setTitle('High-Value Treasury Settlement Transfer');
      setAmount('25000');
    } else if (cat === 'Production Firewall / IAM Policy Change') {
      setTitle('Emergency Ingress Rule Update for Payment Gateway');
      setAmount('0');
    } else if (cat === 'Emergency Database Key Rotation') {
      setTitle('Rotate Master AES-256 HSM Encryption Key');
      setAmount('0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadData: Record<string, any> = {
      justification,
    };

    if (isTreasury) {
      payloadData.amount = numAmount;
      payloadData.recipient = vendor;
    } else if (isFirewall) {
      payloadData.target = firewallTarget;
      payloadData.action = 'ALLOW_INGRESS';
    } else if (isKeyRotation) {
      payloadData.keyAlias = keyAlias;
      payloadData.algorithm = 'AES-256-GCM';
    }

    await onSubmit({
      title,
      amount: numAmount,
      category,
      vendor: isTreasury ? vendor : category,
      justification,
      payload: payloadData,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Policy-Governed Request</h2>
              <p className="text-xs text-slate-400 font-mono">Role: Maker (requester)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Request Category <span className="text-teal-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OFFICIAL_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-950/60 border-teal-500 text-teal-200 font-semibold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] font-mono mt-1 opacity-70">
                      {cat === 'Treasury Wire Transfer' ? '> $10k Quorum' : 'Mandatory Dual'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operation Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={150}
              placeholder="Descriptive title of the sensitive operation..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Treasury Amount */}
          {isTreasury && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Amount (USD) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    required
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient / Beneficiary
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Apex Global Logistics"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Firewall Target */}
          {isFirewall && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Firewall Rule / Subnet Specification
              </label>
              <input
                type="text"
                value={firewallTarget}
                onChange={(e) => setFirewallTarget(e.target.value)}
                placeholder="e.g. Ingress 443 -> prod-vpc-01"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Key Rotation Alias */}
          {isKeyRotation && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                HSM Master Key Alias / KMS ARN
              </label>
              <input
                type="text"
                value={keyAlias}
                onChange={(e) => setKeyAlias(e.target.value)}
                placeholder="e.g. hsm/master/database-aes-256"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Operational Justification
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={2}
              placeholder="State compliance or operational mandate..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700/80 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Dynamic Policy Threshold Banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              requiresDualControl
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-teal-950/30 border-teal-500/30 text-teal-200'
            }`}
          >
            {requiresDualControl ? (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">
                {requiresDualControl
                  ? '⚡ Strict Dual-Control Quorum Mandatory'
                  : 'Single-Control Quorum Permitted (< $10,000)'}
              </div>
              <p className="text-[11px] text-slate-300/90 mt-0.5">
                {requiresDualControl
                  ? 'Policy requires 2 distinct approvers (Finance + Department/Security). Initiator is strictly blocked from self-approval.'
                  : 'Single verified checker approval sufficient for treasury release.'}
              </p>
            </div>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition disabled:opacity-50"
            >
              {busy ? 'Initiating...' : 'Initiate Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
