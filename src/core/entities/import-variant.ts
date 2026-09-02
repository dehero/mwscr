export interface ImportVariant {
  label: string;
  labelRu: string;
  description: string;
  descriptionRu: string;
  allowedFormats: ImportVariantFormat[];
}

export interface ImportVariantFormat {
  label: string;
  mimeTypes: string[];
  maxSize?: number;
  minWidth?: number;
  minHeight?: number;
}
