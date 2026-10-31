'use client';

import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import toast from 'react-hot-toast';

export default function SiteContactSettingsPage() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    appName: 'Jequex E-Commerce',
    appLogoUrl: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    businessHours: '',
    supportHours: '',
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialLinkedin: '',
    adminAppUrl: 'http://localhost:3006',
    updatedAt: '',
    updatedByName: '',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/store/settings/contact');
        const data = await res.json();
        setFormData({
          appName: data.app_name || data.appName || 'Jequex E-Commerce',
          appLogoUrl: data.app_logo_url || data.appLogoUrl || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postal_code || data.postalCode || '',
          country: data.country || '',
          businessHours: data.business_hours || data.businessHours || '',
          supportHours: data.support_hours || data.supportHours || '',
          socialFacebook: data.social_facebook || data.socialFacebook || '',
          socialTwitter: data.social_twitter || data.socialTwitter || '',
          socialInstagram: data.social_instagram || data.socialInstagram || '',
          socialLinkedin: data.social_linkedin || data.socialLinkedin || '',
          adminAppUrl: data.admin_app_url || data.adminAppUrl || 'http://localhost:3006',
          updatedAt: data.updated_at || '',
          updatedByName: data.updated_by_name || '',
        });
      } catch (e) {
        toast.error('Failed to load contact settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('files', file);

      const res = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      const logoUrl = data.url || (data.urls && data.urls[0]) || (data.files && data.files[0]?.url);
      if (logoUrl) {
        setFormData((prev) => ({ ...prev, appLogoUrl: logoUrl }));
        toast.success('App logo uploaded to local MinIO successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        updatedById: user?.id,
        updatedByName: `${user?.firstName || 'Super'} ${user?.lastName || 'Admin'} (${user?.email})`,
      };

      const res = await fetch('/api/store/settings/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      toast.success('Contact settings updated live across storefront & mobile app');
      setFormData((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        updatedByName: payload.updatedByName,
      }));
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Contact Page & Site Information CMS</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Configure official contact details, physical address, business hours, and social channels. These reflect dynamically on the web storefront and mobile customer app.
          </p>
        </div>

        {formData.updatedAt && (
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <span>Last updated on: <strong className="text-white">{new Date(formData.updatedAt).toLocaleString()}</strong></span>
            {formData.updatedByName && (
              <span>Updated by: <strong className="text-indigo-400">{formData.updatedByName}</strong></span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* App Branding & Logo */}
          <div className="pb-6 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">Application Branding & Identity</h2>
            <p className="text-xs text-slate-400 mb-4">
              Customize the platform name and official brand logo. This updates dynamically across the Web storefront, Mobile app, and Admin portals.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Jequex E-Commerce"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Displayed in navigation headers, footer, browser title, and mobile app screens.
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.appLogoUrl}
                    onChange={(e) => setFormData({ ...formData, appLogoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="http://localhost:8080/media/logo.png"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Upload Logo (MinIO Storage)
                </label>
                
                <div className="flex items-center gap-4">
                  {formData.appLogoUrl ? (
                    <div className="relative group w-20 h-20 bg-slate-900 border border-slate-700 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.appLogoUrl}
                        alt="App Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, appLogoUrl: '' })}
                        className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-xs font-bold">
                      No Logo
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className={`inline-block px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition ${
                      uploadingLogo ? 'opacity-50 pointer-events-none' : ''
                    }`}>
                      {uploadingLogo ? 'Uploading to MinIO...' : 'Choose Logo File'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Recommended: Transparent PNG, SVG, or WebP. Stored locally in MinIO bucket.
                    </p>
                  </div>
                </div>

                {formData.appName && (
                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Preview:</span>
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-700">
                      {formData.appLogoUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={formData.appLogoUrl} alt="" className="w-5 h-5 object-contain" />
                      )}
                      <span className="text-xs font-bold text-white">{formData.appName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Contact Details */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">Direct Communication</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Customer Support Phone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="+1 (800) 555-0199"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Official Support Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="support@jequex.com"
                />
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">Physical Address & Headquarters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="123 Commerce Boulevard, Suite 500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">State / Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="94105"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Availability & Hours */}
          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">Hours of Operation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Standard Office / Business Hours</label>
                <input
                  type="text"
                  value={formData.businessHours}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="Mon - Fri: 9:00 AM - 6:00 PM EST"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Helpdesk Support Hours</label>
                <input
                  type="text"
                  value={formData.supportHours}
                  onChange={(e) => setFormData({ ...formData, supportHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="24/7 Priority Support"
                />
              </div>
            </div>
          </div>

          {/* Admin App & Merchant Portal URL */}
          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">Admin Portal Integration</h2>
            <p className="text-xs text-slate-400 mb-4">Set the destination URL for the Admin / Merchant Portal. This link is dynamically consumed and rendered in the customer application footer.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Admin / Merchant Portal URL</label>
              <input
                type="url"
                value={formData.adminAppUrl}
                onChange={(e) => setFormData({ ...formData, adminAppUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                placeholder="http://localhost:3006"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: http://localhost:3006. In production, set to your production admin domain (e.g. https://admin.jequex.com).</span>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">Social Media Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Facebook URL</label>
                <input
                  type="url"
                  value={formData.socialFacebook}
                  onChange={(e) => setFormData({ ...formData, socialFacebook: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="https://facebook.com/your-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Twitter / X URL</label>
                <input
                  type="url"
                  value={formData.socialTwitter}
                  onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="https://x.com/your-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={formData.socialInstagram}
                  onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="https://instagram.com/your-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.socialLinkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinkedin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  placeholder="https://linkedin.com/company/your-brand"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Publishing Changes...' : 'Save & Publish Live'}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}

