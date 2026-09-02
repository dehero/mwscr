import type { IntlText } from '../entities/intl.js';

export const userTexts = {
  admin: ['Administrator', 'Администратор'],
  adminUnit: [
    '{count, plural, one {administrator} other {administrators}}',
    '{count, plural, one {администратор} few {администратора} many {администраторов} other {администратора}}',
  ],
  author: ['Author', 'Автор'],
  authorUnit: [
    '{count, plural, one {author} other {authors}}',
    '{count, plural, one {автор} few {автора} many {авторов} other {автора}}',
  ],
  authors: ['Authors', 'Авторы'],
  beginner: ['Beginner', 'Новичок'],
  beginnerUnit: [
    '{count, plural, one {beginner} other {beginners}}',
    '{count, plural, one {новичок} few {новичка} many {новичков} other {новичка}}',
  ],
  commenter: ['Commenter', 'Комментатор'],
  commenterUnit: [
    '{count, plural, one {commenter} other {commenters}}',
    '{count, plural, one {комментатор} few {комментатора} many {комментаторов} other {комментатора}}',
  ],
  comments: ['Comments', 'Комментарии'],
  contribution: ['Contribution', 'Вклад в проект'],
  drawer: ['Drawer', 'Художник'],
  drawerUnit: [
    '{count, plural, one {drawer} other {drawers}}',
    '{count, plural, one {художник} few {художника} many {художников} other {художника}}',
  ],
  follower: ['Follower', 'Подписчик'],
  followerUnit: [
    '{count, plural, one {follower} other {followers}}',
    '{count, plural, one {подписчик} few {подписчика} many {подписчиков} other {подписчика}}',
  ],
  foreigner: ['Foreigner', 'Чужеземец'],
  foreignerUnit: [
    '{count, plural, one {foreigner} other {foreigners}}',
    '{count, plural, one {чужеземец} few {чужеземца} many {чужеземцев} other {чужеземца}}',
  ],
  locator: ['Locator', 'Искатель'],
  locatorUnit: [
    '{count, plural, one {locator} other {locators}}',
    '{count, plural, one {искатель} few {искателя} many {искателей} other {искателя}}',
  ],
  locators: ['Locators', 'Искатели'],
  requester: ['Requester', 'Запросивший'],
  requesterUnit: [
    '{count, plural, one {requester} other {requesters}}',
    '{count, plural, one {запросивший} few {запросивших} many {запросивших} other {запросившего}}',
  ],
  requesters: ['Requesters', 'Запросившие'],
  user: ['Member', 'Участник'],
  userUnit: [
    '{count, plural, one {community member} other {community members}}',
    '{count, plural, one {участник сообщества} few {участника сообщества} many {участников сообщества} other {участника сообщества}}',
  ],
  users: ['Members', 'Участники'],
  role: ['Role', 'Роль'],
  talkedToOrdinator: ['Talked to Ordinator', 'Говорил с Ординатором'],
  talkedToOrdinatorWithLink: ['Talked to <link>Ordinator</link>', 'Говорил с <link>Ординатором</link>'],
} satisfies Record<string, IntlText>;
