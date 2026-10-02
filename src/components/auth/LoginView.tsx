import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginView: React.FC = () => {
  const { signInWithEmail, availablePersonas, switchPersona, isLiveSupabase, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    if (!email.trim()) return;

    const res = await signInWithEmail(email, password);
    if (!res.success && res.error) {
      setLocalErr(res.error);
    }
  };

  const handleQuickPersonaLogin = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword('zero1234');
    await signInWithEmail(personaEmail, 'zero1234');
  };

  return (
    <div className="min-h-screen w-full flex bg-neutral-950 text-neutral-100">
      {/* Left Column: Creative Agency Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-neutral-800">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/zero_hub_hero_banner_1790837263786.jpg"
            alt="Zero Media Studio"
            className="h-full w-full object-cover filter brightness-40"
          />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        </div>

        {/* Content on top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-black tracking-tight text-white">
              Zero Hub
            </span>
            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
              Zero Media Internal
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            Work Management & Creative Pipeline
          </div>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight leading-tight">
            Managing campaigns, creative deliverables, and client sign-offs from one unified system.
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Engineered exclusively for Zero Media teams and partner brands to accelerate video editing workflows and approval turnarounds.
          </p>
        </div>

        <div className="relative z-10 text-xs text-neutral-500 font-mono">
          Zero Media Inc. · Confidential Agency System · Vercel Ready
        </div>
      </div>

      {/* Right Column: Authentication Form & Role Quick-Access */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Brand header */}
          <div>
            <div className="font-display text-xl font-bold text-neutral-100">
              Sign in to Zero Hub
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Enter your Zero Media email credentials to access your workspace
            </p>
          </div>

          {/* Error Message */}
          {(localErr || error) && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/30 p-3 text-xs text-rose-300 leading-relaxed">
              {localErr || error}
            </div>
          )}

          {/* Standard Email / Password Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@zeromedia.agency"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-neutral-300 font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-neutral-400 hover:text-amber-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-amber-400 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Persona Access for Testing & Demonstration */}
          <div className="border-t border-neutral-800 pt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
              <span>Quick Demo Sign-In (1-Tap):</span>
              <span className="text-[10px] text-amber-400 font-mono">6 Roles</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availablePersonas.map((persona) => {
                const roleLabel = persona.role.replace('_', ' ');
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => handleQuickPersonaLogin(persona.email)}
                    className="flex flex-col items-start p-2 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 hover:border-amber-400/40 text-left transition-colors"
                  >
                    <span className="font-semibold text-neutral-200 text-xs truncate w-full">
                      {persona.full_name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-amber-400 capitalize truncate w-full mt-0.5">
                      {roleLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4 text-center">
            <p className="text-[11px] text-neutral-500">
              Zero Media Work Management System · Protected Application
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </div>
  );
};
