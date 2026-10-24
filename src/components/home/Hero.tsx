import React, { useState } from 'react';
import { Search, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_TOOLS } from '../../config/tools';
import { useLanguage } from '../../context/LanguageContext';

interface HeroProps {
  onSearchChange?: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearchChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = ALL_TOOLS.find(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      navigate(match.path);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/60 dark:border-slate-800">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-radial from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white" style={{ textWrap: 'balance' }}>
            {t('hero.headline', 'All Your PDF Tools in One Place')}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t('hero.subtitle', 'Merge, split, compress, convert, rotate, and edit your PDF files quickly and easily. All processing runs 100% locally in your browser with complete privacy.')}
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder={t('hero.search_placeholder', 'Search tools: Merge, Split, Compress, JPG to PDF, Watermark...')}
                className="w-full pl-12 pr-28 py-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{t('hero.search_button', 'Find')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Trust Metric Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('hero.trust.privacy', '100% In-Browser Privacy')}</span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{t('hero.trust.speed', 'Zero Wait In Queue')}</span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t('hero.trust.security', 'No Cloud File Uploads')}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
