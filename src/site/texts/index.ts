import { texts as coreTexts } from '../../core/texts/index.ts';
import { appTexts } from './app-texts.ts';
import { componentTexts } from './component-texts.ts';
import { contentTexts } from './content-texts.ts';
import { contributingTexts } from './contributing-texts.ts';
import { editingTexts } from './editing-texts.ts';
import { filteringTexts } from './filtering-texts.ts';
import { highlightsTexts } from './highlights-texts.ts';
import { supportTexts } from './support-texts.ts';

export const texts = {
  ...coreTexts,
  app: appTexts,
  support: supportTexts,
  content: contentTexts,
  highlights: highlightsTexts,
  filtering: filteringTexts,
  editing: editingTexts,
  contributing: contributingTexts,
  component: componentTexts,
} as const;
