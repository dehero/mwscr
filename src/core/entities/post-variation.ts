import type { InferOutput } from 'valibot';
import { literal, object, picklist, tuple, union, variant } from 'valibot';
import {
  Post,
  PostAuthor,
  PostContent,
  PostRequest as PostRequestField,
  PostTitle,
  PostTitleRu,
  PostViolation,
} from './post.js';
import { ImageResourceUrl, VideoResourceUrl } from './resource.js';
import { checkRules } from './rule.js';

export const ViolatingPost = object({ ...Post.entries, violation: PostViolation });
export const OrdinaryPost = object({ ...Post.entries, mark: picklist(['D', 'F']) });
export const RevisitablePost = object({ ...Post.entries, mark: picklist(['F']) });
export const TrashItem = union([ViolatingPost, OrdinaryPost]);

export const PostDraft = object({ ...Post.entries, content: PostContent, author: PostAuthor });
export const PostRequest = object({ ...Post.entries, request: PostRequestField });
export const InboxItem = union([PostDraft, PostRequest]);

export const TrashOrInboxItem = union([TrashItem, InboxItem]);

const BasePublishablePost = object({
  ...Post.entries,
  title: PostTitle,
  titleRu: PostTitleRu,
  author: PostAuthor,
  content: PostContent,
  mark: picklist(['A1', 'A2', 'B1', 'B2', 'C', 'E']),
});

export const ShotPost = object({
  ...BasePublishablePost.entries,
  type: literal('shot'),
  content: ImageResourceUrl,
});
export const ShotSetPost = object({
  ...BasePublishablePost.entries,
  type: literal('shot-set'),
  content: tuple(
    [ImageResourceUrl, ImageResourceUrl, ImageResourceUrl, ImageResourceUrl],
    'Should be 4 shot resources',
  ),
});
export const RedrawingPost = object({
  ...BasePublishablePost.entries,
  type: literal('redrawing'),
  content: tuple([ImageResourceUrl, ImageResourceUrl], 'Should be a tuple of drawing and shot resources'),
});
export const WallpaperPost = object({
  ...BasePublishablePost.entries,
  type: literal('wallpaper'),
  content: ImageResourceUrl,
});
export const WallpaperVPost = object({
  ...BasePublishablePost.entries,
  type: literal('wallpaper-v'),
  content: ImageResourceUrl,
});
export const VideoPost = object({
  ...BasePublishablePost.entries,
  type: literal('video'),
  content: VideoResourceUrl,
});
export const ClipPost = object({
  ...BasePublishablePost.entries,
  type: literal('clip'),
  content: VideoResourceUrl,
});

const PublishablePost = variant('type', [
  ShotPost,
  ShotSetPost,
  RedrawingPost,
  WallpaperPost,
  WallpaperVPost,
  VideoPost,
  ClipPost,
]);

export type ViolatingPost = InferOutput<typeof ViolatingPost>;
export type OrdinaryPost = InferOutput<typeof OrdinaryPost>;
export type RevisitablePost = InferOutput<typeof RevisitablePost>;
export type TrashItem = InferOutput<typeof TrashItem>;
export type PostDraft = InferOutput<typeof PostDraft>;
export type PostRequest = InferOutput<typeof PostRequest>;
export type InboxItem = InferOutput<typeof InboxItem>;
export type PublishablePost = InferOutput<typeof PublishablePost>;

export function isRevisitablePost(post: Post, errors?: string[]): post is RevisitablePost {
  return checkRules([RevisitablePost], post, errors);
}

export function isTrashItem(post: Post, errors?: string[]): post is TrashItem {
  return checkRules([TrashItem], post, errors);
}

export function isPublishablePost(post: Post, errors?: string[]): post is PublishablePost {
  return checkRules([PublishablePost], post, errors);
}

export function isPostRequest(post: Post, errors?: string[]): post is PostRequest {
  return checkRules([PostRequest], post, errors);
}

export function isInboxItem(post: Post, errors?: string[]): post is InboxItem {
  return checkRules([InboxItem], post, errors);
}

export function isTrashOrInboxItem(post: Post, errors?: string[]): post is TrashItem | InboxItem {
  return checkRules([TrashOrInboxItem], post, errors);
}

export function getPublishedPostChunkName(id: string) {
  const chunkName = id.split('-')[0];

  if (!chunkName) {
    throw new Error(`Cannot get year from post id: ${id}`);
  }
  return chunkName;
}

export function getPostDraftChunkName(id: string) {
  return id.split('.')[1]?.split('-')[0] ?? new Date().getFullYear().toString();
}

// try {
//   const result = parse(PublishablePost, {
//     content: [
//       'store:/inbox/dehero.2024-09-21-11-34-14.png',
//       'store:/inbox/dehero.2024-09-21-11-33-54.png',
//       'store:/inbox/dehero.2024-09-21-11-33-50.png',
//     ],
//     type: 'shot-set',
//     author: 'dehero',
//   });

//   console.log(result);
// } catch (error: unknown) {
//   console.log(JSON.stringify(error));
// }
