import React from 'react';
import { Upload, Sliders, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: '01',
      title: t('how.step1.title', 'Select or Drop Your PDF'),
      description: t('how.step1.desc', 'Choose one or multiple PDF documents or images from your desktop or phone. Files remain safely in your browser memory.'),
      icon: Upload,
    },
    {
      number: '02',
      title: t('how.step2.title', 'Configure Your Preferences'),
      description: t('how.step2.desc', 'Rotate, reorder pages, specify compression strength, choose watermark text, or adjust page numbers in our live preview.'),
      icon: Sliders,
    },
    {
      number: '03',
      title: t('how.step3.title', 'Download In An Instant'),
      description: t('how.step3.desc', 'Your new document is generated locally on your computer with near-zero latency. Click download and you are done.'),
      icon: Download,
    },
  ];

  return (
    <section className="py-16 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('how.title', 'How uLikePDF Works')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('how.subtitle', 'Three simple steps to manage your documents without complex software or subscriptions.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="font-mono text-xl font-bold text-slate-300 dark:text-slate-700">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
