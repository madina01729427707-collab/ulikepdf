import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowRight, Home } from 'lucide-react';
import { ALL_TOOLS } from '../config/tools';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Page Not Found (404)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The PDF tool or page you requested could not be found. Check the URL or pick one of our popular tools below.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <span>All 18 Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="pt-10 border-t border-slate-200 dark:border-slate-800 text-left space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Popular Online PDF Tools
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_TOOLS.slice(0, 6).map((t) => (
            <Link
              key={t.id}
              to={t.path}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between"
            >
              <span className="truncate">{t.name}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
