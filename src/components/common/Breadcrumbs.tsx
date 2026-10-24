import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 py-3 mb-4 space-x-1" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="flex items-center hover:text-slate-900 dark:hover:text-white transition-colors"
        title="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            {isLast || !item.path ? (
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.path} 
                className="hover:text-slate-900 dark:hover:text-white transition-colors truncate"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
