import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_TOOLS, TOOL_CATEGORIES } from '../config/tools';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AllToolsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  const getCategoryLabel = (catId: string, fallback: string) => {
    switch (catId) {
      case 'organize': return t('cat.organize', fallback);
      case 'optimize': return t('cat.optimize', fallback);
      case 'convert': return t('cat.convert', fallback);
      case 'edit': return t('cat.edit', fallback);
      case 'security': return t('cat.security', fallback);
      default: return fallback;
    }
  };

  const getCategoryDesc = (catId: string, fallback: string) => {
    switch (catId) {
      case 'organize': return t('cat.organize_desc', fallback);
      case 'optimize': return t('cat.optimize_desc', fallback);
      case 'convert': return t('cat.convert_desc', fallback);
      case 'edit': return t('cat.edit_desc', fallback);
      case 'security': return t('cat.security_desc', fallback);
      default: return fallback;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ label: t('nav.all_tools', 'All PDF Tools') }]} />

      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('nav.popular_badge', 'All 42 Online PDF Tools (Free Pro Unlocked)')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          {t('hero.subtitle', 'Everything you need to merge, split, compress, convert, rotate, and edit PDF documents without subscription fees or server uploads.')}
        </p>

        {/* Filter input */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('hero.search_placeholder', 'Filter tools by keyword...')}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Grouped by Category */}
      <div className="space-y-12">
        {TOOL_CATEGORIES.map((category) => {
          const toolsInCat = ALL_TOOLS.filter(
            t => t.category === category.id && (
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              t.shortDesc.toLowerCase().includes(search.toLowerCase())
            )
          );

          if (toolsInCat.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getCategoryLabel(category.id, category.label)}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {getCategoryDesc(category.id, category.description)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {toolsInCat.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 uppercase">
                          {tool.outputFormat}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tool.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 uppercase tracking-wider">
                              {tool.badge}
                            </span>
                          )}
                          {tool.isPopular && (
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              {t('cat.popular', 'Popular')}
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {tool.shortDesc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span>{t('tools.launch', 'Launch Tool')}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
