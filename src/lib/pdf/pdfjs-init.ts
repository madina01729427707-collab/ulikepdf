import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
if (typeof window !== 'undefined') {
  try {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch {
    // Fallback if needed
  }
}

export { pdfjsLib };

/**
 * Loads a PDF document from an ArrayBuffer
 */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array, password?: string) {
  const loadingTask = pdfjsLib.getDocument({
    data,
    password: password || undefined,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Render a specific page of a PDF document to a data URL (PNG/JPG) or an HTML Canvas
 */
export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.0,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = targetCanvas || document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas;
}

/**
 * Generate a thumbnail preview data URL for a given page
 */
export async function renderPageThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  maxWidth: number = 240
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const initialViewport = page.getViewport({ scale: 1.0 });
  const scale = maxWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Extract selectable text from all pages of a PDF document
 */
export async function extractAllText(pdfDoc: pdfjsLib.PDFDocumentProxy, onProgress?: (current: number, total: number) => void): Promise<string> {
  const totalPages = pdfDoc.numPages;
  const textParts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      // @ts-expect-error - PDF.js TextItem has 'str' property
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean);

    textParts.push(`--- Page ${i} ---\n` + strings.join(' '));
    if (onProgress) {
      onProgress(i, totalPages);
    }
  }

  return textParts.join('\n\n');
}
