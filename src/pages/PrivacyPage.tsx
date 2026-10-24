import React from 'react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BRAND } from '../config/brand';
import { ShieldCheck, HardDrive, Lock } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last Updated: October 2026 · Effective Date: October 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Core Privacy Principle: Client-Side Execution
          </p>
          <p>
            {BRAND.name} is engineered on a "Zero-Transmission" premise. All document operations (merging, splitting, compressing, rasterizing, and editing) execute entirely on your device's web browser. Your file contents, filenames, and metadata are never uploaded to our servers, stored in databases, or transferred to third parties.
          </p>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          1. Information We Do Not Collect
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Document Content:</strong> We do not receive, inspect, log, or store the contents of your PDF or image files.</li>
          <li><strong>File Identifiers:</strong> We do not log filenames, page counts, or file sizes to external databases.</li>
          <li><strong>User Profiles:</strong> We do not require registration, login, email addresses, or payment credentials to use standard tools.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          2. Temporary In-Memory Data Flow
        </h2>
        <p>
          When you select a document or image, your web browser stores the file in temporary browser memory (RAM) utilizing JavaScript typed arrays and HTML5 Canvas API elements. Once you finish processing or navigate away/refresh the page, this temporary memory is automatically reclaimed by your operating system and browser garbage collector.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          3. Hosting and CDN Logging
        </h2>
        <p>
          {BRAND.name} is delivered via Firebase Hosting / Google Cloud CDN. Like virtually all web servers, standard non-identifying HTTP request headers (IP address, browser user-agent, requested static asset URL) may be logged ephemerally by the CDN solely for network routing, DDoS mitigation, and error telemetry. None of these network logs contain your processed document contents.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          4. Local Storage Usage
        </h2>
        <p>
          We use browser <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code> strictly to store your interface theme preference (<code className="text-blue-600 font-mono text-xs">pdfswift_theme: 'light' | 'dark'</code>). No tracking cookies, ad retargeting scripts, or cross-site fingerprinting mechanisms are utilized.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          5. Advertising & Third-Party Cookies (Google AdSense)
        </h2>
        <p>
          We may partner with third-party advertising networks, including Google AdSense, to serve advertisements when you visit our website. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
        </p>
        <p>
          Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Ads Settings</a>. Alternatively, you can opt out of third-party vendors' use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">aboutads.info</a>.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">
          6. Contacting the Site Operator
        </h2>
        <p>
          For privacy inquiries or compliance questions, please contact:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p><strong>Entity:</strong> {BRAND.contact.addressPlaceholder}</p>
          <p><strong>Privacy Contact:</strong> {BRAND.contact.emailPlaceholder}</p>
        </div>
      </div>
    </div>
  );
};
