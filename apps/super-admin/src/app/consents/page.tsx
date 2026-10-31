'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import toast from 'react-hot-toast';

interface LegalConsent {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  documentType: string;
  versionNumber: string;
  acceptedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export default function ConsentsAuditPage() {
  const [consents, setConsents] = useState<LegalConsent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/legal-consents');
      const data = await res.json();
      setConsents(data.consents || []);
    } catch (e) {
      toast.error('Failed to load legal consents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Legal Consent Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified proof of legal terms acceptance logged at account creation (customers and staff).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading audit records...</div>
          ) : consents.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No consent records logged yet. New user registrations will automatically log acceptance events here.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">User Account</th>
                  <th className="px-6 py-4">Policy Document</th>
                  <th className="px-6 py-4 text-center">Version Accepted</th>
                  <th className="px-6 py-4">Accepted Timestamp</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {consents.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{c.userEmail || 'Anonymous User'}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-slate-200">
                        {c.documentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        v{c.versionNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(c.acceptedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {c.ipAddress || 'Unknown IP'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

