import type { IntlText } from '../../core/entities/intl.js';

export const contributingTexts = {
  contribute: ['Contribute', 'Участвовать'],
  contributing: ['Contributing', 'Участие'],
  guidelines: ['Contributing Guidelines', 'Руководство для участников'],
  variants: ['Variants', 'Варианты'],
  settings: ['Settings', 'Настройки'],
  submitFiles: ['Submit Files', 'Отправить файлы'],
  submitFilesDescription: ['Add your images or videos to Drafts.', 'Добавьте изображения или видео в черновики.'],
  createCompilation: ['Create Compilation', 'Создать подборку'],
  createCompilationDescription: [
    'Combine published shots into your own compilation.',
    'Объедините опубликованные кадры в собственную подборку.',
  ],
  requestThemedPost: ['Request Themed Post', 'Заказать тематический пост'],
  requestThemedPostDescription: [
    'Ask the authors to make a certain post.',
    'Попросите авторов сделать пост на определённую тему.',
  ],
  findMissingLocation: ['Find Missing Location', 'Указать локацию для поста'],
  findMissingLocationDescription: [
    'Suggest shooting location of screenshot or video if not specified in the post.',
    'Предложите место съёмки скриншота или видео, если оно не указано в посте.',
  ],
} satisfies Record<string, IntlText>;
