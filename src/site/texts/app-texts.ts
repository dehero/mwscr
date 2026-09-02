import type { IntlText } from '../../core/entities/intl.js';

export const appTexts = {
  home: ['Home', 'Главная'],
  help: ['Help', 'Справка'],
  error: ['Error', 'Ошибка'],
  missing: ["This page doesn't exist.", 'Эта страница не существует.'],
  helpDescription: ['Information about Morrowind Screenshots project.', 'Информация о проекте Morrowind Screenshots.'],
  helpTopicDescription: [
    'Information about "{topicTitle}" in Morrowind Screenshots project.',
    'Информация о теме "{topicTitle}" проекта Morrowind Screenshots.',
  ],
  userDescription: [
    'Information, profiles, comments, posts, requests and statistics of "{title}" in Morrowind Screenshots project.',
    'Информация, профили, комментарии, посты, запросы и статистика участника "{title}" проекта Morrowind Screenshots.',
  ],
  usersDescription: [
    'List of members of Morrowind Screenshots project.',
    'Список участников проекта Morrowind Screenshots.',
  ],
  postsDescription: [
    'List of {managerTitle} in Morrowind Screenshots project.',
    'Список постов в разделе "{managerTitle}" проекта Morrowind Screenshots.',
  ],
  postDescription: [
    'Information, content, statistics and comments of {managerName} post "{title}" in Morrowind Screenshots project.',
    'Информация, контент, статистика и комментарии поста "{title}" в разделе "{managerName}" проекта Morrowind Screenshots.',
  ],
  imageEditor: ['Image Editor', 'Редактор изображений'],
  imageEditorDescription: [
    'Image editor for Morrowind Screenshots project.',
    'Редактор изображений проекта Morrowind Screenshots.',
  ],
  language: ['EN', 'RU'],
  title: ['Morrowind Screenshots', 'Morrowind Screenshots'],
  description: [
    'Original screenshots and videos from The Elder Scrolls III: Morrowind. No graphic and unlore mods. No color filters. No interface.',
    'Оригинальные скриншоты и видео из The Elder Scrolls III: Morrowind. Без графических и нелорных модов, цветовых фильтров и элементов интерфейса.',
  ],
  loadingPage: ['Loading Page', 'Загрузка страницы'],
  communityNotice: [
    '<author>dehero</author> and community <members>members</members>',
    '<author>dehero</author> и сообщество <members>участников</members>',
  ],
  licenseNotice: [
    'Licensed under <cc>CC-BY-4.0</cc> and <mit>MIT</mit>',
    'Распространяется по лицензиям <cc>CC-BY-4.0</cc> и <mit>MIT</mit>',
  ],
} satisfies Record<string, IntlText>;
