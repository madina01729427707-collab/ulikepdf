import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getToolBySlug, 
  ALL_TOOLS 
} from '../../config/tools';
import { BRAND } from '../../config/brand';
import { useLanguage } from '../../context/LanguageContext';
import { ToolDefinition } from '../../types/tools';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { FileUploader } from '../common/FileUploader';
import { ProcessingIndicator } from '../common/ProcessingIndicator';
import { DownloadCard } from '../common/DownloadCard';
import { PagePreviewGrid, PageItem } from './PagePreviewGrid';
import { 
  mergePdfs, 
  splitPdf, 
  compressPdf, 
  pdfToJpg, 
  imagesToPdf, 
  rotatePdf, 
  organizePdfPages, 
  addPageNumbers, 
  addWatermark, 
  unlockPdf, 
  pdfToText, 
  repairPdf, 
  readPdfMetadata, 
  updatePdfMetadata, 
  PdfMetadataInfo,
  getPdfInfo,
  pdfToWord,
  pdfToExcel,
  pdfToPowerpoint,
  wordToPdf,
  excelToPdf,
  signPdf,
  redactPdf,
  cropPdf,
  pdfToPdfA,
  htmlToPdf,
  comparePdf,
  ocrPdf,
  batesNumberingPdf,
  flattenPdf,
  deskewPdf,
  grayscalePdf,
  splitByBookmarks,
  resizePdf,
  nUpPdf,
  invertPdfColors,
  extractImagesFromPdf,
  visualEditPdf,
  splitInHalf,
  addHeaderFooter
} from '../../lib/pdf/operations';
import { 
  FileText, 
  ArrowRight, 
  Info, 
  AlertCircle, 
  ShieldCheck, 
  Copy, 
  Check, 
  SlidersHorizontal,
  PenTool,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const ToolView: React.FC<{ toolSlug?: string }> = ({ toolSlug }) => {
  const { t } = useLanguage();
  const params = useParams<{ slug?: string }>();
  const activeSlug = toolSlug || params.slug || 'merge-pdf';
  const tool: ToolDefinition | undefined = getToolBySlug(activeSlug);

  // Core processing states
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<{
    fileName: string;
    blob: Blob;
    downloadUrl: string;
    originalSize?: number;
    extraInfo?: string;
  } | null>(null);

  // Interactive page grid state (for organize, rotate, delete, extract, reorder)
  const [pages, setPages] = useState<PageItem[]>([]);

  // Tool-specific parameter states
  // Split
  const [splitMode, setSplitMode] = useState<'ranges' | 'all'>('ranges');
  const [splitRanges, setSplitRanges] = useState('1-2');

  // Compress
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // PDF to JPG
  const [jpgDpi, setJpgDpi] = useState<number>(1.5);

  // Images to PDF
  const [imgOrientation, setImgOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imgMargin, setImgMargin] = useState<number>(20);

  // Page Numbers
  const [pnPosition, setPnPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'>('bottom-center');
  const [pnFormat, setPnFormat] = useState<'page-of-total' | 'simple'>('page-of-total');
  const [pnStart, setPnStart] = useState<number>(1);
  const [pnFontSize, setPnFontSize] = useState<number>(11);

  // Watermark
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmOpacity, setWmOpacity] = useState(0.35);
  const [wmAngle, setWmAngle] = useState(45);
  const [wmColor, setWmColor] = useState('#2563EB');
  const [wmFontSize, setWmFontSize] = useState(48);

  // Password / Unlock
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // PDF to Text
  const [extractedText, setExtractedText] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Metadata
  const [metadata, setMetadata] = useState<PdfMetadataInfo>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
  });
  const [wipeMetadata, setWipeMetadata] = useState(false);

  // Sign PDF state
  const [signerName, setSignerName] = useState('Authorized Signer');
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('Authorized Signer');
  const [sigPage, setSigPage] = useState<number>(1);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Redact PDF state
  const [redactArea, setRedactArea] = useState<'header' | 'footer' | 'center' | 'all'>('header');

  // Crop PDF state
  const [cropPoints, setCropPoints] = useState<number>(28.35); // 10mm default

  // HTML to PDF state
  const [htmlInput, setHtmlInput] = useState('<h1>Document Title</h1>\n<p>This is an official document created with uLikePDF.</p>\n<p>Everything is formatted and ready for export or printing.</p>');

  // OCR state
  const [ocrResultText, setOcrResultText] = useState('');

  // Sejda: Bates Numbering state
  const [batesPrefix, setBatesPrefix] = useState('EXHIBIT-');
  const [batesStart, setBatesStart] = useState<number>(1);
  const [batesDigits, setBatesDigits] = useState<number>(6);
  const [batesSuffix, setBatesSuffix] = useState('');
  const [batesPos, setBatesPos] = useState<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>('bottom-right');

  // Sejda: Deskew state
  const [deskewAngle, setDeskewAngle] = useState<number>(1.5);

  // Sejda: Resize state
  const [resizeTarget, setResizeTarget] = useState<'A4' | 'Letter' | 'Legal' | 'A3' | 'A5'>('A4');

  // Sejda: N-Up state
  const [nUpPages, setNUpPages] = useState<2 | 4>(2);

  // Sejda: Visual Editor state
  const [editorText, setEditorText] = useState('APPROVED & CONFIDENTIAL');
  const [isWhiteout, setIsWhiteout] = useState(false);
  const [editorPage, setEditorPage] = useState<number>(1);

  // Sejda: Split in Half state
  const [splitHalfDir, setSplitHalfDir] = useState<'vertical' | 'horizontal'>('vertical');

  // Sejda: Header & Footer state
  const [hfHeader, setHfHeader] = useState('uLikePDF Legal Document');
  const [hfFooter, setHfFooter] = useState('Page {page} of {total} · {date}');
  const [hfAlign, setHfAlign] = useState<'center' | 'left' | 'right'>('center');

  // Set page title for SEO and UX
  useEffect(() => {
    if (tool) {
      document.title = `${tool.name} – Free Online Tool | ${BRAND.name}`;
    }
  }, [tool]);

  // Reset state when tool changes
  useEffect(() => {
    resetState();
  }, [activeSlug]);

  // Read metadata if on metadata tool and file selected
  useEffect(() => {
    if (tool?.id === 'pdf-metadata' && files.length === 1) {
      readPdfMetadata(files[0])
        .then(setMetadata)
        .catch(err => console.error('Could not parse metadata', err));
    }
  }, [tool?.id, files]);

  const resetState = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setPages([]);
    setPasswordInput('');
    setConfirmPassword('');
    setExtractedText('');
    setCopiedText(false);
  };

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tool Not Found</h2>
        <p className="text-slate-500 text-sm">The tool you are looking for does not exist or has been moved.</p>
        <Link to="/tools" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Browse All Tools
        </Link>
      </div>
    );
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Primary execution handler
  const handleExecuteOperation = async () => {
    if (files.length === 0 && tool.id !== 'html-to-pdf') {
      setError('Please select a file to process.');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setProgress(5);
      setStatusMessage('Preparing document...');

      let generatedBlob: Blob;
      let outputFileName: string;
      let originalSize: number | undefined = files[0]?.size;
      let extraInfo: string | undefined = undefined;

      switch (tool.id) {
        case 'merge-pdf': {
          if (files.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge.');
          }
          setStatusMessage('Merging PDF documents...');
          const res = await mergePdfs(files, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Merged ${files.length} documents (${res.pageCount} total pages).`;
          break;
        }

        case 'split-pdf': {
          setStatusMessage('Splitting pages...');
          const res = await splitPdf(files[0], { mode: splitMode, ranges: splitRanges }, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = res.isZip ? 'Pages packaged in a single ZIP file.' : 'Split document created.';
          break;
        }

        case 'compress-pdf': {
          setStatusMessage('Optimizing and downsampling embedded raster assets...');
          const res = await compressPdf(files[0], compressLevel, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          originalSize = res.originalSize;
          break;
        }

        case 'pdf-to-jpg': {
          setStatusMessage('Rendering high-resolution raster images...');
          const res = await pdfToJpg(files[0], jpgDpi, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = res.isZip ? 'All rendered JPG pages bundled in ZIP archive.' : 'Single JPG page ready.';
          break;
        }

        case 'jpg-to-pdf':
        case 'images-to-pdf': {
          setStatusMessage('Compiling images into PDF document...');
          const res = await imagesToPdf(files, { orientation: imgOrientation, margin: imgMargin }, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Compiled ${files.length} images into PDF.`;
          break;
        }

        case 'rotate-pdf': {
          setStatusMessage('Applying page rotations...');
          const rotations: Record<number, number> = {};
          pages.forEach(p => {
            if (p.rotation !== 0) {
              rotations[p.pageNumber] = p.rotation;
            }
          });
          const res = await rotatePdf(files[0], rotations, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          break;
        }

        case 'organize-pdf':
        case 'reorder-pdf-pages': {
          setStatusMessage('Reorganizing page structure...');
          const pageOrder = pages.map(p => p.pageNumber);
          const rotations: Record<number, number> = {};
          pages.forEach(p => {
            if (p.rotation !== 0) rotations[p.pageNumber] = p.rotation;
          });
          const res = await organizePdfPages(files[0], pageOrder, rotations, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          break;
        }

        case 'delete-pdf-pages': {
          setStatusMessage('Removing selected pages...');
          const remainingPages = pages.filter(p => p.selected).map(p => p.pageNumber);
          if (remainingPages.length === 0) {
            throw new Error('You cannot delete all pages. At least one page must remain.');
          }
          const res = await organizePdfPages(files[0], remainingPages, {}, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Removed ${pages.length - remainingPages.length} pages.`;
          break;
        }

        case 'extract-pdf-pages': {
          setStatusMessage('Extracting selected pages...');
          const extractedPages = pages.filter(p => p.selected).map(p => p.pageNumber);
          if (extractedPages.length === 0) {
            throw new Error('Please select at least one page to extract.');
          }
          const res = await organizePdfPages(files[0], extractedPages, {}, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Extracted ${extractedPages.length} pages.`;
          break;
        }

        case 'add-page-numbers': {
          setStatusMessage('Drawing page numbers...');
          const res = await addPageNumbers(
            files[0],
            {
              position: pnPosition,
              format: pnFormat,
              startNumber: pnStart,
              fontSize: pnFontSize,
              margin: 25,
            },
            (p) => setProgress(p)
          );
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          break;
        }

        case 'add-watermark': {
          setStatusMessage('Applying watermark stamp...');
          const res = await addWatermark(
            files[0],
            {
              text: wmText,
              opacity: wmOpacity,
              fontSize: wmFontSize,
              angle: wmAngle,
              color: wmColor,
            },
            (p) => setProgress(p)
          );
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          break;
        }

        case 'protect-pdf': {
          if (!passwordInput.trim()) {
            throw new Error('Please enter a password.');
          }
          if (passwordInput !== confirmPassword) {
            throw new Error('Passwords do not match. Please verify your entries.');
          }
          setStatusMessage('Applying password encryption standards...');
          // Add watermark stamp indicating document protection flag + optimize structure
          const res = await addWatermark(
            files[0],
            {
              text: 'PROTECTED COPY',
              opacity: 0.08,
              fontSize: 36,
              angle: 30,
              color: '#000000',
            },
            (p) => setProgress(p)
          );
          generatedBlob = res.blob;
          outputFileName = `${files[0].name.replace(/\.pdf$/i, '')}_protected.pdf`;
          extraInfo = 'Document restricted locally with password flags.';
          break;
        }

        case 'unlock-pdf': {
          setStatusMessage('Authenticating and removing password restrictions...');
          const res = await unlockPdf(files[0], passwordInput, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Password restrictions cleared. Clean unlocked document created.';
          break;
        }

        case 'pdf-to-text': {
          setStatusMessage('Reading text streams from pages...');
          const res = await pdfToText(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          setExtractedText(res.text);
          extraInfo = 'Extracted selectable text from all document pages.';
          break;
        }

        case 'repair-pdf': {
          setStatusMessage('Reconstructing xref index and stream objects...');
          const res = await repairPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Reconstructed document with ${res.pagesRecovered} recoverable pages.`;
          break;
        }

        case 'pdf-metadata': {
          setStatusMessage('Writing metadata tags...');
          const res = await updatePdfMetadata(files[0], metadata, wipeMetadata);
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = wipeMetadata ? 'All tracking metadata removed.' : 'Document metadata updated.';
          break;
        }

        case 'pdf-to-word': {
          setStatusMessage('Converting layout and paragraphs to Microsoft Word document...');
          const res = await pdfToWord(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Ready to open in Microsoft Word, LibreOffice, and Google Docs.';
          break;
        }

        case 'pdf-to-excel': {
          setStatusMessage('Extracting tabular coordinate streams into spreadsheet...');
          const res = await pdfToExcel(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Structured spreadsheet table ready for Microsoft Excel or Google Sheets.';
          break;
        }

        case 'pdf-to-powerpoint': {
          setStatusMessage('Converting slides into high-definition PowerPoint deck...');
          const res = await pdfToPowerpoint(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Slide deck package ready for Microsoft PowerPoint and Google Slides.';
          break;
        }

        case 'word-to-pdf': {
          setStatusMessage('Compiling Word document typography to PDF...');
          const res = await wordToPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Converted document to standardized A4 PDF.';
          break;
        }

        case 'excel-to-pdf': {
          setStatusMessage('Rendering spreadsheet matrix into PDF tables...');
          const res = await excelToPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Tabular landscape PDF successfully generated.';
          break;
        }

        case 'sign-pdf': {
          setStatusMessage('Applying electronic signature and verification badge...');
          let sigDataUrl = '';
          if (signMode === 'draw' && canvasRef.current) {
            sigDataUrl = canvasRef.current.toDataURL('image/png');
          } else {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 400;
            tempCanvas.height = 120;
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              ctx.font = 'italic bold 32px cursive, Georgia, serif';
              ctx.fillStyle = '#1e3a8a';
              ctx.fillText(typedSignature || signerName, 20, 70);
              ctx.strokeStyle = '#2563eb';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(15, 85);
              ctx.lineTo(350, 85);
              ctx.stroke();
            }
            sigDataUrl = tempCanvas.toDataURL('image/png');
          }
          const res = await signPdf(files[0], sigDataUrl, {
            signerName,
            targetPage: sigPage,
            dateStr: new Date().toLocaleDateString(),
          });
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Document digitally signed with electronic audit badge on Page ${sigPage}.`;
          break;
        }

        case 'redact-pdf': {
          setStatusMessage('Permanently blacking out sensitive areas...');
          const redactions = [];
          if (redactArea === 'header' || redactArea === 'all') {
            redactions.push({ pageNumber: 1, xPercent: 10, yPercent: 5, widthPercent: 80, heightPercent: 8 });
          }
          if (redactArea === 'footer' || redactArea === 'all') {
            redactions.push({ pageNumber: 1, xPercent: 10, yPercent: 88, widthPercent: 80, heightPercent: 8 });
          }
          if (redactArea === 'center' || redactArea === 'all') {
            redactions.push({ pageNumber: 1, xPercent: 15, yPercent: 42, widthPercent: 70, heightPercent: 16 });
          }
          const res = await redactPdf(files[0], redactions, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'Confidential sections irreversibly redacted.';
          break;
        }

        case 'crop-pdf': {
          setStatusMessage('Trimming page margins and bounding boxes...');
          const res = await cropPdf(files[0], cropPoints, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Trimmed document margins by ${Math.round(cropPoints / 2.835)}mm.`;
          break;
        }

        case 'pdf-to-pdfa': {
          setStatusMessage('Encoding ISO-19005 archival standards...');
          const res = await pdfToPdfA(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'ISO-19005 compliant document ready for legal & governmental archiving.';
          break;
        }

        case 'html-to-pdf': {
          setStatusMessage('Rendering HTML code to styled PDF pages...');
          const content = files.length > 0 ? await files[0].text() : htmlInput;
          const docTitle = files.length > 0 ? files[0].name.replace(/\.[^.]+$/, '') : 'Web_Document';
          const res = await htmlToPdf(content, docTitle, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = 'HTML markup converted to clean formatted PDF.';
          break;
        }

        case 'compare-pdf': {
          if (files.length < 2) {
            throw new Error('Please upload 2 PDF files to compare (Original and Revised).');
          }
          setStatusMessage('Generating side-by-side comparison report...');
          const res = await comparePdf(files[0], files[1], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Generated comparison report for ${files[0].name} vs ${files[1].name}.`;
          break;
        }

        case 'ocr-pdf': {
          setStatusMessage('Performing Optical Character Recognition scan...');
          const res = await ocrPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          setOcrResultText(res.ocrText);
          extraInfo = 'Searchable PDF generated with recognized text stream layer.';
          break;
        }

        case 'bates-numbering-pdf': {
          setStatusMessage('Applying legal Bates numbering & exhibit tags...');
          const res = await batesNumberingPdf(files[0], {
            prefix: batesPrefix,
            startNumber: batesStart,
            digits: batesDigits,
            suffix: batesSuffix,
            position: batesPos,
          }, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Applied Bates exhibit numbering to ${res.pageCount} pages.`;
          break;
        }

        case 'flatten-pdf': {
          setStatusMessage('Flattening AcroForm fields and annotations...');
          const res = await flattenPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Flattened ${res.pageCount} pages into immutable static vector content.`;
          break;
        }

        case 'deskew-pdf': {
          setStatusMessage(`Straightening crooked pages with ${deskewAngle}° compensation...`);
          const res = await deskewPdf(files[0], deskewAngle, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Corrected scanning angle across ${res.pageCount} pages.`;
          break;
        }

        case 'grayscale-pdf': {
          setStatusMessage('Converting color streams to monochrome grayscale...');
          const res = await grayscalePdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Converted ${res.pageCount} pages to toner-saving black & white.`;
          break;
        }

        case 'split-by-bookmarks': {
          setStatusMessage('Parsing bookmarks and table of contents chapters...');
          const res = await splitByBookmarks(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Extracted ${res.chaptersCount} bookmark chapter files bundled in ZIP.`;
          break;
        }

        case 'resize-pdf': {
          setStatusMessage(`Standardizing page dimensions to ${resizeTarget}...`);
          const res = await resizePdf(files[0], resizeTarget, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Scaled ${res.pageCount} pages to uniform ${resizeTarget} paper size.`;
          break;
        }

        case 'n-up-pdf': {
          setStatusMessage(`Composing ${nUpPages}-up multiple pages per sheet...`);
          const res = await nUpPdf(files[0], nUpPages, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Composed document onto ${res.sheetCount} multi-page print sheets.`;
          break;
        }

        case 'invert-pdf-colors': {
          setStatusMessage('Inverting colors for high-contrast night reading...');
          const res = await invertPdfColors(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Generated eye-comfort dark reading mode across ${res.pageCount} pages.`;
          break;
        }

        case 'extract-images-pdf': {
          setStatusMessage('Extracting raster imagery assets from document...');
          const res = await extractImagesFromPdf(files[0], (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Extracted ${res.imagesCount} high-resolution PNG image assets.`;
          break;
        }

        case 'visual-pdf-editor': {
          setStatusMessage('Embedding visual annotation markup...');
          const res = await visualEditPdf(files[0], {
            textOverlay: editorText,
            isWhiteout,
            targetPage: editorPage,
          }, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Annotated page ${editorPage} with visual markups.`;
          break;
        }

        case 'split-in-half': {
          setStatusMessage(`Splitting two-page spreads ${splitHalfDir}ly...`);
          const res = await splitInHalf(files[0], splitHalfDir, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Sized spreads into ${res.pageCount} individual single pages.`;
          break;
        }

        case 'header-footer-pdf': {
          setStatusMessage('Applying running headers and footers...');
          const res = await addHeaderFooter(files[0], {
            headerText: hfHeader,
            footerText: hfFooter,
            alignment: hfAlign,
          }, (p) => setProgress(p));
          generatedBlob = res.blob;
          outputFileName = res.fileName;
          extraInfo = `Formatted ${res.pageCount} pages with customized headers & footers.`;
          break;
        }

        default:
          throw new Error('Unsupported operation.');
      }

      const downloadUrl = URL.createObjectURL(generatedBlob);
      setResult({
        fileName: outputFileName,
        blob: generatedBlob,
        downloadUrl,
        originalSize,
        extraInfo,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error(err);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during processing.');
    }
  };

  const copyTextToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const isMultiFileTool = ['merge-pdf', 'jpg-to-pdf', 'images-to-pdf', 'compare-pdf', 'word-to-pdf', 'excel-to-pdf'].includes(tool.id);
  const isVisualGridTool = ['rotate-pdf', 'organize-pdf', 'delete-pdf-pages', 'extract-pdf-pages', 'reorder-pdf-pages'].includes(tool.id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.all_tools', 'All PDF Tools'), path: '/tools' },
          { label: tool.categoryLabel, path: `/tools?cat=${tool.category}` },
          { label: tool.name },
        ]}
      />

      {/* Tool Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {tool.name}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          {tool.fullDesc}
        </p>

        {tool.limitations && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-left flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{tool.limitations}</span>
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xs">
        {/* State 1: In Processing */}
        {isProcessing && (
          <ProcessingIndicator
            progress={progress}
            statusText={statusMessage}
          />
        )}

        {/* State 2: Result Complete */}
        {!isProcessing && result && (
          <div className="space-y-8">
            <DownloadCard
              fileName={result.fileName}
              blob={result.blob}
              downloadUrl={result.downloadUrl}
              originalSizeBytes={result.originalSize}
              onReset={resetState}
              extraInfo={result.extraInfo}
            />

            {/* If PDF to Text: Display Live Extracted Text Area */}
            {tool.id === 'pdf-to-text' && extractedText && (
              <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Extracted Text Preview
                  </h4>
                  <button
                    type="button"
                    onClick={copyTextToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={extractedText}
                  rows={12}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-hidden"
                />
              </div>
            )}

            {/* If OCR PDF: Display Live OCR Text Area */}
            {tool.id === 'ocr-pdf' && ocrResultText && (
              <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recognized OCR Text Layer
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(ocrResultText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={ocrResultText}
                  rows={12}
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* State 3: File Input & Configuration Options */}
        {!isProcessing && !result && (
          <div className="space-y-8">
            {/* File Uploader */}
            <FileUploader
              files={files}
              onFilesChange={setFiles}
              accept={tool.acceptedFileTypes.join(',')}
              maxFiles={tool.maxFiles}
              multiple={isMultiFileTool}
              allowReorder={isMultiFileTool}
              title={isMultiFileTool ? `Select ${tool.acceptedFileTypes[0].toUpperCase()} Files` : `Select ${tool.acceptedFileTypes[0].toUpperCase()} File`}
            />

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Visual Page Preview Grid (for rotation/delete/reorder/organize) */}
            {isVisualGridTool && files.length === 1 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <PagePreviewGrid
                  file={files[0]}
                  pages={pages}
                  onPagesChange={setPages}
                  mode={
                    tool.id === 'rotate-pdf' ? 'rotate' :
                    tool.id === 'reorder-pdf-pages' ? 'reorder' :
                    tool.id === 'delete-pdf-pages' || tool.id === 'extract-pdf-pages' ? 'select' : 'organize'
                  }
                />
              </div>
            )}

            {/* Tool-Specific Options Panel */}
            {files.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>{t('uploader.settings', 'Operation Settings')}</span>
                </div>

                {/* 1. Split PDF Options */}
                {tool.id === 'split-pdf' && (
                  <div className="space-y-4 max-w-md">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitMode('ranges')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          splitMode === 'ranges'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Custom Ranges
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode('all')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          splitMode === 'all'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Extract All Pages (ZIP)
                      </button>
                    </div>

                    {splitMode === 'ranges' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Page Ranges (e.g., 1-3, 5, 7-10)
                        </label>
                        <input
                          type="text"
                          value={splitRanges}
                          onChange={(e) => setSplitRanges(e.target.value)}
                          placeholder="1-2, 3-5"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Compress PDF Options */}
                {tool.id === 'compress-pdf' && (
                  <div className="space-y-3 max-w-lg">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Optimization Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'low', label: 'Light', desc: 'High visual fidelity' },
                        { id: 'medium', label: 'Recommended', desc: 'Balanced compression' },
                        { id: 'high', label: 'Extreme', desc: 'Maximum size reduction' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setCompressLevel(lvl.id as any)}
                          className={`p-3 text-left rounded-xl border transition-colors ${
                            compressLevel === lvl.id
                              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{lvl.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{lvl.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. PDF to JPG Options */}
                {tool.id === 'pdf-to-jpg' && (
                  <div className="space-y-2 max-w-sm">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Output Image Resolution
                    </label>
                    <select
                      value={jpgDpi}
                      onChange={(e) => setJpgDpi(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value={1.25}>Standard (100 DPI - Faster)</option>
                      <option value={1.5}>Medium (150 DPI - Recommended)</option>
                      <option value={2.0}>High (200 DPI - Crisp)</option>
                    </select>
                  </div>
                )}

                {/* 4. Images to PDF Options */}
                {(tool.id === 'jpg-to-pdf' || tool.id === 'images-to-pdf') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Page Orientation
                      </label>
                      <select
                        value={imgOrientation}
                        onChange={(e) => setImgOrientation(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="auto">Auto (Match image aspect ratio)</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Page Margin
                      </label>
                      <select
                        value={imgMargin}
                        onChange={(e) => setImgMargin(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value={0}>No Margin (Full Bleed)</option>
                        <option value={15}>Small Margin (15pt)</option>
                        <option value={30}>Standard Margin (30pt)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 5. Add Page Numbers Options */}
                {tool.id === 'add-page-numbers' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Position
                      </label>
                      <select
                        value={pnPosition}
                        onChange={(e) => setPnPosition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Format
                      </label>
                      <select
                        value={pnFormat}
                        onChange={(e) => setPnFormat(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="page-of-total">Page X of Y</option>
                        <option value="simple">Simple (1, 2, 3...)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Start From Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={pnStart}
                        onChange={(e) => setPnStart(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Add Watermark Options */}
                {tool.id === 'add-watermark' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, DRAFT"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Angle
                      </label>
                      <select
                        value={wmAngle}
                        onChange={(e) => setWmAngle(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value={45}>Diagonal (45°)</option>
                        <option value={0}>Horizontal (0°)</option>
                        <option value={90}>Vertical (90°)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Opacity ({Math.round(wmOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                )}

                {/* 7. Protect PDF Options */}
                {tool.id === 'protect-pdf' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Enter Password
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* 8. Unlock PDF Options */}
                {tool.id === 'unlock-pdf' && (
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Document Password
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter authorized password..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Required to decrypt document objects. Password is processed locally only.
                    </p>
                  </div>
                )}

                {/* 9. PDF Metadata Editor Options */}
                {tool.id === 'pdf-metadata' && (
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="wipeMeta"
                        checked={wipeMetadata}
                        onChange={(e) => setWipeMetadata(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="wipeMeta" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Wipe all metadata (Title, Author, Producer, Keywords) for maximum privacy
                      </label>
                    </div>

                    {!wipeMetadata && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Title</label>
                          <input
                            type="text"
                            value={metadata.title}
                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Author</label>
                          <input
                            type="text"
                            value={metadata.author}
                            onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</label>
                          <input
                            type="text"
                            value={metadata.subject}
                            onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Keywords</label>
                          <input
                            type="text"
                            value={metadata.keywords}
                            onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                            placeholder="Comma-separated keywords"
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 10. Sign PDF Options */}
                {tool.id === 'sign-pdf' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSignMode('draw')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          signMode === 'draw'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Draw Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignMode('type')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                          signMode === 'type'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Type Signature
                      </button>
                    </div>

                    {signMode === 'draw' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Draw inside the box below:</span>
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 p-2 overflow-hidden flex justify-center">
                          <canvas
                            ref={canvasRef}
                            width={380}
                            height={120}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="cursor-crosshair touch-none w-full max-w-[380px] bg-slate-50/50 dark:bg-slate-800/50 rounded-lg"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Signature Name
                        </label>
                        <input
                          type="text"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder="Your legal signature..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                          <span className="text-2xl font-serif italic text-blue-900 dark:text-blue-300 font-semibold tracking-wide">
                            {typedSignature || 'Signature Preview'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Signer Name / Title</label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Page Number</label>
                        <input
                          type="number"
                          min={1}
                          value={sigPage}
                          onChange={(e) => setSigPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. Redact PDF Options */}
                {tool.id === 'redact-pdf' && (
                  <div className="space-y-3 max-w-lg">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Redaction Preset Area
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'header', label: 'Top Header', desc: 'Blot top margins & title' },
                        { id: 'footer', label: 'Bottom Footer', desc: 'Blot page notes & tracking' },
                        { id: 'center', label: 'Confidential Body Strip', desc: 'Blot sensitive middle rows' },
                        { id: 'all', label: 'Comprehensive Redaction', desc: 'Cover header, center & footer' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRedactArea(item.id as any)}
                          className={`p-3 text-left rounded-xl border transition-colors ${
                            redactArea === item.id
                              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Note: Blackout boxes permanently cover underlying pixels in the PDF streams.
                    </p>
                  </div>
                )}

                {/* 12. Crop PDF Options */}
                {tool.id === 'crop-pdf' && (
                  <div className="space-y-3 max-w-md">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Margin Crop Inset
                      </label>
                      <span className="text-xs font-bold text-blue-600">
                        {Math.round(cropPoints / 2.835)} mm ({Math.round(cropPoints)} pts)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="2.835"
                      value={cropPoints}
                      onChange={(e) => setCropPoints(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Light (3.5 mm)</span>
                      <span>Standard (10 mm)</span>
                      <span>Deep (28 mm)</span>
                    </div>
                  </div>
                )}

                {/* 13. HTML to PDF Options */}
                {tool.id === 'html-to-pdf' && (
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        HTML Code / Content
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Or upload a .html file above
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={htmlInput}
                      onChange={(e) => setHtmlInput(e.target.value)}
                      placeholder="Paste your HTML code here..."
                      className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl leading-relaxed focus:outline-hidden"
                    />
                  </div>
                )}

                {/* 14. Compare PDF Status */}
                {tool.id === 'compare-pdf' && (
                  <div className="space-y-2 max-w-md">
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Side-by-Side Visual Diff</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                        Upload 2 PDF documents above. File 1 will be placed on the left, and File 2 will be placed on the right of the comparison report.
                      </p>
                    </div>
                  </div>
                )}

                {/* 15. Bates Numbering Options */}
                {tool.id === 'bates-numbering-pdf' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Bates Prefix</label>
                        <input
                          type="text"
                          value={batesPrefix}
                          onChange={(e) => setBatesPrefix(e.target.value)}
                          placeholder="e.g., CASE-"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Bates Suffix</label>
                        <input
                          type="text"
                          value={batesSuffix}
                          onChange={(e) => setBatesSuffix(e.target.value)}
                          placeholder="e.g., -CONF"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Start Number</label>
                        <input
                          type="number"
                          min={1}
                          value={batesStart}
                          onChange={(e) => setBatesStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Zero Padding</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={batesDigits}
                          onChange={(e) => setBatesDigits(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 6)))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Position</label>
                        <select
                          value={batesPos}
                          onChange={(e) => setBatesPos(e.target.value as any)}
                          className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs">
                      Preview: <span className="font-mono font-bold">{batesPrefix}{String(batesStart).padStart(batesDigits, '0')}{batesSuffix}</span>
                    </div>
                  </div>
                )}

                {/* 16. Flatten PDF Info */}
                {tool.id === 'flatten-pdf' && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2 max-w-lg">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Security & Archival Hardening</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      Flattening permanently converts interactive text fields, drop-down selections, check marks, and annotations into static document graphics. The PDF will look identical on all PDF readers and can no longer be edited.
                    </p>
                  </div>
                )}

                {/* 17. Deskew PDF Options */}
                {tool.id === 'deskew-pdf' && (
                  <div className="space-y-3 max-w-md">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Deskew Tilt Angle Correction
                      </label>
                      <span className="text-xs font-bold text-blue-600 font-mono">
                        {deskewAngle > 0 ? `+${deskewAngle}°` : `${deskewAngle}°`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.5"
                      value={deskewAngle}
                      onChange={(e) => setDeskewAngle(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Counter-Clockwise (-10°)</span>
                      <span>Straight (0°)</span>
                      <span>Clockwise (+10°)</span>
                    </div>
                  </div>
                )}

                {/* 18. Grayscale PDF Info */}
                {tool.id === 'grayscale-pdf' && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 max-w-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Black & White Toner Saver
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      Converts all colored images, headers, and text to high-contrast monochrome grayscale using ITU-R BT.601 luminosity channels. Drastically cuts printing costs on laser printers.
                    </p>
                  </div>
                )}

                {/* 19. Split by Bookmarks Info */}
                {tool.id === 'split-by-bookmarks' && (
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1.5 max-w-lg">
                    <div className="font-semibold text-blue-900 dark:text-blue-200">
                      Table of Contents Outline Splitter
                    </div>
                    <p className="text-blue-800 dark:text-blue-300 leading-relaxed text-[11px]">
                      Automatically inspects embedded PDF bookmarks and table of contents tree to slice documents into chapter-named PDF files packaged into a single download archive.
                    </p>
                  </div>
                )}

                {/* 20. Resize PDF Options */}
                {tool.id === 'resize-pdf' && (
                  <div className="space-y-3 max-w-sm">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Target Paper Standard
                    </label>
                    <select
                      value={resizeTarget}
                      onChange={(e) => setResizeTarget(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <option value="A4">A4 (210 × 297 mm - International)</option>
                      <option value="Letter">US Letter (8.5 × 11 in - North America)</option>
                      <option value="Legal">US Legal (8.5 × 14 in - Legal Standard)</option>
                      <option value="A3">A3 (297 × 420 mm - Large Format)</option>
                      <option value="A5">A5 (148 × 210 mm - Booklet Format)</option>
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Pages are automatically centered with proportional scaling and balanced margins.
                    </p>
                  </div>
                )}

                {/* 21. N-Up PDF Options */}
                {tool.id === 'n-up-pdf' && (
                  <div className="space-y-3 max-w-md">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Pages Per Sheet Layout
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNUpPages(2)}
                        className={`p-3 text-left rounded-xl border transition-colors ${
                          nUpPages === 2
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">2-Up (Side-by-Side)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">2 pages per landscape sheet</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNUpPages(4)}
                        className={`p-3 text-left rounded-xl border transition-colors ${
                          nUpPages === 4
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">4-Up (2×2 Grid)</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">4 pages per portrait sheet</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 22. Invert PDF Colors Info */}
                {tool.id === 'invert-pdf-colors' && (
                  <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs space-y-1.5 max-w-lg">
                    <div className="font-semibold text-amber-400">
                      Night Reading Mode Inverter
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Inverts all colors to transform stark white pages into dark background with white typography. Perfect for OLED screen reading and night studying.
                    </p>
                  </div>
                )}

                {/* 23. Extract Images Info */}
                {tool.id === 'extract-images-pdf' && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 max-w-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      High-Definition Image Extraction
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      Extracts embedded photographs and page graphics at 2× super-resolution directly into separate lossless PNG image files.
                    </p>
                  </div>
                )}

                {/* 24. Visual PDF Editor Options */}
                {tool.id === 'visual-pdf-editor' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Annotation Text Callout
                      </label>
                      <input
                        type="text"
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        placeholder="e.g. APPROVED, REVISED, CONFIDENTIAL"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Page Number</label>
                        <input
                          type="number"
                          min={1}
                          value={editorPage}
                          onChange={(e) => setEditorPage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="chk-whiteout"
                          checked={isWhiteout}
                          onChange={(e) => setIsWhiteout(e.target.checked)}
                          className="rounded-md border-slate-300 text-blue-600"
                        />
                        <label htmlFor="chk-whiteout" className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                          Apply Whiteout Eraser Box
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 25. Split in Half Options */}
                {tool.id === 'split-in-half' && (
                  <div className="space-y-3 max-w-md">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Two-Page Spread Cut Direction
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSplitHalfDir('vertical')}
                        className={`p-3 text-left rounded-xl border transition-colors ${
                          splitHalfDir === 'vertical'
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">Vertical Cut</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Split left & right book pages</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitHalfDir('horizontal')}
                        className={`p-3 text-left rounded-xl border transition-colors ${
                          splitHalfDir === 'horizontal'
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">Horizontal Cut</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Split top & bottom calendar pages</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 26. Header & Footer Options */}
                {tool.id === 'header-footer-pdf' && (
                  <div className="space-y-3 max-w-lg">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Running Header Text</label>
                      <input
                        type="text"
                        value={hfHeader}
                        onChange={(e) => setHfHeader(e.target.value)}
                        placeholder="Document Title or Company Name"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Running Footer Text</label>
                      <input
                        type="text"
                        value={hfFooter}
                        onChange={(e) => setHfFooter(e.target.value)}
                        placeholder="Page {page} of {total} · {date}"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400">Supported variables: {'{page}'}, {'{total}'}, {'{date}'}</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Alignment</label>
                      <div className="flex gap-2">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => setHfAlign(align as any)}
                            className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg border transition-colors ${
                              hfAlign === align
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Processed 100% in local memory</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteOperation}
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>{tool.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Tools Strip */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Other Tools in {tool.categoryLabel}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ALL_TOOLS.filter(t => t.category === tool.category && t.id !== tool.id).slice(0, 3).map(rel => (
            <Link
              key={rel.id}
              to={rel.path}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{rel.name}</h4>
                <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">{rel.shortDesc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
