import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();

  const faqs = [
    {
      question: t('faq.q1', 'Are my PDF files uploaded to an external server?'),
      answer: t('faq.a1', 'No. All PDF processing (merging, splitting, compressing, converting, and editing) takes place exclusively inside your web browser via client-side WebAssembly and JavaScript engines. Your files never touch our servers or any cloud storage bucket.')
    },
    {
      question: t('faq.q2', 'Is there a limit on file size or the number of files?'),
      answer: t('faq.a2', 'Because processing utilizes your computer’s local RAM and browser memory, we comfortably support documents up to 100MB per file and batch uploads of up to 40 images or 30 PDFs.')
    },
    {
      question: t('faq.q3', 'How does PDF compression work in the browser?'),
      answer: t('faq.a3', 'uLikePDF optimizes your document by downsampling oversized embedded raster photographs and re-encoding them with high-efficiency JPEG compression algorithms. We calculate the exact measured byte savings without fake metrics.')
    },
    {
      question: t('faq.q4', 'Can I use uLikePDF on mobile devices or tablets?'),
      answer: t('faq.a4', 'Yes. uLikePDF is fully responsive and optimized for touchscreens on iOS Safari, Android Chrome, and modern tablet browsers. No apps or accounts needed.')
    },
    {
      question: t('faq.q5', 'Is uLikePDF free for commercial and personal use?'),
      answer: t('faq.a5', 'Yes, uLikePDF is completely free. There are no paywalls, hidden subscription charges, or watermarks added to your exported files.')
    }
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 border-t border-slate-200/60 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('faq.title', 'Frequently Asked Questions')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('faq.subtitle', 'Everything you need to know about our browser-based PDF toolkit.')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
