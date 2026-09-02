import type { IntlText } from '../entities/intl.js';

export const locationTexts = {
  locations: ['Locations', 'Локации'],
  usage: ['Usage', 'Посещения'],
  interior: ['Interior', 'Интерьер'],
  exterior: ['Exterior', 'Экстерьер'],
  virtual: ['Group', 'Группа'],
  region: ['Region', 'Регион'],
} satisfies Record<string, IntlText>;
