import type { Post } from './post.js';
import { mergePostTags, PostAddon, PostEngine } from './post.js';

type PostTagDescriptor = [tag: string, rule: (post: Post) => boolean, parse?: (post: Post) => void];

export const DEFAULT_TAGS: PostTagDescriptor[] = [
  ['morrowind', () => true],
  ['elderscrolls', () => true],
  [
    'drawing',
    (post) => ['redrawing'].includes(post.type),
    (post) => (post.type = ['redrawing'].includes(post.type) ? post.type : 'shot'),
  ],
  [
    'screenshot',
    (post) => ['shot', 'shot-set', 'redrawing'].includes(post.type),
    (post) => (post.type = ['shot', 'shot-set', 'redrawing'].includes(post.type) ? post.type : 'shot'),
  ],
  [
    'footage',
    (post) => ['clip', 'video'].includes(post.type),
    (post) => (post.type = ['clip', 'video'].includes(post.type) ? post.type : 'clip'),
  ],
  [
    'wallpaper',
    (post) => ['wallpaper', 'wallpaper-v'].includes(post.type),
    (post) => (post.type = ['wallpaper', 'wallpaper-v'].includes(post.type) ? post.type : 'wallpaper'),
  ],
  ...PostAddon.options.map(
    (tag): PostTagDescriptor => [tag, (post) => post.addon === tag, (post) => (post.addon = post.addon || tag)],
  ),
  ...PostEngine.options.map(
    (tag): PostTagDescriptor => [tag, (post) => post.engine === tag, (post) => (post.engine = post.engine || tag)],
  ),
];

export function createPostTags(post: Post): string[] {
  const result: string[] = [];

  for (const [tag, rule] of DEFAULT_TAGS) {
    if (rule(post)) {
      result.push(tag);
    }
  }

  if (post.tags) {
    result.push(...post.tags);
  }

  return [...new Set(result)].map((tag) => tag.toLowerCase());
}

export function stripPostTags(post: Post) {
  const excludeTags: string[] = [];
  for (const [tag, , parse] of DEFAULT_TAGS) {
    if (post.tags?.includes(tag)) {
      parse?.(post);
      excludeTags.push(tag);
    }
  }

  post.tags = mergePostTags(post.tags?.filter((tag) => !excludeTags.includes(tag)));
}
