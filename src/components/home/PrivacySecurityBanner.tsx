import React from 'react';
import { ShieldCheck, ServerOff, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const PrivacySecurityBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-br from-blue-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-lg">
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-blue-300">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('privacy.badge', 'Architectural Privacy Guarantee')}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
              {t('privacy.title', 'Your Confidential Documents Never Leave Your Computer')}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t('privacy.desc', 'Unlike traditional PDF web services that upload your legal agreements, tax forms, and medical records to remote cloud servers, uLikePDF executes all PDF compilation, splitting, and rendering directly within your web browser’s JavaScript memory.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">{t('privacy.point1.title', 'No Remote Servers')}</strong>
                  {t('privacy.point1.desc', 'No external server receives your document payload or logs file contents.')}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">{t('privacy.point2.title', 'Transient RAM Only')}</strong>
                  {t('privacy.point2.desc', 'Memory buffers are released automatically when you close or refresh the tab.')}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">{t('privacy.point3.title', 'Zero Data Mining')}</strong>
                  {t('privacy.point3.desc', 'We do not extract text for ad targeting or training AI models.')}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block font-semibold mb-0.5">{t('privacy.point4.title', 'Enterprise Risk Free')}</strong>
                  {t('privacy.point4.desc', 'Because zero document data is transmitted, enterprise data breach risk is eliminated.')}
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                to="/privacy"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {t('privacy.btn_read', 'Read Privacy Policy')}
              </Link>
              <Link
                to="/about"
                className="text-xs text-slate-300 hover:text-white underline transition-colors"
              >
                {t('privacy.btn_about', 'Learn How We Built It')}
              </Link>
            </div>
          </div>

          {/* Background Graphic Elements */}
          <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
            <ServerOff className="w-96 h-96 text-blue-300" />
          </div>

        </div>
      </div>
    </section>
  );
};
