import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight, CheckCircle2, Shield, Zap, Hexagon } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-transparent font-sans">
      <nav className="fixed w-full bg-white/75 backdrop-blur-xl border-b border-slate-200/60 z-50 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-teal-700">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Hexagon className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-semibold text-slate-900 tracking-tight font-display">DualSpend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Log in</Link>
            <Link to="/dashboard">
              <Button size="sm" className="rounded-full px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16 page-enter">
        <div className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50/70 text-teal-700 text-sm font-medium mb-8 border border-teal-100/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              New: AI-Powered Receipt Scanning
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold text-slate-900 tracking-tight mb-8 leading-[1.1] font-display">
              Spend management <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-sky-500">for modern teams</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Control spend, automate approvals, and close books faster. The all-in-one platform designed for high-growth startups.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
              <Link to="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-teal-500/25 w-full sm:w-auto">
                  Start for free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto">
                Book Demo
              </Button>
            </div>
            
            <div className="relative mx-auto max-w-6xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-sky-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="mx-auto px-3 py-1 bg-slate-800 rounded-md text-xs text-slate-400 font-mono">dualspend.com/dashboard</div>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2426&q=80" 
                  alt="Dashboard Preview" 
                  className="w-full opacity-90"
                />
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>
        </div>

        <div className="py-24 bg-white/70 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight font-display">Everything you need to scale</h2>
              <p className="mt-4 text-slate-500">Powerful features built for the next generation of companies.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 stagger-children">
              <div className="bg-white/80 p-8 rounded-2xl border border-slate-200/60 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-shadow">
                <div className="w-12 h-12 bg-teal-50/80 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 font-display">Instant Approvals</h3>
                <p className="text-slate-500 leading-relaxed">Automate expense policies and approve requests in seconds via Slack or email. No more chasing receipts.</p>
              </div>
              <div className="bg-white/80 p-8 rounded-2xl border border-slate-200/60 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-shadow">
                <div className="w-12 h-12 bg-teal-50/80 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 font-display">Enterprise Security</h3>
                <p className="text-slate-500 leading-relaxed">Bank-grade encryption, SOC 2 compliance, and advanced fraud detection to keep your data safe.</p>
              </div>
              <div className="bg-white/80 p-8 rounded-2xl border border-slate-200/60 shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-shadow">
                <div className="w-12 h-12 bg-teal-50/80 text-teal-700 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 font-display">Real-time Sync</h3>
                <p className="text-slate-500 leading-relaxed">Syncs seamlessly with QuickBooks, Xero, NetSuite, and other accounting tools in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white/80 border-t border-slate-200/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-900">
            <Hexagon className="w-5 h-5 fill-current text-teal-600" />
            <span className="font-semibold tracking-tight font-display">DualSpend</span>
          </div>
          <p className="text-slate-500 text-sm">(c) 2024 DualSpend Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Twitter</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">LinkedIn</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
