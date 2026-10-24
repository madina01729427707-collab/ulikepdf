export type ToolCategory = 'organize' | 'optimize' | 'convert' | 'edit' | 'security';

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  path: string;
  shortDesc: string;
  fullDesc: string;
  category: ToolCategory;
  categoryLabel: string;
  iconName: string;
  acceptedFileTypes: string[];
  maxFiles: number;
  outputFormat: string;
  isPopular?: boolean;
  status: 'available' | 'partial' | 'client_notice';
  limitations?: string;
  badge?: string;
}

export type ProcessingStatus = 'idle' | 'preparing' | 'processing' | 'success' | 'error';

export interface ProcessedResult {
  fileName: string;
  downloadUrl: string;
  blob: Blob;
  sizeBytes: number;
  originalSizeBytes?: number;
  pageCount?: number;
  extraInfo?: string;
}
