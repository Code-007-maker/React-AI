import React from 'react';
import { Sparkles, LogOut, BookOpen, ShieldCheck, Plus, User } from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurityModal: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurityModal,
  entryCount,
}) => {
  return (
    <header
      id="app-header"
      className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/20">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white">ReflectAI</span>
              <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Private AI Journal & Reflections</p>
          </div>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                id="btn-new-reflection"
                onClick={onNewEntry}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Reflection</span>
              </button>

              <button
                id="btn-open-security-spec"
                onClick={onOpenSecurityModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                title="View Security & Threat Model Specs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Security Architecture</span>
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block" />

              {/* User Profile Pill */}
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 pl-2 pr-3 py-1 rounded-full">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-200 leading-tight max-w-[120px] truncate">
                    {user.displayName || 'Explorer'}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none">
                    {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                id="btn-sign-out"
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              id="btn-nav-security"
              onClick={onOpenSecurityModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Specs</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
