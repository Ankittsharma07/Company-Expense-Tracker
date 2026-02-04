import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { resetPassword } from '../lib/api';

const getPasswordIssues = (password: string) => {
  const issues = [];
  if (password.length < 8) issues.push('At least 8 characters');
  if (!/[a-z]/.test(password)) issues.push('One lowercase letter');
  if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
  if (!/[0-9]/.test(password)) issues.push('One number');
  return issues;
};

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = Boolean(token) && passwordIssues.length === 0 && passwordsMatch;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Reset token is missing or invalid.');
      return;
    }

    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const result = await resetPassword({ token, password });
      setStatus('success');
      setMessage(result.message || 'Your password has been reset.');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unable to reset password.';
      setStatus('error');
      setMessage(errMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-slate-200/60 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Set a new password</h1>
            <p className="text-slate-500">Choose a strong password to secure your account.</p>
          </div>

          {!token && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">Reset token is missing or invalid.</p>
            </div>
          )}

          {status === 'success' && message && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          {status === 'error' && message && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
                  placeholder="New password"
                  disabled={isLoading || !token}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all"
                  placeholder="Confirm password"
                  disabled={isLoading || !token}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-2">Password requirements</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase and one lowercase letter</li>
                <li>One number</li>
              </ul>
              {password && passwordIssues.length > 0 && (
                <p className="mt-2 text-rose-600">
                  Missing: {passwordIssues.join(', ')}
                </p>
              )}
            </div>

            {!passwordsMatch && confirmPassword && (
              <p className="text-sm text-rose-600">Passwords do not match.</p>
            )}

            <Button type="submit" className="w-full h-12" disabled={!canSubmit || isLoading}>
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
