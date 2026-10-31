'use client';

import React, { useEffect, useState } from 'react';
import * as Icons from '@radix-ui/react-icons';

interface LegalDoc {
  id: string;
  type: string;
  title: string;
  description?: string;
  current_version: string;
  updated_at: string;
}

interface ActiveVersion {
  version: string;
  title: string;
  content: string;
  change_summary?: string;
  effective_date?: string;
}

export default function MerchantLegalPage() {
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [selectedType, setSelectedType] = useState<string>('terms_conditions');
  const [activeVersion, setActiveVersion] = useState<ActiveVersion | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [branding, setBranding] = useState<{ appName: string }>({ appName: 'Jequex Platform' });

  useEffect(() => {
    // Fetch branding
    const contactUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? '/api/store/settings/contact'
      : 'http://localhost:8080/api/store/settings/contact';

    fetch(contactUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data?.app_name || data?.appName) {
          setBranding({ appName: data.app_name || data.appName });
        }
      })
      .catch(() => {});

    // Fetch documents list
    const legalUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? '/api/store/legal'
      : 'http://localhost:8080/api/store/legal';

    fetch(legalUrl)
      .then((r) => r.json())
      .then((data) => {
        if (data?.documents) {
          setDocuments(data.documents);
          if (data.documents.length > 0) {
            setSelectedType(data.documents[0].type);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    setLoadingDoc(true);

    const docUrl = typeof window !== 'undefined' && window.location.port === '8080'
      ? `/api/store/legal/${selectedType}`
      : `http://localhost:8080/api/store/legal/${selectedType}`;

    fetch(docUrl)
      .then((r) => r.json())
      .then((data) => {
        setActiveVersion(data.activeVersion || null);
      })
      .catch(() => {
        setActiveVersion(null);
      })
      .finally(() => setLoadingDoc(false));
  }, [selectedType]);

  const selectedDoc = documents.find((d) => d.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Platform Legal & Policies
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review the active governing platform policies and terms published by {branding.appName} Super Admin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Policy list sidebar */}
        <div className="space-y-2">
          {loadingList ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading documents...</div>
          ) : (
            documents.map((doc) => {
              const isActive = doc.type === selectedType;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedType(doc.type)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{doc.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      v{doc.current_version}
                    </span>
                    <span className="text-[11px] text-gray-400">Active</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Policy content view */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
          {loadingDoc ? (
            <div className="py-20 text-center text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p>Fetching active policy content...</p>
            </div>
          ) : (
            <article className="space-y-6">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedDoc?.title || activeVersion?.title || 'Policy Document'}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Version {activeVersion?.version || selectedDoc?.current_version || '1.0'}
                  </span>
                </div>
                {activeVersion?.effective_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Effective Date: {new Date(activeVersion.effective_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {activeVersion?.change_summary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">Notice of Changes:</span> {activeVersion.change_summary}
                </div>
              )}

              <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                {activeVersion?.content || 'No published content currently available for this policy.'}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

