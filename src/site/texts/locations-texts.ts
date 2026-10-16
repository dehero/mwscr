import type { IntlText } from '../../core/entities/intl.ts';

export const locationsTexts = {
  random: ['Random Location', 'Случайная локация'],
  coverage: ['Coverage', 'Покрытие'],
  visited: ['Visited', 'Посещённые'],
  unvisited: ['Unvisited', 'Непосещённые'],
  visitedSummary: ['Visited {count} of {total} locations', 'Посещено {count} из {total} локаций'],
  selectLocation: ['Select a location in the list or on the map.', 'Выберите локацию в списке или на карте.'],
  quickTravel: ['Quick Travel', 'Быстрое перемещение'],
  postsInLocation: ['Posts in This Location', 'Посты в этой локации'],
  noLocations: ['No locations', 'Нет локаций'],
} satisfies Record<string, IntlText>;
