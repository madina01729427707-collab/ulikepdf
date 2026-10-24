import React from 'react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BRAND } from '../config/brand';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last Updated: October 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using {BRAND.name} (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the website.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Permitted Use</h2>
        <p>
          The Service is provided free of charge for lawful personal, educational, and commercial purposes. You agree not to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Use the Service to process unlawful, defamatory, infringing, or malicious content.</li>
          <li>Attempt to disrupt, overload, or reverse-engineer the underlying web delivery infrastructure.</li>
          <li>Use automated scrapers or bots that degrade website responsiveness for other users.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Intellectual Property Rights</h2>
        <p>
          You retain 100% of the intellectual property rights and title to any documents, text, or graphics you load into {BRAND.name}. We claim zero ownership or licensing rights over your documents.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Disclaimer of Warranties</h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not warrant that the Service will meet your specific requirements, will be uninterrupted, error-free, or compatible with every possible corrupted or non-standard PDF file.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, {BRAND.name} and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use or inability to use the Service, including data loss or corruption. Always keep backup copies of your files.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p><strong>Entity Name:</strong> {BRAND.contact.addressPlaceholder}</p>
          <p><strong>Contact Email:</strong> {BRAND.contact.emailPlaceholder}</p>
        </div>
      </div>
    </div>
  );
};
