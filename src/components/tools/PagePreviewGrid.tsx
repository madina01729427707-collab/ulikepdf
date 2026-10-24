import React, { useEffect, useState } from 'react';
import { RotateCw, Trash2, CheckCircle2, Circle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { loadPdfDocument, renderPageThumbnail } from '../../lib/pdf/pdfjs-init';

export interface PageItem {
  pageNumber: number; // 1-indexed original page number
  thumbnailUrl: string;
  rotation: number; // additional rotation in degrees (0, 90, 180, 270)
  selected: boolean;
}

interface PagePreviewGridProps {
  file: File;
  pages: PageItem[];
  onPagesChange: (pages: PageItem[]) => void;
  mode?: 'reorder' | 'select' | 'rotate' | 'organize';
}

export const PagePreviewGrid: React.FC<PagePreviewGridProps> = ({
  file,
  pages,
  onPagesChange,
  mode = 'organize',
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadThumbnails() {
      try {
        setLoading(true);
        const buffer = await file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(buffer);
        const total = pdfDoc.numPages;
        const loadedPages: PageItem[] = [];

        for (let i = 1; i <= total; i++) {
          if (isCancelled) return;
          const thumb = await renderPageThumbnail(pdfDoc, i, 220);
          loadedPages.push({
            pageNumber: i,
            thumbnailUrl: thumb,
            rotation: 0,
            selected: true,
          });
          setLoadingProgress(Math.round((i / total) * 100));
        }

        if (!isCancelled) {
          onPagesChange(loadedPages);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load page thumbnails', err);
        if (!isCancelled) setLoading(false);
      }
    }

    loadThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const toggleSelectPage = (index: number) => {
    const updated = [...pages];
    updated[index].selected = !updated[index].selected;
    onPagesChange(updated);
  };

  const rotatePage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...pages];
    updated[index].rotation = (updated[index].rotation + 90) % 360;
    onPagesChange(updated);
  };

  const removePage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pages.filter((_, i) => i !== index);
    onPagesChange(updated);
  };

  const movePage = (index: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === pages.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onPagesChange(updated);
  };

  const rotateAll = (deg: number = 90) => {
    const updated = pages.map(p => ({
      ...p,
      rotation: (p.rotation + deg) % 360,
    }));
    onPagesChange(updated);
  };

  const selectAll = (select: boolean) => {
    const updated = pages.map(p => ({
      ...p,
      selected: select,
    }));
    onPagesChange(updated);
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Generating page previews... ({loadingProgress}%)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {pages.length} Pages Loaded
          </span>
          {mode === 'select' && (
            <span className="text-slate-500">
              ({pages.filter(p => p.selected).length} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'rotate' || mode === 'organize' ? (
            <button
              type="button"
              onClick={() => rotateAll(90)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate All 90°</span>
            </button>
          ) : null}

          {mode === 'select' && (
            <>
              <button
                type="button"
                onClick={() => selectAll(true)}
                className="px-2.5 py-1.5 font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => selectAll(false)}
                className="px-2.5 py-1.5 font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
              >
                Deselect All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pages.map((p, idx) => {
          return (
            <div
              key={`${p.pageNumber}-${idx}`}
              onClick={() => mode === 'select' && toggleSelectPage(idx)}
              className={`group relative flex flex-col items-center p-3 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                p.selected
                  ? 'border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 opacity-40'
              } ${mode === 'select' ? 'cursor-pointer hover:border-blue-500' : ''}`}
            >
              {/* Top controls */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">
                  #{idx + 1} <span className="text-slate-400 font-normal">({p.pageNumber})</span>
                </span>

                {mode === 'select' && (
                  <div className="text-blue-600 dark:text-blue-400">
                    {p.selected ? (
                      <CheckCircle2 className="w-4 h-4 fill-blue-600 text-white dark:text-slate-900" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Page Thumbnail with Rotation */}
              <div className="w-full aspect-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-100 dark:border-slate-800">
                <img
                  src={p.thumbnailUrl}
                  alt={`Page ${p.pageNumber}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-200 drop-shadow-xs"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
              </div>

              {/* Hover / Bottom Controls */}
              <div className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
                {(mode === 'reorder' || mode === 'organize') && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => movePage(idx, 'left', e)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move earlier"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={(e) => movePage(idx, 'right', e)}
                      className="p-1 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move later"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {(mode === 'rotate' || mode === 'organize') && (
                  <button
                    type="button"
                    onClick={(e) => rotatePage(idx, e)}
                    className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-auto"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {(mode === 'organize') && (
                  <button
                    type="button"
                    onClick={(e) => removePage(idx, e)}
                    className="p-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
