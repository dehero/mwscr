import type { IntlText } from '../entities/intl.js';

export const postViolationTexts = {
  inappropriateContent: ['Inappropriate content', 'Неподходящий контент'],
  jpegArtifacts: ['JPEG artifacts', 'Артефакты JPEG'],
  graphicIssues: ['Graphic issues', 'Графические проблемы'],
  noAntiAliasing: ['No anti-aliasing', 'Отсутствие сглаживания'],
  nonVanillaLook: ['Non-vanilla look', 'Неванильный вид'],
  usesMods: ['Uses or requires mods', 'Использование модов'],
  uiVisible: ['UI is visible', 'Видимый интерфейс'],
  unreachableResource: ['Unreachable resource', 'Недоступный ресурс'],
  unreachableResourceSolution: [
    'Check the link to have no mistypes and for being accessible without authorization.',
    'Проверьте, что в ссылке нет опечаток и что она доступна без авторизации.',
  ],
  unsupportedResource: ['Unsupported resource', 'Неподдерживаемый ресурс'],
  // TODO: update file formats
  unsupportedResourceSolution: [
    'Attach your work as PNG, MP4, AVI or ZIP file, respect file size restrictions.',
    'Прикрепите работу в формате PNG, MP4, AVI или ZIP, соблюдая ограничения на размер файла.',
  ],
} satisfies Record<string, IntlText>;
