import React from 'react';
import { Download, CheckCircle2, RotateCcw, FileText } from 'lucide-react';
import { formatBytes } from '../../lib/pdf/operations';
import { useLanguage } from '../../context/LanguageContext';

interface DownloadCardProps {
  fileName: string;
  blob: Blob;
  downloadUrl: string;
  originalSizeBytes?: number;
  onReset: () => void;
  actionTitle?: string;
  extraInfo?: string;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  fileName,
  blob,
  downloadUrl,
  originalSizeBytes,
  onReset,
  actionTitle,
  extraInfo,
}) => {
  const { t } = useLanguage();
  const currentSize = blob.size;
  const isCompressed = originalSizeBytes && originalSizeBytes > currentSize;
  const percentSaved = isCompressed
    ? Math.round(((originalSizeBytes - currentSize) / originalSizeBytes) * 100)
    : 0;

  const displayActionTitle = actionTitle || t('process.download_btn', 'Download Processed File');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6 animate-in fade-in">
      {/* Success Badge */}
      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('process.ready_title', 'Your Document is Ready!')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('process.ready_desc', 'The operation completed successfully. You can now download your file.')}
        </p>
      </div>

      {/* File Specs Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {fileName}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            <span>{t('process.size', 'Size')}: {formatBytes(currentSize)}</span>
            {isCompressed && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {t('process.saved', 'Saved')} {percentSaved}% (was {formatBytes(originalSizeBytes)})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {extraInfo && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          {extraInfo}
        </p>
      )}

      {/* Primary Download Button */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>{displayActionTitle}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('process.another_btn', 'Process Another File')}</span>
        </button>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
        Processed 100% locally on your machine. No server upload was performed.
      </div>
    </div>
  );
};
