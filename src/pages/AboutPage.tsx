import React from 'react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BRAND } from '../config/brand';
import { Cpu, ShieldCheck, Zap, ServerOff } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About {BRAND.name}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          {BRAND.name} was created to solve a fundamental problem in web productivity: why should personal documents, financial files, and confidential PDFs be uploaded to unknown third-party servers just to rotate a page or combine two files?
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
          <h3 className="text-base font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Our Technical Philosophy: Local-First In-Browser Computation
          </h3>
          <p className="text-xs sm:text-sm text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
            Every core utility on {BRAND.name} is powered by client-side WebAssembly, HTML5 canvas rendering, and modern browser standards (including Mozilla PDF.js and pdf-lib). When you select a document, the byte stream is processed inside your local machine’s memory. Document bytes are never uploaded to our servers or saved in a cloud database.
          </p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4">
          Who Operates {BRAND.name}?
        </h2>
        <p>
          {BRAND.name} is maintained by an independent engineering team focused on high-performance web tooling and privacy-centric web applications.
        </p>
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p><strong>Operating Entity:</strong> {BRAND.contact.addressPlaceholder}</p>
          <p><strong>Primary Contact:</strong> {BRAND.contact.emailPlaceholder}</p>
          <p><strong>Hosting Infrastructure:</strong> Firebase Hosting (Global Content Delivery Network)</p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white pt-4">
          Realistic Limitations & Document Suitability
        </h2>
        <p>
          While client-side processing eliminates server transmission risks, users should understand that browser memory is governed by your device hardware. Large documents containing thousands of pages or gigabytes of uncompressed scan data may encounter browser memory limits.
        </p>
        <p>
          Furthermore, while we adhere to open ISO PDF standards, not every proprietary encrypted or non-standard stream from obscure third-party PDF generators can be guaranteed compatible. We recommend keeping backup copies of any critical original files before processing.
        </p>
      </div>
    </div>
  );
};
