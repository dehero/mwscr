import importFormatsRaw from '../../../../assets/import-variants.json' with { type: 'json' };
import type { ImportVariant } from '../../../core/entities/import-variant.ts';

export const importVariants = importFormatsRaw as Record<string, ImportVariant>;
