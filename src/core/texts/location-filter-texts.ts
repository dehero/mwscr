import type { IntlText } from '../entities/intl.ts';

export const locationFilterTexts = {
  visited: ['visited', '{count, plural, one {посещённая} few {посещённые} many {посещённых} other {посещённой}}'],
  unvisited: [
    'unvisited',
    '{count, plural, one {непосещённая} few {непосещённые} many {непосещённых} other {непосещённой}}',
  ],
  locationUnit: ['location', '{count, plural, one {локация} few {локации} many {локаций} other {локации}}'],
  interiorUnit: ['interior', '{count, plural, one {интерьер} few {интерьера} many {интерьеров} other {интерьера}}'],
  exteriorUnit: ['exterior', '{count, plural, one {экстерьер} few {экстерьера} many {экстерьеров} other {экстерьера}}'],
  regionUnit: ['region', '{count, plural, one {регион} few {региона} many {регионов} other {региона}}'],
  groupUnit: ['group', '{count, plural, one {группа} few {группы} many {групп} other {группы}}'],
  withSearch: ['with "{search}" in title', 'с "{search}" в названии'],
  sortedBy: ['sorted by "{label}" {direction}', 'с сортировкой по полю "{label}" {direction}'],
  asc: ['ascending', 'по возрастанию'],
  desc: ['descending', 'по убыванию'],
} satisfies Record<string, IntlText>;
