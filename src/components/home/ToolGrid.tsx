import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Combine, 
  Split, 
  Minimize2, 
  Image as ImageIcon, 
  FileImage, 
  RotateCw, 
  LayoutGrid, 
  Trash2, 
  Copy, 
  ArrowUpDown, 
  Hash, 
  Stamp, 
  Lock, 
  Unlock, 
  FileText, 
  Images, 
  Wrench, 
  Tag,
  ArrowRight,
  FileEdit,
  Table,
  Presentation,
  FileCheck,
  FileSpreadsheet,
  PenTool,
  ShieldAlert,
  Crop,
  Archive,
  Code,
  GitCompare,
  ScanText,
  Layers,
  Compass,
  Palette,
  Bookmark,
  Contrast,
  Columns
} from 'lucide-react';
import { ALL_TOOLS, TOOL_CATEGORIES } from '../../config/tools';
import { useLanguage } from '../../context/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Combine,
  Split,
  Minimize2,
  Image: ImageIcon,
  FileImage,
  RotateCw,
  LayoutGrid,
  Trash2,
  Copy,
  ArrowUpDown,
  Hash,
  Stamp,
  Lock,
  Unlock,
  FileText,
  Images,
  Wrench,
  Tag,
  FileEdit,
  Table,
  Presentation,
  FileCheck,
  FileSpreadsheet,
  PenTool,
  ShieldAlert,
  Crop,
  Archive,
  Code,
  GitCompare,
  ScanText,
  Layers,
  Compass,
  Palette,
  Bookmark,
  Contrast,
  Columns,
};

interface ToolGridProps {
  searchQuery?: string;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ searchQuery = '' }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const { t } = useLanguage();

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'popular' && tool.isPopular) ||
      tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (catId: string) => {
    switch (catId) {
      case 'organize': return t('cat.organize', 'Organize PDF');
      case 'optimize': return t('cat.optimize', 'Optimize PDF');
      case 'convert': return t('cat.convert', 'Convert PDF');
      case 'edit': return t('cat.edit', 'Edit PDF');
      case 'security': return t('cat.security', 'Security & Sign');
      default: return catId;
    }
  };

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Category Filter Tabs (Interactive Filter Controls) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('tools.section_title', 'Explore PDF Tools')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('tools.section_subtitle', 'Select any tool below to begin processing documents right in your browser.')}
            </p>
          </div>

          {/* Clean Segmented Tab Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('cat.all', 'All Tools')} ({ALL_TOOLS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('popular')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'popular'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('cat.popular', 'Popular')}
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {getCategoryLabel(cat.id)}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => {
              const IconComponent = ICON_MAP[tool.iconName] || FileText;
              return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl gemini-card hover:border-blue-500/80 transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Icon & Unboxed Category */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-150">
                        <IconComponent className="w-6 h-6 stroke-[2]" />
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {tool.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 uppercase tracking-wider">
                            {tool.badge}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {getCategoryLabel(tool.category)}
                        </span>
                      </div>
                    </div>

                    {/* Tool Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                        {tool.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span className="font-mono text-[11px]">{tool.outputFormat}</span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      <span>{t('tools.open', 'Open')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {t('tools.no_results', 'No tools matching')} "{searchQuery}"
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try searching for "merge", "split", "compress", "rotate", or clear your filter.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              {t('tools.reset_filters', 'Reset Filters')}
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
