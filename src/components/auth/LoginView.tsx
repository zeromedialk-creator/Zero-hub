import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ThemeToggle } from '../common/ThemeToggle';

const LS_SAVED_EMAIL = 'zerohub_saved_login_email';

export const LoginView: React.FC = () => {
  const { signInWithEmail, isLoading, error } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_SAVED_EMAIL);
    if (saved) {
      setEmailOrUsername(saved);
      setRememberEmail(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);

    const identifier = emailOrUsername.trim();
    if (!identifier) {
      setLocalErr('Please enter your username or email address.');
      return;
    }

    if (!password.trim()) {
      setLocalErr('Please enter your password.');
      return;
    }

    if (rememberEmail) {
      localStorage.setItem(LS_SAVED_EMAIL, identifier);
    } else {
      localStorage.removeItem(LS_SAVED_EMAIL);
    }

    const res = await signInWithEmail(identifier, password.trim());
    if (!res.success && res.error) {
      setLocalErr(res.error);
    }
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
          Zero Media Inc. · Confidential Agency System · Authentication Portal
        </div>
      </div>

      {/* Right Column: Secure Authentication Portal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle variant="pill" />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-[11px] font-medium text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Zero Hub Production Portal</span>
          </div>

          {/* Brand header */}
          <div>
            <div className="font-display text-2xl font-bold text-neutral-100">
              Sign in to Zero Hub
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Enter your username or email and password to access your workspace
            </p>
          </div>

          {/* Error Message */}
          {(localErr || error) && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300 leading-relaxed flex items-start justify-between gap-2">
              <span>{localErr || error}</span>
              <button
                type="button"
                onClick={() => setLocalErr(null)}
                className="text-rose-400 hover:text-rose-200 shrink-0 font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Username / Password Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">Username or Email</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="name@zeromedia.lk or username"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-9 pr-10 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                />
                <span>Remember username/email on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-amber-400 py-2.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-neutral-950 border-t-transparent animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Zero Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Secure Environment Information */}
          <div className="border-t border-neutral-800/80 pt-4 space-y-3">
            <div className="flex items-start gap-2.5 text-neutral-400 text-xs">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-300">Authorized Access Only</span>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                  Zero Hub is strictly reserved for Zero Media personnel and authorized client stakeholders. All session actions are encrypted and audited.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-3 text-center">
            <p className="text-[11px] text-neutral-500">
              Zero Media Inc. · Confidential Agency Portal
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </div>
  );
};
