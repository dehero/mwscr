import type { IntlText } from '../entities/intl.ts';

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
  close: ['Close', 'Закрыть'],
  copy: ['Copy', 'Копировать'],
  and: ['and', 'и'],
  language: ['EN', 'RU'],
} satisfies Record<string, IntlText>;
