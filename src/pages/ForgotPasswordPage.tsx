import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { requestPasswordReset } from '../lib/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const result = await requestPasswordReset({ email });
      setStatus('success');
      setMessage(result.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unable to send reset email.';
      setStatus('error');
      setMessage(errMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-slate-200/60 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Forgot your password?</h1>
            <p className="text-slate-500">
              Enter your email and we&apos;ll send you a secure reset link.
            </p>
          </div>

          {status === 'success' && message && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {message}
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                  placeholder="you@company.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Sending link...' : 'Send reset link'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
