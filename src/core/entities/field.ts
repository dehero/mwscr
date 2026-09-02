import type { InferOutput } from 'valibot';
import { picklist } from 'valibot';
import { texts } from '../texts/index.js';
import { localize } from '../utils/intl-utils.js';
import type { Locale } from './intl.js';

// Cross-entity field names in order of serialization
export const Field = picklist([
  // Post
  'title',
  'titleRu',
  'description',
  'descriptionRu',
  'placement',
  'location',
  'content',
  'snapshot',
  'trash',
  'type',
  'aspect',
  'author',
  'locating',
  'created',
  'engine',
  'addon',
  'tags',
  'request',
  'reject',
  'mark',
  'violation',
  'announcement',
  'posts',

  // Request
  'date',
  'user',
  'text',

  // Publication
  'service',
  'id',
  'code',
  'mediaId',
  'published',
  'updated',
  'followers',
  'likes',
  'views',
  'reposts',
  'comments',

  // User
  'accessHash',
  'username',
  'botChatId',
  'name',
  'nameRu',
  'nameRuFrom',
  'avatar',
  'admin',
  'profiles',
  'deleted',
  'followed',
  'unfollowed',

  // Location
  'cell',
]);

export type Field = InferOutput<typeof Field>;

export function getFieldTitle(field: unknown, locale: Locale) {
  if (typeof field !== 'string') {
    return String(field);
  }

  const descriptor = texts.field[field as keyof typeof texts.field];
  return localize(descriptor, locale);
}
