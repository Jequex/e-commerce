'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/stores/use-page-store';

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
  roleName: string;
}

interface ViewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
}

export default function ViewStaffModal({ isOpen, onClose, staff }: ViewStaffModalProps) {
  const t = useTranslations('staff');
  const common = useTranslations('common');
  const { userStores } = usePageStore.getState();

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
                {t('viewStaff')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Icons.Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('personalInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('firstName')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.user?.firstName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('lastName')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.user?.lastName || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('email')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.user?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('employmentDetails')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('role')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.roleName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('store')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {userStores.find(store => store.storeId == staff.storeId)?.storeName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('salary')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.salary ? `$${parseFloat(staff.salary).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('commission')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {staff.commission ? `${parseFloat(staff.commission).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('hiredAt')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {new Date(staff.hiredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {common('status')}
                    </label>
                    <p className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.isActive 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                          : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                      }`}>
                        {staff.isActive ? t('active') : t('inactive')}
                      </span>
                    </p>
                  </div>
                  {staff.terminatedAt && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('terminatedAt')}
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                        {new Date(staff.terminatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {common('close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
