import type { IntlText } from '../entities/intl.js';

export const commonTexts = {
  all: ['All', 'Все'],
  any: ['Any', 'Любой'],
  none: ['None', 'Нет'],
  yes: ['Yes', 'Да'],
  no: ['No', 'Нет'],
  original: ['Original', 'Оригинал'],
  date: ['Date', 'Дата'],
  asc: ['Asc', 'Возр'],
  desc: ['Desc', 'Убыв'],
  added: ['Added', 'Добавлено'],
  changed: ['Changed', 'Изменено'],
  removed: ['Removed', 'Удалено'],
  ok: ['OK', 'OK'],
  cancel: ['Cancel', 'Отмена'],
  copy: ['Copy', 'Копировать'],
  and: ['and', 'и'],
} satisfies Record<string, IntlText>;
