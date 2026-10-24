import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ProcessingIndicatorProps {
  progress?: number;
  statusText?: string;
  onCancel?: () => void;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  progress = 0,
  statusText,
  onCancel,
}) => {
  const { t } = useLanguage();
  const displayStatus = statusText || t('process.preparing', 'Processing your document locally...');

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm space-y-5 animate-in fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {displayStatus}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('process.running', 'Running in your browser engine. Do not close this tab.')}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>PROGRESS</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
        </div>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      )}
    </div>
  );
};
