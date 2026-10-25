import React, { useEffect, useState } from 'react';
import { 
  RotateCw, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  GripVertical,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
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

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Thumbnail Size Zoom: 'medium' (default large view) | 'large' (extra large) | 'xl' (huge preview)
  const [thumbnailSize, setThumbnailSize] = useState<'medium' | 'large' | 'xl'>('medium');

  // Load high-resolution thumbnails
  useEffect(() => {
    let isCancelled = false;

    async function loadThumbnails() {
      try {
        setLoading(true);
        const buffer = await file.arrayBuffer();
        const pdfDoc = await loadPdfDocument(buffer);
        const total = pdfDoc.numPages;
        const loadedPages: PageItem[] = [];

        // High resolution thumbnail (420px width) for crystal-clear readability
        for (let i = 1; i <= total; i++) {
          if (isCancelled) return;
          const thumb = await renderPageThumbnail(pdfDoc, i, 420);
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

  // Drag-and-Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...pages];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);
    onPagesChange(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Selection toggle
  const toggleSelectPage = (index: number) => {
    const updated = [...pages];
    updated[index].selected = !updated[index].selected;
    onPagesChange(updated);
  };

  // Rotation
  const rotatePage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...pages];
    updated[index].rotation = (updated[index].rotation + 90) % 360;
    onPagesChange(updated);
  };

  // Delete page
  const removePage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pages.filter((_, i) => i !== index);
    onPagesChange(updated);
  };

  // Arrow navigation fallback for precision or mobile
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

  // Loading indicator
  if (loading) {
    return (
      <div className="py-20 text-center space-y-4 gemini-card rounded-2xl p-8">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Generating High-Resolution Page Previews...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rendering pages in high-DPI quality ({loadingProgress}%)
          </p>
        </div>
        <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-200" 
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Grid column styles based on size zoom
  const gridClasses = {
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5',
    large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
    xl: 'grid-cols-1 sm:grid-cols-2 gap-8',
  }[thumbnailSize];

  return (
    <div className="space-y-5">
      {/* Grid Toolbar with Drag Tip & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 gemini-card text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
            <span>{pages.length} Pages</span>
          </div>

          {(mode === 'organize' || mode === 'reorder') && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <GripVertical className="w-4 h-4 text-blue-500" />
              <span>Drag & drop any page card to rearrange order / ড্রাগ করে পেজ সাজান</span>
            </div>
          )}

          {mode === 'select' && (
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              ({pages.filter(p => p.selected).length} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Size Controls (Large, Extra Large, XL) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setThumbnailSize('medium')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                thumbnailSize === 'medium' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Standard Large View"
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setThumbnailSize('large')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                thumbnailSize === 'large' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Extra Large View"
            >
              Large
            </button>
            <button
              type="button"
              onClick={() => setThumbnailSize('xl')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                thumbnailSize === 'xl' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Full Page Inspection (Huge)"
            >
              <Maximize2 className="w-3.5 h-3.5 inline mr-1" />
              Huge
            </button>
          </div>

          {(mode === 'rotate' || mode === 'organize') && (
            <button
              type="button"
              onClick={() => rotateAll(90)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Rotate All 90°</span>
            </button>
          )}

          {mode === 'select' && (
            <>
              <button
                type="button"
                onClick={() => selectAll(true)}
                className="px-3 py-1.5 font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => selectAll(false)}
                className="px-3 py-1.5 font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Deselect All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pages Grid with Drag & Drop */}
      <div className={`grid ${gridClasses}`}>
        {pages.map((p, idx) => {
          const isDraggingThis = draggedIndex === idx;
          const isDragOverThis = dragOverIndex === idx && draggedIndex !== idx;

          return (
            <div
              key={`${p.pageNumber}-${idx}`}
              draggable={mode === 'organize' || mode === 'reorder'}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={() => handleDragLeave(idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => mode === 'select' && toggleSelectPage(idx)}
              className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-200 ${
                isDraggingThis
                  ? 'opacity-30 scale-95 border-2 border-dashed border-blue-500 bg-blue-50/20'
                  : isDragOverThis
                  ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-lg scale-102 ring-4 ring-blue-500/20'
                  : 'gemini-card'
              } ${
                p.selected
                  ? ''
                  : 'opacity-40 grayscale'
              } ${
                (mode === 'organize' || mode === 'reorder') 
                  ? 'cursor-grab active:cursor-grabbing hover:border-blue-400' 
                  : mode === 'select' 
                  ? 'cursor-pointer hover:border-blue-500' 
                  : ''
              }`}
            >
              {/* Card Header: Drag Handle & Page Index */}
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  {(mode === 'organize' || mode === 'reorder') && (
                    <span 
                      className="text-slate-400 group-hover:text-blue-600 transition-colors cursor-grab p-0.5" 
                      title="Drag to rearrange"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Page {p.pageNumber})
                  </span>
                </div>

                {p.rotation !== 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {p.rotation}°
                  </span>
                )}

                {mode === 'select' && (
                  <div className="text-blue-600 dark:text-blue-400">
                    {p.selected ? (
                      <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white dark:text-slate-900" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Large Page Thumbnail Container with Smooth High-DPI Scaling */}
              <div className="w-full aspect-3/4 bg-slate-50 dark:bg-slate-950/60 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800/60 shadow-inner my-1">
                <img
                  src={p.thumbnailUrl}
                  alt={`Page ${p.pageNumber}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-200 drop-shadow-md select-none pointer-events-none"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
              </div>

              {/* Bottom Quick-Action Toolbar */}
              <div className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-slate-500 dark:text-slate-400">
                {(mode === 'reorder' || mode === 'organize') && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => movePage(idx, 'left', e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 disabled:opacity-20 cursor-pointer transition-colors"
                      title="Move page earlier"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={(e) => movePage(idx, 'right', e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 disabled:opacity-20 cursor-pointer transition-colors"
                      title="Move page later"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {(mode === 'rotate' || mode === 'organize') && (
                  <button
                    type="button"
                    onClick={(e) => rotatePage(idx, e)}
                    className="inline-flex items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors ml-auto cursor-pointer"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span className="text-[11px] font-medium hidden sm:inline">Rotate</span>
                  </button>
                )}

                {mode === 'organize' && (
                  <button
                    type="button"
                    onClick={(e) => removePage(idx, e)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                    title="Delete this page"
                  >
                    <Trash2 className="w-4 h-4" />
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
