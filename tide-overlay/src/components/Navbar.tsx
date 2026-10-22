'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  LogOut,
  LogIn,
  User,
  Sparkles,
  HelpCircle,
  X,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export type RoleViewpoint = 'maker' | 'checker' | 'auditor';

interface NavbarProps {
  authenticated: boolean;
  username: string;
  sub: string;
  roles: string[];
  activeRoleView: RoleViewpoint;
  onRoleViewChange: (role: RoleViewpoint) => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function Navbar({
  authenticated,
  username,
  sub,
  roles,
  activeRoleView,
  onRoleViewChange,
  onLogin,
  onLogout,
}: NavbarProps) {
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        {/* Top micro-banner */}
        <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-teal-950/80 border-b border-teal-500/20 px-4 py-1.5 text-xs text-slate-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-semibold text-teal-300">RMIT HACKATHON 2026</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-mono">Group: RMIT_SGS_N3T_C2</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-teal-400">
                <ShieldCheck className="w-3.5 h-3.5" /> TideCloak MultiAdmin Fabric
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:flex items-center gap-1 text-emerald-400">
                <Key className="w-3.5 h-3.5" /> RFC 9449 DPoP Active
              </span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span className="hidden md:flex items-center gap-1 text-indigo-400">
                <Lock className="w-3.5 h-3.5" /> Zero Master Key
              </span>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 shadow-glow text-white font-bold">
                <ShieldCheck className="w-6 h-6" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-slate-950" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white">Dual Control Desk</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    Tide Unlocked
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Policy-Governed Signing & Dual-Control Maker-Checker Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {authenticated ? (
                <div className="flex items-center gap-3">
                  {/* Role Viewpoint Switcher */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="hidden sm:flex text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-1.5 items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3 text-teal-400" /> View:
                    </span>
                    <button
                      onClick={() => onRoleViewChange('maker')}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                        activeRoleView === 'maker'
                          ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Role: Maker (can initiate requests, blocked from self-approval)"
                    >
                      Maker
                    </button>
                    <button
                      onClick={() => onRoleViewChange('checker')}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                        activeRoleView === 'checker'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Role: Checker (can review, approve, reject requests)"
                    >
                      Checker
                    </button>
                    <button
                      onClick={() => onRoleViewChange('auditor')}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                        activeRoleView === 'auditor'
                          ? 'bg-indigo-500 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Role: Auditor (read-only audit logs & telemetry)"
                    >
                      Auditor
                    </button>
                  </div>

                  {/* Multi-role guide button */}
                  <button
                    onClick={() => setGuideModalOpen(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-teal-300 bg-slate-900 border border-slate-800 transition"
                    title="Role-Based Access & Multi-Account Testing Guide"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  {/* User Profile Chip */}
                  <div className="glass-card-subtle px-3 py-1.5 rounded-lg border border-slate-700/60 hidden md:block text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-200 font-medium">
                      <User className="w-3.5 h-3.5 text-teal-400" />
                      <span>{username}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <span
                            key={r}
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-600/30"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">appUser</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
                    title="Sign out of TideCloak"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-glow transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in with TideCloak</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Role Testing Guide Modal */}
      {guideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-teal-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">RBAC & Multi-Account Testing Guide</h3>
              </div>
              <button
                onClick={() => setGuideModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="glass-card-subtle p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-teal-300 mb-1">1. Supported TideCloak Token Roles</div>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    <strong className="text-white font-mono">maker</strong>: Initiates sensitive operations (wire transfers, firewall changes, HSM key rotations). Cannot approve own requests.
                  </li>
                  <li>
                    <strong className="text-white font-mono">checker</strong>: Reviews, cryptographically approves (attaching DPoP proof), or rejects pending requests.
                  </li>
                  <li>
                    <strong className="text-white font-mono">auditor</strong>: Read-only access to immutable audit log and blast-radius telemetry. Cannot create or approve requests.
                  </li>
                </ul>
              </div>

              <div className="glass-card-subtle p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-emerald-300 mb-1">2. Testing Multiple Roles in Development</div>
                <p className="text-slate-400 leading-relaxed mb-2">
                  To test true independent multi-party dual-control quorum while keeping real server-side JWT verification:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Multi-Profile / Incognito</strong>: Open an Incognito window or second browser profile to log into TideCloak as a separate identity (e.g. Maker in main window, Checker in incognito).
                  </li>
                  <li>
                    <strong className="text-slate-200">Active Role View Switcher</strong>: Use the top navbar switcher (<code className="text-teal-300 font-mono">Maker / Checker / Auditor</code>) to quickly test UI gating from each role perspective.
                  </li>
                  <li>
                    <strong className="text-slate-200">Self-Approval Violation Test</strong>: Attempt to approve a request created by your own account to see the exact server-side <code className="text-rose-300 font-mono">403 Dual-Control Violation</code> block.
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-[11px] text-teal-200">
                All API routes under <code className="font-mono">/api/requests/*</code> enforce server-side JWT token validation and role checks via <code className="font-mono">withAuth</code> and <code className="font-mono">isMaker / isChecker / isAuditor</code>.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setGuideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
