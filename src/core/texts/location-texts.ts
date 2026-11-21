import type { IntlText } from '../entities/intl.ts';

export const locationTexts = {
  title: ['Name', 'Название'],
  locations: ['Locations', 'Локации'],
  usage: ['Usage', 'Посещения'],
  interior: ['Interior', 'Интерьер'],
  exterior: ['Exterior', 'Экстерьер'],
  virtual: ['Group', 'Группа'],
  region: ['Region', 'Регион'],
} satisfies Record<string, IntlText>;
