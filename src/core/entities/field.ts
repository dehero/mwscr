import { z } from 'zod';

// Cross-entity field names in order of serialization
export const Field = z.enum([
  // Post
  'title',
  'titleRu',
  'description',
  'descriptionRu',
  'location',
  'content',
  'trash',
  'type',
  'author',
  'engine',
  'addon',
  'tags',
  'request',
  'reject',
  'mark',
  'violation',
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
  'name',
  'nameRu',
  'nameRuFrom',
  'admin',
  'profiles',

  // Location
  'cell',
]);

export type Field = z.infer<typeof Field>;

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
