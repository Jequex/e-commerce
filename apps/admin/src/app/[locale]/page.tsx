'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';

export default function AdminLandingPage() {
  const [branding, setBranding] = useState<{ appName: string; appLogoUrl: string }>({
    appName: 'Jequex Admin',
    appLogoUrl: '',
  });

  useEffect(() => {
    const contactUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? '/api/store/settings/contact'
      : 'http://localhost:8080/api/store/settings/contact';

    fetch(contactUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBranding({
            appName: data.app_name || data.appName || 'Jequex Admin',
            appLogoUrl: data.app_logo_url || data.appLogoUrl || '',
          });
        }
      })
      .catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-60 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.appLogoUrl ? (
              <div className="h-11 w-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <img src={branding.appLogoUrl} alt={branding.appName} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Icons.RocketIcon className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="text-xl font-bold tracking-tight text-white">{branding.appName}</span>
              <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">Merchant Portal</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#workflow" className="hover:text-white transition">Workflow</a>
            <a href="#capabilities" className="hover:text-white transition">Capabilities</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition rounded-xl hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
          Next-Gen E-Commerce Operations Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none"
        >
          Empower Your Business With the Ultimate{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Merchant Portal
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Scale operations, track inventory across stores, fulfill incoming customer orders in real-time, and monitor revenue with enterprise precision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 text-base"
          >
            Create Admin Account &rarr;
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-semibold rounded-2xl transition text-base"
          >
            Sign in to Dashboard
          </Link>
        </motion.div>

        {/* Quick Trust Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-y border-slate-800/80 py-8">
          <div>
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">Real-time Order Sync</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">&lt; 100ms</div>
            <div className="text-xs text-slate-400 mt-0.5">API Latency</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">Web & Mobile</div>
            <div className="text-xs text-slate-400 mt-0.5">Omnichannel Storefronts</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">Full Audit</div>
            <div className="text-xs text-slate-400 mt-0.5">Legal & Compliance Trail</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-bold text-blue-400 tracking-wider">Engineered for Merchants</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white mt-2">Everything You Need to Run Your Digital Store</p>
          <p className="text-slate-400 mt-3 text-sm">Robust microservice-backed tooling designed to give merchants complete autonomy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.CubeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Product Catalog & SKUs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Create and manage products with high-definition imagery, price tiers, stock thresholds, and live inventory replenishment tracking.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.ReaderIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Order Dispatch & Fulfillment</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time webhook notifications for new purchases. Filter by processing, shipped, and completed states with automated customer updates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.PersonIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Team & Staff Access Control</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Invite store employees, assign granular roles (cashier, inventory manager, store owner), and audit all staff actions securely.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.BarChartIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics & Revenue Metrics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Monitor gross revenue, order volume, daily sales performance, average cart sizes, and customer repeat purchase frequencies.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.MobileIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Native Mobile Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              All inventory and store configuration changes instantly propagate to both web storefront and customer React Native mobile applications.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
              <Icons.CheckCircledIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Compliance & Consent Audit</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every merchant and staff registration records legal consent versioning to ensure compliance with digital e-commerce standards.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Instant Onboarding</h2>
          <p className="text-3xl font-bold text-white mt-2">Get Your Store Online in Three Steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative">
            <div className="text-4xl font-black text-slate-700 mb-4">01</div>
            <h4 className="text-lg font-bold text-white mb-1">Create Admin Account</h4>
            <p className="text-sm text-slate-400">Fill out your administrator profile with email, password, and legal acceptance.</p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative">
            <div className="text-4xl font-black text-slate-700 mb-4">02</div>
            <h4 className="text-lg font-bold text-white mb-1">List Products & Set Prices</h4>
            <p className="text-sm text-slate-400">Upload your product catalog, assign prices, stock quantities, and product descriptions.</p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl relative">
            <div className="text-4xl font-black text-slate-700 mb-4">03</div>
            <h4 className="text-lg font-bold text-white mb-1">Receive & Fulfill Orders</h4>
            <p className="text-sm text-slate-400">Watch incoming orders stream in from web and mobile users and dispatch with ease.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full relative z-10">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-purple-900/50 border border-blue-500/30 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Start Selling?</h3>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
              Join merchants leveraging the Jequex ecosystem to streamline their product inventory, fulfillment, and business growth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-100 transition shadow-lg text-sm"
              >
                Sign Up as Merchant &rarr;
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3 bg-slate-950/60 border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-900 transition text-sm"
              >
                Sign In to Existing Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 {branding.appName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">
              Customer Web App ↗
            </a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 font-mono">Port: 3006</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
