import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError, isLoading } = useAuth();

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-premium-purple-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 text-premium-purple-700 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-premium-purple-500 to-premium-purple-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-premium-purple-500/20">
            <Hexagon className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-semibold text-slate-900 tracking-tight font-display">DualSpend</span>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-slate-200/60 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
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
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-premium-purple-500/25 focus:border-premium-purple-500 transition-all"
                  placeholder="you@company.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-premium-purple-500/25 focus:border-premium-purple-500 transition-all"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Don't have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link to="/signup">
            <Button variant="secondary" className="w-full h-12 text-base">
              Create an account
            </Button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-600 hover:text-premium-purple-600 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

