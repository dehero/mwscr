import { texts as coreTexts } from '../../core/texts/index.js';
import { appTexts } from './app-texts.js';
import { componentTexts } from './component-texts.js';
import { contentTexts } from './content-texts.js';
import { contributingTexts } from './contributing-texts.js';
import { editingTexts } from './editing-texts.js';
import { filteringTexts } from './filtering-texts.js';
import { highlightsTexts } from './highlights-texts.js';
import { supportTexts } from './support-texts.js';

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
