import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { ShieldCheck, Lock, Cpu, Globe, ChevronDown, Check, X, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { language, setLanguage, languages, currentLanguageOption, t } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [langQuery, setLangQuery] = useState('');

  const filteredLanguages = languages.filter((l) => {
    if (!langQuery.trim()) return true;
    const q = langQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Real Privacy Assurance Banner */}
        <div className="mb-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('footer.client_engine_title', '100% Client-Side Engine')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('footer.client_engine_desc', 'Your files are processed directly on your local device CPU. Document bytes never leave your web browser.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('footer.zero_retention_title', 'Zero Server Retention')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('footer.zero_retention_desc', 'No cloud uploads, no database storage, and no tracking cookies. Memory buffers are immediately cleared after download.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('footer.enterprise_title', 'Enterprise Standards')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('footer.enterprise_desc', 'Engineered with Mozilla PDF.js & pdf-lib standard conformance. Free and unrestricted for individual and corporate use.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Column with Official 3D Logo */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white group">
              <img 
                src="/assets/aistudio/ulikepdf_63161e18.png" 
                alt="uLikePDF Logo" 
                className="w-8 h-8 object-contain drop-shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span className="font-extrabold text-slate-900 dark:text-white">
                {BRAND.prefix}<span className="text-blue-600 dark:text-blue-500">{BRAND.suffix}</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {t('footer.tagline', 'Fast, high-fidelity PDF manipulation tools running entirely in modern web browsers. Designed for professionals, students, and businesses worldwide.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{BRAND.stats.browserProcessed}</span>
              <span aria-hidden="true">·</span>
              <span>{BRAND.stats.serverStorage}</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              {t('footer.popular_tools', 'Popular Tools')}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/merge-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.merge', 'Merge PDF')}</Link></li>
              <li><Link to="/split-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.split', 'Split PDF')}</Link></li>
              <li><Link to="/compress-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('nav.compress', 'Compress PDF')}</Link></li>
              <li><Link to="/bates-numbering-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Bates Numbering</Link></li>
              <li><Link to="/flatten-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Flatten PDF</Link></li>
            </ul>
          </div>

          {/* More Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              {t('footer.organize_edit', 'Organize & Edit')}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/rotate-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Rotate PDF</Link></li>
              <li><Link to="/grayscale-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Grayscale PDF</Link></li>
              <li><Link to="/split-in-half" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Split in Half</Link></li>
              <li><Link to="/header-footer-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Header & Footer</Link></li>
              <li><Link to="/ocr-pdf" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">OCR PDF</Link></li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              {t('footer.legal_trust', 'Legal & Trust')}
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('footer.about', 'About uLikePDF')}</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('footer.contact', 'Contact Us')}</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('footer.privacy', 'Privacy Policy')}</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('footer.terms', 'Terms of Service')}</Link></li>
              <li><Link to="/disclaimer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('footer.disclaimer', 'Disclaimer')}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Compact Language Selector */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {currentYear} {BRAND.name}. {t('footer.rights', 'All rights reserved.')}
          </div>

          <div className="flex items-center gap-1.5">
            <span>{t('footer.built_for', 'Built for speed, accuracy & privacy')}</span>
            <span aria-hidden="true">·</span>
            <span>Hosted on ulikepdf.com</span>
          </div>

          {/* Compact Bottom Language Selector with Flag */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Change Language / ভাষা পরিবর্তন করুন"
              aria-label="Change Language"
            >
              <span className="text-base leading-none" role="img" aria-label={currentLanguageOption.name}>
                {currentLanguageOption.flag}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentLanguageOption.nativeName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

      </div>

      {/* Compact Language Selection Modal with Flags */}
      {langModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLangModalOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3.5 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Language / ভাষা নির্বাচন করুন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLangModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search language / ভাষা অনুসন্ধান..."
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Language Grid with Flags */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
              {filteredLanguages.map((l) => {
                const isSelected = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setLangModalOpen(false);
                      setLangQuery('');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between gap-2 group cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-1 ring-blue-600'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl leading-none shrink-0" role="img" aria-label={l.name}>
                        {l.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {l.nativeName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {l.name}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Status */}
            <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>27 Languages Supported</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Active: {currentLanguageOption.flag} {currentLanguageOption.nativeName}
              </span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

