import type { IntlText } from '../entities/intl.js';

export const userFilterTexts = {
  withSearch: ['with "{search}" in name or ID', 'с "{search}" в имени или ID'],
  sortedBy: ['sorted by "{label}" {direction}', 'с сортировкой по полю "{label}" {direction}'],
  asc: ['ascending', 'по возрастанию'],
  desc: ['descending', 'по убыванию'],
} satisfies Record<string, IntlText>;
