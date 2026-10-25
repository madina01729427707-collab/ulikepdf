import React, { useRef, useState } from 'react';
import { UploadCloud, File, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { formatBytes } from '../../lib/pdf/operations';
import { useLanguage } from '../../context/LanguageContext';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  allowReorder?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesChange,
  accept = '.pdf,application/pdf',
  maxFiles = 1,
  maxSizeMB = 100,
  multiple = false,
  title,
  subtitle,
  allowReorder = false,
}) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayTitle = title || (multiple ? t('uploader.select_pdfs', 'Select PDF Files') : t('uploader.select_pdf', 'Select PDF File'));
  const displaySubtitle = subtitle || t('uploader.or_drop', 'or drop PDF documents here');

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMsg(null);
    const newFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      // File size validation
      if (file.size > maxSizeBytes) {
        setErrorMsg(`File "${file.name}" exceeds the ${maxSizeMB}MB browser limit.`);
        continue;
      }

      // Check accepted formats
      if (accept.includes('.pdf') && !file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        if (!accept.includes('image')) {
          setErrorMsg(`"${file.name}" is not a valid PDF file.`);
          continue;
        }
      }

      newFiles.push(file);
    }

    if (newFiles.length === 0) return;

    if (maxFiles === 1 || !multiple) {
      onFilesChange([newFiles[0]]);
    } else {
      const combined = [...files, ...newFiles].slice(0, maxFiles);
      onFilesChange(combined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      // Reset input value so same file can be re-selected if removed
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === files.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onFilesChange(updated);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all duration-200 gemini-box ${
            isDragging
              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 ring-4 ring-blue-500/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple && maxFiles > 1}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-150">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors inline-block cursor-pointer"
              >
                {displayTitle}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {displaySubtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pt-2">
              <span>{t('uploader.up_to', `Up to ${maxSizeMB}MB`)}</span>
              <span aria-hidden="true">·</span>
              <span>{t('uploader.private_badge', '100% Private Client-Side')}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected Files List */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('uploader.selected_docs', 'Selected Document')}{files.length > 1 ? `s (${files.length})` : ''}
            </h4>

            {multiple && files.length < maxFiles && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={true}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('uploader.add_more', 'Add More Files')}</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {allowReorder && files.length > 1 && (
                    <div className="flex items-center mr-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveFile(idx, 'up')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Move Up"
                        aria-label="Move file up in order"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === files.length - 1}
                        onClick={() => moveFile(idx, 'down')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Move Down"
                        aria-label="Move file down in order"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Remove file"
                    aria-label={`Remove file ${file.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {files.length === 1 && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 underline cursor-pointer"
              >
                {t('uploader.choose_different', 'Choose a different file')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
