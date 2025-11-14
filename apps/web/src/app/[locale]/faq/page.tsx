'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, Footer } from '@/components/layout';


interface FAQItem {
  id: number;
  questionKey: string;
  answerKey: string;
  category: string;
}

export default function FAQPage() {
  const t = useTranslations('faq');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    { id: 1, questionKey: 'shipping.howLong', answerKey: 'shipping.howLongAnswer', category: 'shipping' },
    { id: 2, questionKey: 'shipping.cost', answerKey: 'shipping.costAnswer', category: 'shipping' },
    { id: 3, questionKey: 'shipping.tracking', answerKey: 'shipping.trackingAnswer', category: 'shipping' },
    { id: 4, questionKey: 'returns.policy', answerKey: 'returns.policyAnswer', category: 'returns' },
    { id: 5, questionKey: 'returns.howTo', answerKey: 'returns.howToAnswer', category: 'returns' },
    { id: 6, questionKey: 'returns.refund', answerKey: 'returns.refundAnswer', category: 'returns' },
    { id: 7, questionKey: 'orders.modify', answerKey: 'orders.modifyAnswer', category: 'orders' },
    { id: 8, questionKey: 'orders.cancel', answerKey: 'orders.cancelAnswer', category: 'orders' },
    { id: 9, questionKey: 'orders.status', answerKey: 'orders.statusAnswer', category: 'orders' },
    { id: 10, questionKey: 'payment.methods', answerKey: 'payment.methodsAnswer', category: 'payment' },
    { id: 11, questionKey: 'payment.security', answerKey: 'payment.securityAnswer', category: 'payment' },
    { id: 12, questionKey: 'account.create', answerKey: 'account.createAnswer', category: 'account' },
    { id: 13, questionKey: 'account.password', answerKey: 'account.passwordAnswer', category: 'account' },
  ];

  const categories = [
    { key: 'all', labelKey: 'categories.all' },
    { key: 'shipping', labelKey: 'categories.shipping' },
    { key: 'returns', labelKey: 'categories.returns' },
    { key: 'orders', labelKey: 'categories.orders' },
    { key: 'payment', labelKey: 'categories.payment' },
    { key: 'account', labelKey: 'categories.account' },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === selectedCategory);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar activeRoute="/faq" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('title')}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
              {t('subtitle')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                selectedCategory === category.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200 hover:shadow-md'
              }`}
            >
              {t(category.labelKey)}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item) => (
            <div
              key={item.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {t(item.questionKey)}
                </h3>
                {openItems.includes(item.id) ? (
                  <svg className="h-6 w-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {openItems.includes(item.id) && (
                <div className="px-8 pb-6 border-t border-gray-100">
                  <div className="pt-4 text-gray-600 leading-relaxed">
                    {t(item.answerKey)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('support.title')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('support.description')}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              {t('support.contactUs')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <Footer activeRoute="/faq" />
    </div>
  );
}