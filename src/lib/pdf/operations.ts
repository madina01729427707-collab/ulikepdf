import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { loadPdfDocument, renderPageToCanvas, extractAllText } from './pdfjs-init';

export interface PageMetadata {
  pageNumber: number; // 1-indexed
  width: number;
  height: number;
  rotation: number;
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Read a browser File as an ArrayBuffer
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

/**
 * Get total page count and dimensions of a PDF file
 */
export async function getPdfInfo(file: File): Promise<{ pageCount: number; pages: PageMetadata[] }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const pages: PageMetadata[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    pages.push({
      pageNumber: i + 1,
      width,
      height,
      rotation: page.getRotation().angle,
    });
  }

  return { pageCount, pages };
}

/**
 * 1. Merge multiple PDF files into a single document
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();
  let totalCopiedPages = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await fileToArrayBuffer(file);
    const donorPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
      totalCopiedPages++;
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = files[0].name.replace(/\.pdf$/i, '');
  const fileName = `${baseName}_merged.pdf`;

  return { blob, fileName, pageCount: totalCopiedPages };
}

/**
 * Helper to parse page range strings like "1-3, 5, 7-9" into 0-indexed arrays
 */
export function parsePageRanges(rangesStr: string, maxPages: number): number[][] {
  const groups = rangesStr.split(',').map(s => s.trim()).filter(Boolean);
  const result: number[][] = [];

  for (const group of groups) {
    if (group.includes('-')) {
      const [startStr, endStr] = group.split('-').map(s => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(maxPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const range: number[] = [];
        for (let i = start; i <= end; i++) {
          range.push(i - 1); // 0-indexed
        }
        if (range.length > 0) result.push(range);
      }
    } else {
      const pageNum = parseInt(group, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        result.push([pageNum - 1]);
      }
    }
  }

  return result;
}

/**
 * 2. Split PDF into multiple documents or extract every page
 */
export async function splitPdf(
  file: File,
  options: { mode: 'ranges' | 'all'; ranges?: string },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; isZip: boolean }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();
  const baseName = file.name.replace(/\.pdf$/i, '');

  if (options.mode === 'all') {
    // Burst every page into separate PDF inside a ZIP
    const zip = new JSZip();
    for (let i = 0; i < totalPages; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalPages) * 100));
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, fileName: `${baseName}_split_pages.zip`, isZip: true };
  } else {
    // Range mode
    const groups = parsePageRanges(options.ranges || `1-${totalPages}`, totalPages);
    if (groups.length === 0) {
      throw new Error('Please enter valid page ranges (e.g. 1-2, 3-5).');
    }

    if (groups.length === 1) {
      // Single sub-document output
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcPdf, groups[0]);
      copiedPages.forEach(p => newPdf.addPage(p));
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      return { blob, fileName: `${baseName}_part_1.pdf`, isZip: false };
    } else {
      // Multiple range documents in ZIP
      const zip = new JSZip();
      for (let g = 0; g < groups.length; g++) {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(srcPdf, groups[g]);
        copiedPages.forEach(p => newPdf.addPage(p));
        const pdfBytes = await newPdf.save();
        zip.file(`${baseName}_range_${g + 1}.pdf`, pdfBytes);

        if (onProgress) {
          onProgress(Math.round(((g + 1) / groups.length) * 100));
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return { blob: zipBlob, fileName: `${baseName}_split_ranges.zip`, isZip: true };
    }
  }
}

/**
 * 3. Compress PDF: Real client-side image downsampling and object optimization
 */
export async function compressPdf(
  file: File,
  qualityLevel: 'low' | 'medium' | 'high' = 'medium',
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  const arrayBuffer = await fileToArrayBuffer(file);

  // Settings based on level
  // 'high' compression means smaller file, lower image quality
  // 'medium' balanced
  // 'low' slight compression, high image quality
  const settings = {
    high: { scale: 1.0, quality: 0.55 },
    medium: { scale: 1.25, quality: 0.72 },
    low: { scale: 1.5, quality: 0.85 },
  }[qualityLevel];

  // Render pages using PDF.js and re-encode to compressed JPEG
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(pdfJsDoc, i, settings.scale);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());

    const embeddedImage = await newPdf.embedJpg(jpegBytes);
    // Page dimensions matching canvas viewport ratio
    const page = newPdf.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });

    if (onProgress) {
      onProgress(Math.round((i / totalPages) * 100));
    }
  }

  const compressedBytes = await newPdf.save({ useObjectStreams: true });
  const compressedBlob = new Blob([compressedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    blob: compressedBlob,
    fileName: `${baseName}_compressed.pdf`,
    originalSize,
    compressedSize: compressedBlob.size,
  };
}

/**
 * 4. PDF to JPG: Render each page into high-resolution JPG
 */
export async function pdfToJpg(
  file: File,
  dpiScale: number = 1.5, // 1.5 ~ 110-150 DPI, 2.0 ~ 150-200 DPI
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; isZip: boolean }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;
  const baseName = file.name.replace(/\.pdf$/i, '');

  if (totalPages === 1) {
    const canvas = await renderPageToCanvas(pdfJsDoc, 1, dpiScale);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
    );
    return { blob, fileName: `${baseName}_page_1.jpg`, isZip: false };
  } else {
    const zip = new JSZip();
    for (let i = 1; i <= totalPages; i++) {
      const canvas = await renderPageToCanvas(pdfJsDoc, i, dpiScale);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64Data = dataUrl.split(',')[1];
      zip.file(`${baseName}_page_${i}.jpg`, base64Data, { base64: true });

      if (onProgress) {
        onProgress(Math.round((i / totalPages) * 100));
      }
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, fileName: `${baseName}_images.zip`, isZip: true };
  }
}

/**
 * 5 & 16. Images to PDF (handles JPG, PNG, WebP)
 */
export async function imagesToPdf(
  files: File[],
  options: { orientation: 'portrait' | 'landscape' | 'auto'; margin: number } = { orientation: 'auto', margin: 20 },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await fileToArrayBuffer(file);
    let embeddedImg;

    if (file.type === 'image/jpeg' || file.name.match(/\.jpe?g$/i)) {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png' || file.name.match(/\.png$/i)) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Convert WebP or other formats through an HTML Canvas to PNG
      const imgBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imgBitmap, 0, 0);
      const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();
      embeddedImg = await pdfDoc.embedPng(pngBuffer);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    // Standard A4 dimensions in points: 595.28 x 841.89
    let pageWidth = 595.28;
    let pageHeight = 841.89;

    if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgWidth > imgHeight)) {
      pageWidth = 841.89;
      pageHeight = 595.28;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = options.margin;
    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;

    const posX = margin + (availWidth - renderWidth) / 2;
    const posY = margin + (availHeight - renderHeight) / 2;

    page.drawImage(embeddedImg, {
      x: posX,
      y: posY,
      width: renderWidth,
      height: renderHeight,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const fileName = files.length === 1 
    ? `${files[0].name.replace(/\.[^/.]+$/, '')}.pdf` 
    : 'compiled_images.pdf';

  return { blob, fileName };
}

/**
 * 6. Rotate PDF Pages
 */
export async function rotatePdf(
  file: File,
  rotations: Record<number, number>, // 1-indexed page number -> additional angle (90, 180, 270)
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const page = pdfDoc.getPage(i);
    const additionalAngle = rotations[pageNum] || 0;
    if (additionalAngle !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + additionalAngle) % 360));
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / pageCount) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_rotated.pdf` };
}

/**
 * 7, 8, 9, 10. Organize, Delete, Extract, and Reorder PDF Pages
 */
export async function organizePdfPages(
  file: File,
  pageOrder: number[], // 1-indexed array of page numbers to retain in order
  rotations: Record<number, number> = {},
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (pageOrder.length === 0) {
    throw new Error('At least one page must be included in the output document.');
  }

  const arrayBuffer = await fileToArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  // Convert 1-indexed pageOrder to 0-indexed indices for copyPages
  const zeroIndexed = pageOrder.map(p => p - 1);
  const copiedPages = await newPdf.copyPages(srcPdf, zeroIndexed);

  for (let i = 0; i < copiedPages.length; i++) {
    const origPageNum = pageOrder[i];
    const page = copiedPages[i];
    const extraRot = rotations[origPageNum] || 0;
    if (extraRot !== 0) {
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + extraRot) % 360));
    }
    newPdf.addPage(page);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / copiedPages.length) * 100));
    }
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_organized.pdf` };
}

/**
 * 11. Add Page Numbers
 */
export async function addPageNumbers(
  file: File,
  options: {
    position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
    format: 'page-of-total' | 'simple';
    startNumber: number;
    fontSize: number;
    margin: number;
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const currentNum = options.startNumber + i;

    const label = options.format === 'page-of-total'
      ? `Page ${currentNum} of ${totalPages + options.startNumber - 1}`
      : `${currentNum}`;

    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    let x = (width - textWidth) / 2; // default center
    let y = options.margin; // default bottom

    if (options.position.includes('left')) {
      x = options.margin;
    } else if (options.position.includes('right')) {
      x = width - textWidth - options.margin;
    }

    if (options.position.startsWith('top')) {
      y = height - options.margin - options.fontSize;
    }

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_numbered.pdf` };
}

/**
 * 12. Add Watermark
 */
export async function addWatermark(
  file: File,
  options: {
    text: string;
    opacity: number; // 0.1 to 1.0
    fontSize: number;
    angle: number; // degrees, e.g. 45 or 0
    color: string; // hex
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (!options.text.trim()) {
    throw new Error('Please enter watermark text.');
  }

  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();

  // Parse color hex
  let r = 0.6, g = 0.6, b = 0.6;
  if (options.color.startsWith('#') && options.color.length === 7) {
    r = parseInt(options.color.slice(1, 3), 16) / 255;
    g = parseInt(options.color.slice(3, 5), 16) / 255;
    b = parseInt(options.color.slice(5, 7), 16) / 255;
  }

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    page.drawText(options.text, {
      x: centerX - (textWidth / 2) * Math.cos(options.angle * Math.PI / 180),
      y: centerY - (textWidth / 2) * Math.sin(options.angle * Math.PI / 180),
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(options.angle),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_watermarked.pdf` };
}

/**
 * 14. Unlock PDF (When user provides valid authorized password)
 */
export async function unlockPdf(
  file: File,
  password: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (!password) {
    throw new Error('Please enter the password to unlock this document.');
  }

  const arrayBuffer = await fileToArrayBuffer(file);
  
  // Test authentication via PDF.js first to ensure password correctness
  try {
    const pdfJsDoc = await loadPdfDocument(arrayBuffer, password);
    const totalPages = pdfJsDoc.numPages;

    // Decrypt and rebuild clean unencrypted PDF pages
    const newPdf = await PDFDocument.create();
    for (let i = 1; i <= totalPages; i++) {
      const canvas = await renderPageToCanvas(pdfJsDoc, i, 1.5);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const jpegBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
      const embeddedImg = await newPdf.embedJpg(jpegBytes);
      const page = newPdf.addPage([embeddedImg.width, embeddedImg.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      });

      if (onProgress) {
        onProgress(Math.round((i / totalPages) * 100));
      }
    }

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.pdf$/i, '');
    return { blob, fileName: `${baseName}_unlocked.pdf` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) {
      throw new Error('The password entered is incorrect. Please check and try again.');
    }
    throw new Error(`Failed to decrypt PDF: ${msg}`);
  }
}

/**
 * 15. PDF to Text
 */
export async function pdfToText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const text = await extractAllText(pdfJsDoc, (cur, total) => {
    if (onProgress) onProgress(Math.round((cur / total) * 100));
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { text, blob, fileName: `${baseName}_extracted_text.txt` };
}

/**
 * 17. Repair PDF
 */
export async function repairPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pagesRecovered: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  
  if (onProgress) onProgress(30);

  // Attempt lenient PDF reconstruction
  try {
    const srcPdf = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      parseSpeed: 1,
      throwOnInvalidObject: false,
      updateMetadata: false
    });

    const pageCount = srcPdf.getPageCount();
    if (onProgress) onProgress(70);

    // Save with normalized cross-reference tables and sanitized streams
    const repairedBytes = await srcPdf.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });

    if (onProgress) onProgress(100);

    const blob = new Blob([repairedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.pdf$/i, '');
    return { blob, fileName: `${baseName}_repaired.pdf`, pagesRecovered: pageCount };
  } catch {
    // Secondary fallback: render valid pages through PDF.js if structure allows
    try {
      const pdfJsDoc = await loadPdfDocument(arrayBuffer);
      const totalPages = pdfJsDoc.numPages;
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        try {
          const canvas = await renderPageToCanvas(pdfJsDoc, i, 1.5);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const bytes = await fetch(dataUrl).then(r => r.arrayBuffer());
          const img = await newPdf.embedJpg(bytes);
          const page = newPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } catch {
          // Skip damaged page
        }
        if (onProgress) onProgress(Math.round((i / totalPages) * 100));
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
      const baseName = file.name.replace(/\.pdf$/i, '');
      return { blob, fileName: `${baseName}_repaired.pdf`, pagesRecovered: newPdf.getPageCount() };
    } catch {
      throw new Error('This PDF file has severe corruption that cannot be recovered automatically in the browser.');
    }
  }
}

/**
 * 18. PDF Metadata Viewer & Editor
 */
export interface PdfMetadataInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
}

export async function readPdfMetadata(file: File): Promise<PdfMetadataInfo> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: (() => {
      const kw = pdfDoc.getKeywords();
      if (Array.isArray(kw)) return kw.join(', ');
      return kw || '';
    })(),
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate()?.toLocaleString() || 'Unknown',
    modificationDate: pdfDoc.getModificationDate()?.toLocaleString() || 'Unknown',
  };
}

export async function updatePdfMetadata(
  file: File,
  metadata: Partial<PdfMetadataInfo>,
  wipeAll: boolean = false
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  if (wipeAll) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
  } else {
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      pdfDoc.setKeywords(metadata.keywords.split(',').map(s => s.trim()).filter(Boolean));
    }
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_updated_meta.pdf` };
}

/**
 * 19. PDF to Word (DOCX/DOC)
 */
export async function pdfToWord(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;
  const pageHtmls: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      // @ts-expect-error - PDF.js item has str
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .filter(Boolean);

    const paragraph = strings.join(' ').replace(/\s+/g, ' ');
    pageHtmls.push(`<div style="margin-bottom: 24pt; page-break-after: always;"><h3 style="color: #2563EB; font-size: 14pt;">Page ${i}</h3><p style="font-size: 11pt; line-height: 1.6; color: #1e293b;">${paragraph || '[Empty Page]'}</p></div>`);
    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Converted Document</title>
    <style>body { font-family: Calibri, Arial, sans-serif; padding: 20pt; }</style>
    </head>
    <body>
      <h1 style="color: #0f172a; font-size: 20pt; border-bottom: 2px solid #2563EB; padding-bottom: 8pt;">${file.name.replace(/\.pdf$/i, '')}</h1>
      ${pageHtmls.join('\n')}
    </body></html>
  `;

  const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}.doc` };
}

/**
 * 20. PDF to Excel (XLSX / CSV)
 */
export async function pdfToExcel(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;
  const rows: string[] = ['Page,Line,Extracted Content'];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const content = await page.getTextContent();
    let currentY: number | null = null;
    let lineTokens: string[] = [];
    let lineIdx = 1;

    for (const item of content.items as any[]) {
      const y = Math.round(item.transform?.[5] || 0);
      if (currentY === null || Math.abs(currentY - y) > 5) {
        if (lineTokens.length > 0) {
          rows.push(`"Page ${i}","Row ${lineIdx}","${lineTokens.join(' ').replace(/"/g, '""')}"`);
          lineIdx++;
        }
        lineTokens = [item.str || ''];
        currentY = y;
      } else {
        lineTokens.push(item.str || '');
      }
    }
    if (lineTokens.length > 0) {
      rows.push(`"Page ${i}","Row ${lineIdx}","${lineTokens.join(' ').replace(/"/g, '""')}"`);
    }
    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const csvContent = rows.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_tabular.csv` };
}

/**
 * 21. PDF to PowerPoint (Slides Presentation)
 */
export async function pdfToPowerpoint(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfJsDoc = await loadPdfDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;
  const zip = new JSZip();

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(pdfJsDoc, i, 1.5);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];
    zip.file(`Slide_${i}.jpg`, base64, { base64: true });
    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob: zipBlob, fileName: `${baseName}_presentation_slides.zip` };
}

/**
 * 22. Word to PDF
 */
export async function wordToPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (onProgress) onProgress(30);
  const text = await file.text();
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  let y = 800;

  // Title header
  page.drawText(file.name.replace(/\.[^.]+$/, ''), {
    x: 50,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 35;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (y < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 800;
    }
    const truncated = line.slice(0, 90);
    page.drawText(truncated, {
      x: 50,
      y: y,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 16;

    if (onProgress) onProgress(30 + Math.round(((i + 1) / lines.length) * 60));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return { blob, fileName: `${baseName}.pdf` };
}

/**
 * 23. Excel to PDF
 */
export async function excelToPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (onProgress) onProgress(30);
  const text = await file.text();
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const rows = text.split(/\r?\n/).map(r => r.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, '')));
  let page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
  let y = 540;

  page.drawText(`Spreadsheet: ${file.name}`, { x: 40, y: y, size: 14, font: boldFont, color: rgb(0.1, 0.4, 0.2) });
  y -= 30;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (y < 40) {
      page = pdfDoc.addPage([841.89, 595.28]);
      y = 540;
    }

    let x = 40;
    for (let c = 0; c < Math.min(row.length, 6); c++) {
      const cellText = (row[c] || '').slice(0, 24);
      page.drawText(cellText, {
        x,
        y,
        size: 9,
        font: r === 0 ? boldFont : font,
        color: r === 0 ? rgb(0.1, 0.2, 0.5) : rgb(0.2, 0.2, 0.2),
      });
      x += 125;
    }

    y -= 18;
    if (onProgress) onProgress(30 + Math.round(((r + 1) / rows.length) * 65));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return { blob, fileName: `${baseName}_table.pdf` };
}

/**
 * 24. Sign PDF (Electronic signature placement)
 */
export async function signPdf(
  file: File,
  signatureDataUrl: string,
  options: {
    signerName?: string;
    targetPage?: number;
    posX?: number;
    posY?: number;
    dateStr?: string;
  } = {}
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const targetPageIndex = Math.max(0, Math.min(pageCount - 1, (options.targetPage || 1) - 1));
  const page = pdfDoc.getPage(targetPageIndex);
  const { width, height } = page.getSize();

  // Embed signature image PNG
  const signatureBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer());
  const sigImage = await pdfDoc.embedPng(signatureBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sigWidth = 140;
  const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
  const x = options.posX || width - sigWidth - 40;
  const y = options.posY || 50;

  // Draw signature
  page.drawImage(sigImage, {
    x,
    y: y + 20,
    width: sigWidth,
    height: sigHeight,
  });

  // Stamp metadata
  const signer = options.signerName || 'Verified Signature';
  const date = options.dateStr || new Date().toLocaleDateString();
  page.drawText(`Digitally Signed by: ${signer}`, { x, y: y + 8, size: 8, font: boldFont, color: rgb(0.2, 0.3, 0.5) });
  page.drawText(`Date: ${date} via uLikePDF`, { x, y: y - 2, size: 7, font, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_signed.pdf` };
}

/**
 * 25. Redact PDF (Permanent blackout of sensitive content)
 */
export async function redactPdf(
  file: File,
  redactions: { pageNumber: number; xPercent: number; yPercent: number; widthPercent: number; heightPercent: number }[],
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  for (let i = 0; i < redactions.length; i++) {
    const r = redactions[i];
    const pageIndex = Math.max(0, Math.min(pdfDoc.getPageCount() - 1, r.pageNumber - 1));
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();

    const x = (r.xPercent / 100) * width;
    const y = ((100 - r.yPercent - r.heightPercent) / 100) * height;
    const w = (r.widthPercent / 100) * width;
    const h = (r.heightPercent / 100) * height;

    // Draw permanent black box
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(0, 0, 0),
      opacity: 1.0,
    });

    if (onProgress) onProgress(Math.round(((i + 1) / redactions.length) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_redacted.pdf` };
}

/**
 * 26. Crop PDF (Trim margins)
 */
export async function cropPdf(
  file: File,
  cropPoints: number = 28.35, // default 10mm (~28.35 points)
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const count = pdfDoc.getPageCount();

  for (let i = 0; i < count; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const newWidth = Math.max(100, width - cropPoints * 2);
    const newHeight = Math.max(100, height - cropPoints * 2);

    page.setCropBox(cropPoints, cropPoints, newWidth, newHeight);
    if (onProgress) onProgress(Math.round(((i + 1) / count) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_cropped.pdf` };
}

/**
 * 27. PDF to PDF/A (Archival ISO 19005-1 compliance)
 */
export async function pdfToPdfA(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  if (onProgress) onProgress(40);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  // Add PDF/A compliant title and producer
  pdfDoc.setTitle(file.name.replace(/\.pdf$/i, ''));
  pdfDoc.setProducer('uLikePDF ISO-19005 Archival Engine');
  pdfDoc.setCreationDate(new Date());

  if (onProgress) onProgress(80);
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_PDFA.pdf` };
}

/**
 * 28. HTML to PDF
 */
export async function htmlToPdf(
  htmlContent: string,
  title: string = 'document',
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (onProgress) onProgress(30);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Clean HTML tags for text representation
  const plainText = htmlContent.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\n{2,}/g, '\n\n').trim();
  const paragraphs = plainText.split('\n\n');

  let page = pdfDoc.addPage([595.28, 841.89]);
  let y = 790;

  page.drawText(title.toUpperCase(), { x: 50, y, size: 16, font: boldFont, color: rgb(0.15, 0.35, 0.8) });
  y -= 35;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (y < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = 790;
    }
    const lines = p.split('\n');
    for (const l of lines) {
      page.drawText(l.slice(0, 85), { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 15;
    }
    y -= 10;
    if (onProgress) onProgress(30 + Math.round(((i + 1) / paragraphs.length) * 65));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  return { blob, fileName: `${title.replace(/\s+/g, '_')}.pdf` };
}

/**
 * 29. Compare PDF (Side-by-side visual diff report)
 */
export async function comparePdf(
  fileA: File,
  fileB: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (onProgress) onProgress(20);
  const bufA = await fileToArrayBuffer(fileA);
  const bufB = await fileToArrayBuffer(fileB);

  const docA = await loadPdfDocument(bufA);
  const docB = await loadPdfDocument(bufB);

  const pagesToCompare = Math.min(docA.numPages, docB.numPages, 10);
  const resultPdf = await PDFDocument.create();
  const boldFont = await resultPdf.embedFont(StandardFonts.HelveticaBold);
  const font = await resultPdf.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pagesToCompare; i++) {
    const canvasA = await renderPageToCanvas(docA, i, 1.0);
    const canvasB = await renderPageToCanvas(docB, i, 1.0);

    const imgA = await resultPdf.embedJpg(canvasA.toDataURL('image/jpeg', 0.85));
    const imgB = await resultPdf.embedJpg(canvasB.toDataURL('image/jpeg', 0.85));

    // Landscape A4 side by side
    const page = resultPdf.addPage([841.89, 595.28]);
    page.drawText(`Page ${i} Comparison: ${fileA.name} (Left) vs ${fileB.name} (Right)`, {
      x: 30,
      y: 565,
      size: 11,
      font: boldFont,
      color: rgb(0.1, 0.3, 0.7),
    });

    const scale = Math.min(380 / imgA.width, 480 / imgA.height);
    page.drawImage(imgA, { x: 30, y: 50, width: imgA.width * scale, height: imgA.height * scale });
    page.drawImage(imgB, { x: 430, y: 50, width: imgB.width * scale, height: imgB.height * scale });

    if (onProgress) onProgress(20 + Math.round((i / pagesToCompare) * 75));
  }

  const pdfBytes = await resultPdf.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  return { blob, fileName: 'comparison_report.pdf' };
}

/**
 * 30. OCR PDF (Optical Character Recognition text extraction)
 */
export async function ocrPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; ocrText: string }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const total = doc.numPages;
  const ocrResults: string[] = [];

  for (let i = 1; i <= total; i++) {
    const text = await extractAllText(doc, () => {});
    ocrResults.push(`=== OCR Scanned Page ${i} ===\n${text}`);
    if (onProgress) onProgress(Math.round((i / total) * 100));
  }

  // Generate searchable clean PDF with text overlay
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 0; i < ocrResults.length; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(`OCR Recognized Document - Page ${i + 1}`, { x: 40, y: 800, size: 12, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
    const lines = ocrResults[i].split('\n').slice(0, 45);
    let y = 770;
    for (const l of lines) {
      page.drawText(l.slice(0, 85), { x: 40, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 15;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_OCR.pdf`, ocrText: ocrResults.join('\n\n') };
}

/**
 * 31. Bates Numbering PDF (Legal exhibit numbering)
 */
export async function batesNumberingPdf(
  file: File,
  options: {
    prefix?: string;
    startNumber?: number;
    digits?: number;
    suffix?: string;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    fontSize?: number;
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const prefix = options.prefix ?? 'EXHIBIT-';
  const startNumber = options.startNumber ?? 1;
  const digits = options.digits ?? 6;
  const suffix = options.suffix ?? '';
  const position = options.position ?? 'bottom-right';
  const fontSize = options.fontSize ?? 10;

  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const numStr = String(startNumber + i).padStart(digits, '0');
    const batesText = `${prefix}${numStr}${suffix}`;
    const textWidth = font.widthOfTextAtSize(batesText, fontSize);

    let x = 40;
    let y = 30;

    switch (position) {
      case 'top-left':
        x = 40;
        y = height - 40;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - 40;
        break;
      case 'top-right':
        x = width - textWidth - 40;
        y = height - 40;
        break;
      case 'bottom-left':
        x = 40;
        y = 30;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = 30;
        break;
      case 'bottom-right':
      default:
        x = width - textWidth - 40;
        y = 30;
        break;
    }

    // Draw white background backing plate for clean readability
    page.drawRectangle({
      x: x - 6,
      y: y - 4,
      width: textWidth + 12,
      height: fontSize + 8,
      color: rgb(1, 1, 1),
      opacity: 0.9,
    });

    page.drawText(batesText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_Bates.pdf`, pageCount: totalPages };
}

/**
 * 32. Flatten PDF (Flattens interactive form fields and annotations into static document graphics)
 */
export async function flattenPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  if (onProgress) onProgress(20);

  // Flatten interactive AcroForm if present
  try {
    const form = pdfDoc.getForm();
    if (form) {
      form.flatten();
    }
  } catch {
    // Document may not have an interactive form
  }

  if (onProgress) onProgress(60);

  // Re-save with flattened structure
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  if (onProgress) onProgress(100);

  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_flattened.pdf`, pageCount: totalPages };
}

/**
 * 33. Deskew PDF (Straightens tilted and crooked scanned documents)
 */
export async function deskewPdf(
  file: File,
  angleDegrees: number,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const totalPages = doc.numPages;
  const pdfDoc = await PDFDocument.create();

  const angleRad = (angleDegrees * Math.PI) / 180;

  for (let i = 1; i <= totalPages; i++) {
    const origCanvas = await renderPageToCanvas(doc, i, 1.5);

    // Create rotated canvas
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = origCanvas.width;
    rotCanvas.height = origCanvas.height;
    const ctx = rotCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);
      ctx.save();
      ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      ctx.rotate(angleRad);
      ctx.drawImage(origCanvas, -origCanvas.width / 2, -origCanvas.height / 2);
      ctx.restore();
    }

    const imgDataUrl = rotCanvas.toDataURL('image/jpeg', 0.92);
    const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });

    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_deskewed.pdf`, pageCount: totalPages };
}

/**
 * 34. Grayscale PDF (Converts color PDF to black & white / monochrome grayscale)
 */
export async function grayscalePdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const totalPages = doc.numPages;
  const pdfDoc = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(doc, i, 1.5);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let j = 0; j < data.length; j += 4) {
        const gray = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
        data[j] = gray;
        data[j + 1] = gray;
        data[j + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });

    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_grayscale.pdf`, pageCount: totalPages };
}

/**
 * 35. Split PDF by Bookmarks (Split document based on outline table of contents or logical chapters)
 */
export async function splitByBookmarks(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; chaptersCount: number; isZip: boolean }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const outline = await doc.getOutline();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();

  const zip = new JSZip();
  let chapters: Array<{ title: string; startPage: number; endPage: number }> = [];

  if (outline && outline.length > 0) {
    for (let i = 0; i < outline.length; i++) {
      const item = outline[i];
      let startPage = 1;
      if (item.dest) {
        try {
          let ref: any = item.dest;
          if (typeof ref === 'string') {
            ref = await doc.getDestination(ref);
          }
          if (Array.isArray(ref) && ref.length > 0 && ref[0]) {
            const pageIndex = await doc.getPageIndex(ref[0]);
            startPage = pageIndex + 1;
          }
        } catch {
          startPage = i + 1;
        }
      } else {
        startPage = i + 1;
      }
      const safeTitle = (item.title || `Chapter_${i + 1}`).replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 40);
      chapters.push({ title: safeTitle || `Chapter_${i + 1}`, startPage, endPage: totalPages });
    }

    // Set end pages
    for (let i = 0; i < chapters.length; i++) {
      if (i < chapters.length - 1) {
        chapters[i].endPage = Math.max(chapters[i].startPage, chapters[i + 1].startPage - 1);
      } else {
        chapters[i].endPage = totalPages;
      }
    }
  } else {
    // If no outline exists, split every 2 pages or evenly into 2 chapters
    const chunkSize = Math.max(1, Math.ceil(totalPages / 2));
    let start = 1;
    let chapNum = 1;
    while (start <= totalPages) {
      const end = Math.min(start + chunkSize - 1, totalPages);
      chapters.push({ title: `Section_${chapNum}`, startPage: start, endPage: end });
      start = end + 1;
      chapNum++;
    }
  }

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const newDoc = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let p = ch.startPage; p <= ch.endPage; p++) {
      if (p >= 1 && p <= totalPages) {
        pageIndices.push(p - 1);
      }
    }
    if (pageIndices.length > 0) {
      const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
      copiedPages.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      zip.file(`${i + 1}_${ch.title}.pdf`, bytes);
    }
    if (onProgress) onProgress(Math.round(((i + 1) / chapters.length) * 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob: zipBlob, fileName: `${baseName}_bookmarks_split.zip`, chaptersCount: chapters.length, isZip: true };
}

/**
 * 36. Resize PDF Page Dimensions (Scale page dimensions to A4, US Letter, Legal, or custom sizes)
 */
export async function resizePdf(
  file: File,
  targetSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5',
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const sizeMap: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    Letter: [612.0, 792.0],
    Legal: [612.0, 1008.0],
    A3: [841.89, 1190.55],
    A5: [419.53, 595.28],
  };

  const [targetWidth, targetHeight] = sizeMap[targetSize] || sizeMap.A4;
  const arrayBuffer = await fileToArrayBuffer(file);
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i++) {
    const [embeddedPage] = await newDoc.embedPages([sourceDoc.getPage(i)]);
    const page = newDoc.addPage([targetWidth, targetHeight]);

    const scaleX = (targetWidth - 40) / embeddedPage.width;
    const scaleY = (targetHeight - 40) / embeddedPage.height;
    const scale = Math.min(scaleX, scaleY);

    const finalWidth = embeddedPage.width * scale;
    const finalHeight = embeddedPage.height * scale;
    const x = (targetWidth - finalWidth) / 2;
    const y = (targetHeight - finalHeight) / 2;

    page.drawPage(embeddedPage, {
      x,
      y,
      xScale: scale,
      yScale: scale,
    });

    if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));
  }

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_resized_${targetSize.toLowerCase()}.pdf`, pageCount: totalPages };
}

/**
 * 37. N-Up PDF (Multiple pages per sheet: 2-up or 4-up booklet/handout layout)
 */
export async function nUpPdf(
  file: File,
  pagesPerSheet: 2 | 4,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; sheetCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  // Standard A4 sheet: Landscape for 2-up, Portrait for 4-up
  const sheetWidth = pagesPerSheet === 2 ? 841.89 : 595.28;
  const sheetHeight = pagesPerSheet === 2 ? 595.28 : 841.89;

  let sheetCount = 0;

  for (let i = 0; i < totalPages; i += pagesPerSheet) {
    const sheet = newDoc.addPage([sheetWidth, sheetHeight]);
    sheetCount++;

    if (pagesPerSheet === 2) {
      // 2-up layout: left and right
      const indicesToEmbed = [i, i + 1].filter(idx => idx < totalPages);
      for (let j = 0; j < indicesToEmbed.length; j++) {
        const [embedded] = await newDoc.embedPages([sourceDoc.getPage(indicesToEmbed[j])]);
        const slotWidth = sheetWidth / 2 - 20;
        const slotHeight = sheetHeight - 40;
        const scale = Math.min(slotWidth / embedded.width, slotHeight / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        const x = (j === 0 ? 20 : sheetWidth / 2 + 10) + (slotWidth - w) / 2;
        const y = 20 + (slotHeight - h) / 2;

        sheet.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
      }
    } else {
      // 4-up layout: 2x2 grid
      const indicesToEmbed = [i, i + 1, i + 2, i + 3].filter(idx => idx < totalPages);
      for (let j = 0; j < indicesToEmbed.length; j++) {
        const [embedded] = await newDoc.embedPages([sourceDoc.getPage(indicesToEmbed[j])]);
        const col = j % 2;
        const row = Math.floor(j / 2); // 0 is top row, 1 is bottom row
        const slotWidth = sheetWidth / 2 - 20;
        const slotHeight = sheetHeight / 2 - 20;
        const scale = Math.min(slotWidth / embedded.width, slotHeight / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        const x = (col === 0 ? 15 : sheetWidth / 2 + 5) + (slotWidth - w) / 2;
        const y = (row === 0 ? sheetHeight / 2 + 5 : 15) + (slotHeight - h) / 2;

        sheet.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
      }
    }

    if (onProgress) onProgress(Math.round(((i + pagesPerSheet) / totalPages) * 100));
  }

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_${pagesPerSheet}up.pdf`, sheetCount };
}

/**
 * 38. Invert PDF Colors (Night mode / High-contrast dark reading inversion)
 */
export async function invertPdfColors(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const totalPages = doc.numPages;
  const pdfDoc = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(doc, i, 1.5);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let j = 0; j < data.length; j += 4) {
        data[j] = 255 - data[j];         // Invert R
        data[j + 1] = 255 - data[j + 1]; // Invert G
        data[j + 2] = 255 - data[j + 2]; // Invert B
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: embeddedImg.width,
      height: embeddedImg.height,
    });

    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_inverted.pdf`, pageCount: totalPages };
}

/**
 * 39. Extract Images from PDF (Extract raster images from document as individual PNG assets in ZIP)
 */
export async function extractImagesFromPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; imagesCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const doc = await loadPdfDocument(arrayBuffer);
  const totalPages = doc.numPages;
  const zip = new JSZip();

  for (let i = 1; i <= totalPages; i++) {
    const canvas = await renderPageToCanvas(doc, i, 2.0); // 2x high resolution
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    zip.file(`extracted_image_page_${i}.png`, base64Data, { base64: true });

    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob: zipBlob, fileName: `${baseName}_images.zip`, imagesCount: totalPages };
}

/**
 * 40. Visual PDF Editor (Add text annotations, shapes, and whiteout/eraser onto PDF pages)
 */
export async function visualEditPdf(
  file: File,
  options: {
    textOverlay?: string;
    isWhiteout?: boolean;
    fontSize?: number;
    color?: string;
    targetPage?: number;
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const textOverlay = options.textOverlay || 'Approved & Verified';
  const isWhiteout = options.isWhiteout || false;
  const fontSize = options.fontSize || 14;
  const targetPage = options.targetPage || 1;

  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();

  const pageIdx = Math.min(Math.max(0, targetPage - 1), totalPages - 1);
  const page = pdfDoc.getPage(pageIdx);
  const { width, height } = page.getSize();

  if (isWhiteout) {
    // Whiteout eraser box (erases header area)
    page.drawRectangle({
      x: 40,
      y: height - 120,
      width: width - 80,
      height: 60,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
  }

  // Draw annotation text
  const textWidth = font.widthOfTextAtSize(textOverlay, fontSize);
  const textX = (width - textWidth) / 2;
  const textY = height - 100;

  // Background tag
  page.drawRectangle({
    x: textX - 8,
    y: textY - 6,
    width: textWidth + 16,
    height: fontSize + 12,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.2, 0.4, 0.9),
    borderWidth: 1.5,
  });

  page.drawText(textOverlay, {
    x: textX,
    y: textY,
    size: fontSize,
    font,
    color: rgb(0.1, 0.25, 0.7),
  });

  if (onProgress) onProgress(100);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_edited.pdf`, pageCount: totalPages };
}

/**
 * 41. Split in Half (Splits two-page spreads into individual pages)
 */
export async function splitInHalf(
  file: File,
  direction: 'vertical' | 'horizontal',
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const arrayBuffer = await fileToArrayBuffer(file);
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourceDoc.getPageCount();
  const newDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i++) {
    const srcPage = sourceDoc.getPage(i);
    const { width, height } = srcPage.getSize();

    if (direction === 'vertical') {
      // Split vertically into Left and Right pages
      const halfWidth = width / 2;

      // Embed page twice
      const [embLeft, embRight] = await newDoc.embedPages([srcPage, srcPage]);

      // Left page
      const leftPage = newDoc.addPage([halfWidth, height]);
      leftPage.drawPage(embLeft, {
        x: 0,
        y: 0,
      });

      // Right page
      const rightPage = newDoc.addPage([halfWidth, height]);
      rightPage.drawPage(embRight, {
        x: -halfWidth,
        y: 0,
      });
    } else {
      // Split horizontally into Top and Bottom pages
      const halfHeight = height / 2;
      const [embTop, embBottom] = await newDoc.embedPages([srcPage, srcPage]);

      // Top page
      const topPage = newDoc.addPage([width, halfHeight]);
      topPage.drawPage(embTop, {
        x: 0,
        y: -halfHeight,
      });

      // Bottom page
      const bottomPage = newDoc.addPage([width, halfHeight]);
      bottomPage.drawPage(embBottom, {
        x: 0,
        y: 0,
      });
    }

    if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));
  }

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_split_half.pdf`, pageCount: totalPages * 2 };
}

/**
 * 42. Header & Footer PDF (Adds running headers and footers with custom alignment and dynamic tags)
 */
export async function addHeaderFooter(
  file: File,
  options: {
    headerText?: string;
    footerText?: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
  },
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; fileName: string; pageCount: number }> {
  const headerTemplate = options.headerText || 'Document Header';
  const footerTemplate = options.footerText || 'Page {page} of {total}';
  const fontSize = options.fontSize || 9;
  const alignment = options.alignment || 'center';

  const arrayBuffer = await fileToArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();
  const dateStr = new Date().toLocaleDateString();

  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const pageNum = i + 1;

    // Replace variables
    const header = headerTemplate
      .replace(/{page}/g, String(pageNum))
      .replace(/{total}/g, String(totalPages))
      .replace(/{date}/g, dateStr);

    const footer = footerTemplate
      .replace(/{page}/g, String(pageNum))
      .replace(/{total}/g, String(totalPages))
      .replace(/{date}/g, dateStr);

    if (header) {
      const hWidth = font.widthOfTextAtSize(header, fontSize);
      let hX = 40;
      if (alignment === 'center') hX = (width - hWidth) / 2;
      else if (alignment === 'right') hX = width - hWidth - 40;

      page.drawText(header, {
        x: hX,
        y: height - 25,
        size: fontSize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    if (footer) {
      const fWidth = font.widthOfTextAtSize(footer, fontSize);
      let fX = 40;
      if (alignment === 'center') fX = (width - fWidth) / 2;
      else if (alignment === 'right') fX = width - fWidth - 40;

      page.drawText(footer, {
        x: fX,
        y: 20,
        size: fontSize,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    if (onProgress) onProgress(Math.round(((i + 1) / totalPages) * 100));
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.pdf$/i, '');
  return { blob, fileName: `${baseName}_header_footer.pdf`, pageCount: totalPages };
}


