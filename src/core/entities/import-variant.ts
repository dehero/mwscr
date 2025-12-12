export interface ImportVariant {
  label: string;
  description: string;
  allowedFormats: ImportVariantFormat[];
}

export interface ImportVariantFormat {
  label: string;
  mimeTypes: string[];
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
}
