import React from 'react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BRAND } from '../config/brand';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Disclaimer' }]} />

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Website Disclaimer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last Updated: October 2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            The tools and utilities provided on {BRAND.name} are intended for standard general document management. Users must maintain primary backup copies of original documents before undertaking destructive operations such as page deletions or raster compression.
          </p>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Legal or Compliance Advice</h2>
        <p>
          The information and features available on {BRAND.name} do not constitute legal, tax, medical, or regulatory compliance advice. Users operating in regulated sectors (such as healthcare under HIPAA or finance under SEC/FINRA guidelines) should independently verify whether client-side browser tools satisfy their specific organizational records management mandates.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Guarantee of Complete Security or Availability</h2>
        <p>
          While {BRAND.name} processes files client-side without transmitting document bytes to our servers, we cannot control vulnerabilities on your local workstation, malware infections, hostile browser extensions, or physical device security. Furthermore, we make no promise of 100% uninterrupted uptime or permanent availability of any individual tool.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">PDF Specification Variability</h2>
        <p>
          The Adobe PDF specification encompasses numerous versions, compression encodings (e.g., CCITT Fax, JBIG2, Flate), and proprietary DRM wrappers. While our libraries adhere strictly to standard ISO 32000 specifications, certain non-standard or severely degraded documents may fail to parse or may exhibit visual rendering differences.
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p><strong>Entity Name:</strong> {BRAND.contact.addressPlaceholder}</p>
          <p><strong>Contact Email:</strong> {BRAND.contact.emailPlaceholder}</p>
        </div>
      </div>
    </div>
  );
};
