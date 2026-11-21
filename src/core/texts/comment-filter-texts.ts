import type { IntlText } from '../entities/intl.ts';

export const commentFilterTexts = {
  sorted: ['sorted {direction}', 'с сортировкой {direction}'],
  withSearch: ['with "{search}" in comment text', 'с текстом комментария "{search}"'],
  withService: ['on {service}', 'в сервисе {service}'],
} satisfies Record<string, IntlText>;
