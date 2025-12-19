'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import callApi from '@/api-calls/callApi';
import urls from '@/api-calls/urls.json';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Store {
  id: string;
  name: string;
  category: string | null;
}

interface StaffMember {
  id: string;
  userId: string;
  roleId: string;
  storeId: string;
  salary: string | null;
  commission: string | null;
  isActive: boolean;
  hiredAt: string;
  terminatedAt: string | null;
  user?: User;
  role: Role;
  store: Store;
}

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: StaffMember | null;
  storeId: string;
}

export default function EditStaffModal({ isOpen, onClose, onSuccess, staff, storeId }: EditStaffModalProps) {
  const t = useTranslations('staff');
  const common = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    roleId: '',
    salary: '',
    commission: '',
    isActive: true,
  });

  // Fetch roles on mount
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  // Set form data when staff changes
  useEffect(() => {
    if (staff) {
      setFormData({
        roleId: staff.roleId,
        salary: staff.salary || '',
        commission: staff.commission || '',
        isActive: staff.isActive,
      });
    }
  }, [staff]);

  const fetchRoles = async () => {
    try {
      const response = await callApi('http://localhost:3007/api/v1/roles');
      if (!response.roles) throw new Error('Failed to fetch roles');
      
      setRoles(response.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error(t('failedToLoadRoles'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!staff) return;

    // Validate required fields
    if (!formData.roleId || !formData.salary || !formData.commission) {
      toast.error(common('fillAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = `http://${urls.staff.update.replace(':storeId', storeId).replace(':staffId', staff.id)}`;
      
      const response = await callApi(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          roleId: formData.roleId,
          salary: formData.salary,
          commission: formData.commission,
          isActive: formData.isActive,
        }),
      });

      if (response) {
        toast.success(t('staffUpdated'));
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to update staff');
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.message || t('failedToUpdateStaff'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('editStaff')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Icons.Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Staff Info (Read-only) */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('staffMember')}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {staff.user?.firstName || ''} {staff.user?.lastName || ''} ({staff.user?.email || 'N/A'})
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('role')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={isLoading}
                >
                  <option value="">{t('selectRole')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary & Commission */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('salary')} ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('commission')} (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('activeStatus')}
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {common('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Icons.UpdateIcon className="w-4 h-4 animate-spin" />
                  )}
                  <span>{isLoading ? common('saving') : common('save')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
