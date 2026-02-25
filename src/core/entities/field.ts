import type { InferOutput } from 'valibot';
import { picklist } from 'valibot';

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

interface FieldDescriptor {
  title: string;
}

export const fieldDescriptors = Object.freeze<Record<string, FieldDescriptor>>({
  title: { title: 'English title' },
  titleRu: { title: 'Russian title' },
  description: { title: 'English description' },
  descriptionRu: { title: 'Russian description' },
  nameRu: { title: 'Russian name' },
  nameRuFrom: { title: 'Russian name in genitive' },
  mark: { title: "Editor's mark" },
});

export function getFieldTitle(field: string | number) {
  return fieldDescriptors[field]?.title ?? field.toString();
}
