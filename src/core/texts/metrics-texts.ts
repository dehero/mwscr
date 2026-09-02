import type { IntlText } from '../entities/intl.js';

export const metricsTexts = {
  rating: ['Rating', 'Рейтинг'],
  likes: ['Likes', 'Лайки'],
  views: ['Views', 'Просмотры'],
  comments: ['Comments', 'Комментарии'],
  authored: ['Authored', 'Автор'],
  commented: ['Commented', 'Прокомментировано'],
  engagement: ['Engagement', 'Вовлечённость'],
  averageContentScore: ['Average Content Score', 'Средняя оценка контента'],
  averageEngagement: ['Average Engagement', 'Средняя вовлечённость'],
  followers: ['Followers', 'Подписчики'],
  followersAtPublication: ['Followers', 'Подписчики'],
  followersCount: ['Followers Count', 'Число подписчиков'],
  repostsCount: ['Reposts Count', 'Число репостов'],
  summaryCommunityActivity: ['Total Community Response', 'Суммарный отклик сообщества'],
  recentPostsEngagement: ['Recent Posts Engagement', 'Последняя вовлечённость'],
  postCount: ['Post Count', 'Число постов'],
} satisfies Record<string, IntlText>;
