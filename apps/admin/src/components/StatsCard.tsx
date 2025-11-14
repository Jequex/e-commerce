'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from '@radix-ui/react-icons';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: keyof typeof Icons;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  delay?: number;
}

const colorVariants = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500 to-green-600',
    text: 'text-green-600',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 to-red-600',
    text: 'text-red-600',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  delay = 0,
}) => {
  const Icon = Icons[icon as keyof typeof Icons];
  const colorClasses = colorVariants[color];

  // Fallback if icon doesn't exist
  if (!Icon) {
    console.warn(`Icon ${icon} not found in Radix UI icons`);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border ${colorClasses.border} hover:shadow-lg transition-shadow duration-300`}
      >
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${colorClasses.lightBg}`}>
              <div className={`w-6 h-6 rounded ${colorClasses.text.replace('text-', 'bg-')}`} />
            </div>
            {change && (
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  change.type === 'increase'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}
              >
                {change.type === 'increase' ? (
                  <Icons.ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <Icons.ArrowDownIcon className="w-3 h-3" />
                )}
                <span>{Math.abs(change.value)}%</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.2 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {value}
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border ${colorClasses.border} hover:shadow-lg transition-shadow duration-300`}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="currentColor"
        >
          <circle cx="50" cy="50" r="40" />
        </svg>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses.lightBg}`}>
            <Icon className={`w-6 h-6 ${colorClasses.text}`} />
          </div>
          {change && (
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                change.type === 'increase'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}
            >
              {change.type === 'increase' ? (
                <Icons.ArrowUpIcon className="w-3 h-3" />
              ) : (
                <Icons.ArrowDownIcon className="w-3 h-3" />
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;