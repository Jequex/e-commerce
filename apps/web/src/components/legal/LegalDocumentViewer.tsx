'use client';

import React, { useEffect, useState } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { Link } from '@/i18n/navigation';

interface LegalDocViewerProps {
  documentType: 'terms_conditions' | 'privacy_policy' | 'cancellation_refund' | 'cookie_policy';
}

interface ActiveVersion {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  change_summary?: string;
  effective_date?: string;
  created_at: string;
}

interface DocumentInfo {
  id: string;
  type: string;
  title: string;
  description?: string;
  current_version: string;
  updated_at: string;
}

const POLICY_TABS = [
  { type: 'terms_conditions', label: 'Terms & Conditions', href: '/terms' },
  { type: 'privacy_policy', label: 'Privacy Policy', href: '/privacy' },
  { type: 'cancellation_refund', label: 'Cancellation & Refund', href: '/cancellation-refund' },
  { type: 'cookie_policy', label: 'Cookie Policy', href: '/cookies' },
];

export default function LegalDocumentViewer({ documentType }: LegalDocViewerProps) {
  const [doc, setDoc] = useState<DocumentInfo | null>(null);
  const [activeVersion, setActiveVersion] = useState<ActiveVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appName, setAppName] = useState('Jequex E-Commerce');

  useEffect(() => {
    // Fetch branding app name
    fetch('/api/store/settings/contact')
      .then((r) => r.json())
      .then((data) => {
        if (data?.app_name || data?.appName) {
          setAppName(data.app_name || data.appName);
        }
      })
      .catch(() => {});

    // Fetch active legal document version
    setLoading(true);
    fetch(`/api/store/legal/${documentType}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Policy not found');
        return res.json();
      })
      .then((data) => {
        setDoc(data.document || null);
        setActiveVersion(data.activeVersion || null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load policy document');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [documentType]);

  const defaultTitles: Record<string, string> = {
    terms_conditions: 'Terms and Conditions',
    privacy_policy: 'Privacy Policy',
    cancellation_refund: 'Cancellation and Refund Policy',
    cookie_policy: 'Cookie Policy',
  };

  const title = doc?.title || defaultTitles[documentType] || 'Legal Policy';
  const version = activeVersion?.version || doc?.current_version || '1.0';
  const effectiveDate = activeVersion?.effective_date || activeVersion?.created_at || doc?.updated_at;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Policy navigation tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-8">
          {POLICY_TABS.map((tab) => {
            const isActive = tab.type === documentType;
            return (
              <Link
                key={tab.type}
                href={tab.href as any}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p>Loading document from compliance repository...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">
              <p className="font-semibold text-lg">{error}</p>
              <p className="text-sm text-gray-500 mt-2">Please try again or contact support.</p>
            </div>
          ) : (
            <article className="prose max-w-none text-gray-800">
              <div className="border-b border-gray-100 pb-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-0">
                    {title}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Version {version} • Active
                  </span>
                </div>
                {effectiveDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Effective Date: {new Date(effectiveDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Issued by {appName} Legal & Compliance Department
                </p>
              </div>

              {activeVersion?.change_summary && (
                <div className="mb-6 bg-blue-50/60 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm text-blue-900">
                  <span className="font-semibold">Recent Update Summary:</span> {activeVersion.change_summary}
                </div>
              )}

              {activeVersion?.content ? (
                <div className="whitespace-pre-wrap leading-relaxed text-gray-700 text-sm sm:text-base space-y-4">
                  {activeVersion.content}
                </div>
              ) : (
                <p className="text-gray-500 italic">No published content available for this version.</p>
              )}
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

