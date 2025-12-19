'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';
import { useAuthStore } from '@/stores/use-auth-store';
import { toast } from 'react-toastify';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: any) => void;
  storeId: string;
}

export default function AddStaffModal({
  isOpen,
  onClose,
  onSuccess,
  storeId,
}: AddStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const t = useTranslations('staff');
  const common = useTranslations('common');
  const { token } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      // Fetch available roles for the store
      const data = await callApi(`http://localhost:3007/api/v1/roles`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
      toast.error('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const staffData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string | null,
      firstName: formData.get('firstName') as string | null,
      lastName: formData.get('lastName') as string | null,
      userRole: 'admin',
      roleId: formData.get('roleId') as string,
      salary: formData.get('salary') ? formData.get('salary') as string : '',
      commission: formData.get('commission') ? formData.get('commission') as string : '',
    };

    try {
      const url = `http://${urls.staff.addStaff.replace(':id', storeId)}`;
      const newStaff = await callApi(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
      });

      toast.success(t('addSuccess'));
      onSuccess(newStaff.staff);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add staff member';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('addStaff')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icons.Cross2Icon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {common('email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="staff@example.com"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the email of the user you want to add as staff
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {common('password')}
            </label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter a password (optional)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If left blank, a password setup email will be sent to the staff member
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('firstName')}
            </label>
            <input
              type="text"
              name="firstName"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('lastName')}
            </label>
            <input
              type="text"
              name="lastName"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Last Name"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('role')} <span className="text-red-500">*</span>
            </label>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <select
                name="roleId"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('salary')}
            </label>
            <input
              type="number"
              name="salary"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
          </div>

          {/* Commission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('commission')}
            </label>
            <input
              type="number"
              name="commission"
              step="0.01"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Commission percentage (0-100%)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {common('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingRoles}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{common('saving')}</span>
                </>
              ) : (
                <>
                  <Icons.PlusIcon className="w-4 h-4" />
                  <span>{t('addStaff')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
