'use client';

import React, { useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branding, setBranding] = useState<{ appName: string; appLogoUrl: string }>({
    appName: 'Jequex E-Commerce',
    appLogoUrl: '',
  });
  const [legalVersions, setLegalVersions] = useState<{ termsVersion: string; privacyVersion: string }>({
    termsVersion: '1.0',
    privacyVersion: '1.0',
  });
  const [viewingDoc, setViewingDoc] = useState<{ title: string; content: string; version: string } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const router = useRouter();
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const { setAuth } = useAuthStore();

  React.useEffect(() => {
    // Fetch branding
    const contactUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? '/api/store/settings/contact'
      : 'http://localhost:8080/api/store/settings/contact';

    fetch(contactUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBranding({
            appName: data.app_name || data.appName || 'Jequex E-Commerce',
            appLogoUrl: data.app_logo_url || data.appLogoUrl || '',
          });
        }
      })
      .catch(() => {});

    // Fetch active legal document versions
    const legalUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? '/api/store/legal'
      : 'http://localhost:8080/api/store/legal';

    fetch(legalUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data?.documents && Array.isArray(data.documents)) {
          const versions = { termsVersion: '1.0', privacyVersion: '1.0' };
          data.documents.forEach((d: any) => {
            if (d.type === 'terms_conditions') versions.termsVersion = d.current_version || '1.0';
            if (d.type === 'privacy_policy') versions.privacyVersion = d.current_version || '1.0';
          });
          setLegalVersions(versions);
        }
      })
      .catch(() => {});
  }, []);

  const openDocViewer = async (type: 'terms_conditions' | 'privacy_policy') => {
    setLoadingDoc(true);
    try {
      const url = typeof window !== 'undefined' && window.location.port === '8080'
        ? `/api/store/legal/${type}`
        : `http://localhost:8080/api/store/legal/${type}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.activeVersion) {
        setViewingDoc({
          title: data.activeVersion.title || data.document?.title || 'Legal Policy',
          content: data.activeVersion.content || 'No content published.',
          version: data.activeVersion.version || '1.0',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!acceptedLegal) {
      setError('You must accept the Terms & Conditions and Privacy Policy to create an admin account.');
      return;
    }

    setIsLoading(true);

    try {
      const registerUrl = `http://${urls.auth.login.replace('admin-login', 'admin-register')}`;
      
      const res = await callApi(registerUrl, {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: 'admin',
          storeName: storeName || `${firstName}'s Store`,
          acceptedTerms: true,
          termsVersion: legalVersions.termsVersion,
          privacyVersion: legalVersions.privacyVersion,
        }),
      });

      setSuccess('Admin account created successfully! Signing you in...');

      // Attempt automatic sign-in
      try {
        const loginData = await callApi(`http://${urls.auth.login}`, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (loginData.token) {
          setAuth(loginData.token, loginData.sessionId, loginData.admin);
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('sessionId', loginData.sessionId || '');
          localStorage.setItem('admin', JSON.stringify(loginData.admin || {}));
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return;
        }
      } catch (loginErr) {
        // If automatic login doesn't complete, route to login page
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-8 relative z-10"
      >
        {/* Navigation Link back */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition">
            <span>&larr;</span> Back to Portal Overview
          </Link>
          <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition font-medium">
            {t('haveAccount')}
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-sm">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            {branding.appLogoUrl ? (
              <div className="mx-auto h-16 w-16 flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <img src={branding.appLogoUrl} alt={branding.appName} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg text-white">
                <Icons.PersonIcon className="w-7 h-7" />
              </div>
            )}
            <h2 className="mt-4 text-center text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {t('register')}
            </h2>
            <p className="mt-1 text-center text-xs text-gray-600 dark:text-gray-400">
              {branding.appName ? `${branding.appName} Merchant Platform` : t('registerSubtitle')}
            </p>
          </motion.div>

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-xs text-green-600 dark:text-green-400"
              >
                {success}
              </motion.div>
            )}

            {/* First and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Merchant"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.EnvelopeClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@yourbusiness.com"
                />
              </div>
            </div>

            {/* Store / Merchant Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Store / Brand Name (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.LayersIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Apex Global Outfitters"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.LockClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Icons.EyeOpenIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Icons.EyeClosedIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Legal Acceptance Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  required
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); openDocViewer('terms_conditions'); }}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Terms & Conditions (v{legalVersions.termsVersion})
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); openDocViewer('privacy_policy'); }}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Privacy Policy (v{legalVersions.privacyVersion})
                  </button>.
                  My consent will be permanently recorded in the governance audit trail.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !acceptedLegal}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                t('signUp')
              )}
            </motion.button>
          </form>

          {/* Footer note */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            {t('haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {t('signIn')}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Policy Preview Modal */}
      {(viewingDoc || loadingDoc) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {loadingDoc ? 'Loading Document...' : viewingDoc?.title}
                </h3>
                {viewingDoc && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-mono">
                    Version {viewingDoc.version}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Icons.Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {loadingDoc ? (
                <div className="py-12 text-center text-gray-400">Loading policy content...</div>
              ) : (
                viewingDoc?.content
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

