import type { IntlText } from '../entities/intl.ts';

export const guideTexts = {
  title: ['Guide', 'Руководство'],
  contents: ['Contents', 'Содержание'],
  filename: ['CONTRIBUTING.md', 'CONTRIBUTING.ru.md'],
  url: [
    'https://github.com/dehero/mwscr/blob/main/CONTRIBUTING.md',
    'https://github.com/dehero/mwscr/blob/main/CONTRIBUTING.ru.md',
  ],
} satisfies Record<string, IntlText>;
