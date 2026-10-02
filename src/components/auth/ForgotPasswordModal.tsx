import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto sm:my-6 max-h-[92dvh]">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>Reset Password</span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-4 space-y-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <div className="font-semibold text-neutral-100">Password Reset Email Dispatched</div>
            <p className="text-neutral-400 leading-relaxed">
              If an account with {email} exists in Zero Hub, you will receive password reset instructions shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-neutral-800 px-4 py-2 font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-neutral-400 leading-relaxed">
              Enter your registered Zero Media email address and we'll send you a secure link to reset your password.
            </p>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@zeromedia.agency"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
