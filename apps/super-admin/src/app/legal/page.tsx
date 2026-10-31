'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';
import * as Icons from '@radix-ui/react-icons';

interface PolicyVersion {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  change_summary: string | null;
  effective_date: string;
  created_at: string;
  created_by_name: string | null;
  created_by_email: string | null;
  is_active: boolean;
}

const POLICY_TYPES = [
  { key: 'privacy_policy', label: 'Privacy Policy' },
  { key: 'terms_conditions', label: 'Terms & Conditions' },
  { key: 'cancellation_refund', label: 'Cancellation & Refund Policy' },
];

export default function LegalCMSPage() {
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState('privacy_policy');
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<PolicyVersion | null>(null);
  const [selectedHistoricalVersion, setSelectedHistoricalVersion] = useState<PolicyVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [formData, setFormData] = useState({
    version: '',
    title: '',
    content: '',
    changeSummary: '',
  });

  const fetchPolicyData = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/store/legal/${type}/versions`);
      const data = await res.json();
      const list: PolicyVersion[] = data.versions || [];
      setVersions(list);

      if (list.length > 0) {
        setActiveVersion(list[0]);
        setSelectedHistoricalVersion(list[0]);
      } else {
        setActiveVersion(null);
        setSelectedHistoricalVersion(null);
      }
    } catch (e) {
      toast.error('Failed to load policy versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyData(selectedType);
  }, [selectedType]);

  const openPublishModal = () => {
    const currentVer = activeVersion ? activeVersion.version : '1.0';
    const parts = currentVer.split('.');
    const nextVer = parts.length === 2 ? `${parts[0]}.${parseInt(parts[1]) + 1}` : '1.1';

    setFormData({
      version: nextVer,
      title: activeVersion?.title || POLICY_TYPES.find((p) => p.key === selectedType)?.label || '',
      content: activeVersion?.content || '',
      changeSummary: '',
    });
    setShowPublishModal(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        version: formData.version,
        title: formData.title,
        content: formData.content,
        changeSummary: formData.changeSummary,
        createdById: user?.id,
        createdByName: `${user?.firstName || 'Super'} ${user?.lastName || 'Admin'}`,
        createdByEmail: user?.email || 'superadmin@ecommerce.com',
      };

      const res = await fetch(`/api/store/legal/${selectedType}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish legal version');
      }

      toast.success(`Published version ${formData.version} to audit trail`);
      setShowPublishModal(false);
      fetchPolicyData(selectedType);
    } catch (err: any) {
      toast.error(err.message || 'Publishing failed');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Legal Policies CMS & Version Audit History</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Full Audit Trail
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Super Admins manage legal frameworks. Every version change is immutably logged with author, timestamp, and change notes.
          </p>
        </div>

        {/* Policy Selector Tabs */}
        <div className="flex border-b border-slate-800 space-x-3">
          {POLICY_TYPES.map((pt) => {
            const isActive = selectedType === pt.key;
            return (
              <button
                key={pt.key}
                onClick={() => setSelectedType(pt.key)}
                className={`pb-3 px-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                  isActive
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{pt.label}</span>
                {activeVersion && selectedType === pt.key && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                    v{activeVersion.version}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Grid: Audit Trail vs Content Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Version Audit Log List (Left Column) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Version History</h2>
                <p className="text-[11px] text-slate-400">Chronological change log</p>
              </div>
              <button
                onClick={openPublishModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                <Icons.PlusIcon className="w-3.5 h-3.5" />
                Publish New
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading version history...</p>
            ) : versions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No versions recorded yet.</p>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[550px] pr-1">
                {versions.map((v, index) => {
                  const isSelected = selectedHistoricalVersion?.id === v.id;
                  const isLatest = index === 0;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedHistoricalVersion(v)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">v{v.version}</span>
                        {isLatest && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            Current Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-1">{v.change_summary || 'No summary provided'}</p>
                      
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(v.created_at).toLocaleString()}</span>
                        <span className="text-indigo-400 truncate max-w-[110px]" title={v.created_by_name || 'Admin'}>
                          {v.created_by_name || 'Admin'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Version Details & Markdown Preview (Right 2 Columns) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            {selectedHistoricalVersion ? (
              <>
                <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{selectedHistoricalVersion.title}</h2>
                      <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                        v{selectedHistoricalVersion.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span>Changed on: <strong className="text-white">{new Date(selectedHistoricalVersion.created_at).toLocaleString()}</strong></span>
                      <span>By: <strong className="text-indigo-400">{selectedHistoricalVersion.created_by_name} ({selectedHistoricalVersion.created_by_email})</strong></span>
                    </div>
                  </div>
                </div>

                {selectedHistoricalVersion.change_summary && (
                  <div className="my-4 p-3 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-300">
                    <strong className="text-slate-400 block uppercase text-[10px] mb-1">Reason / Change Summary</strong>
                    {selectedHistoricalVersion.change_summary}
                  </div>
                )}

                {/* Content Display */}
                <div className="flex-1 mt-4 p-5 bg-slate-950/60 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-y-auto max-h-[500px] whitespace-pre-wrap leading-relaxed">
                  {selectedHistoricalVersion.content}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a version from the audit history on the left to preview its content.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Publish New Legal Version */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Publish New Version</h2>
                  <p className="text-xs text-slate-400">Increments document version and writes immutable audit record.</p>
                </div>
                <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-white">
                  <Icons.Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePublish} className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Version #</label>
                    <input
                      type="text"
                      required
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      placeholder="e.g. 1.1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Change Summary (Audit Reason)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.changeSummary}
                    onChange={(e) => setFormData({ ...formData, changeSummary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="e.g. Added section 4 regarding user data privacy and cookie controls."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Document Content (Markdown / Text)
                  </label>
                  <textarea
                    rows={12}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Signing author: <strong className="text-white">{user?.email}</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPublishModal(false)}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition"
                    >
                      Publish Version Live
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

