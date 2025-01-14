import { z } from 'zod';
import { listItems } from '../utils/common-utils.js';
import {
  getPostTypesFromContent,
  Post,
  PostAuthor,
  PostContent,
  PostMark,
  PostRequest as PostRequestField,
  PostTitle,
  PostTitleRu,
  PostType,
  PostViolation,
} from './post.js';
import { ImageResourceUrl, VideoResourceUrl } from './resource.js';
import { checkRules } from './rule.js';

export type PostCheck<TPost extends Post> = (post: Post, errors?: string[]) => post is TPost;

export const ViolatingPost = Post.extend({ violation: PostViolation });
export const OrdinaryPost = Post.extend({ mark: PostMark.extract(['D', 'F']) });
export const RevisitablePost = Post.extend({ mark: PostMark.extract(['F']) });
export const TrashItem = z.union([ViolatingPost, OrdinaryPost]);

export const PostDraft = Post.extend({ content: PostContent, author: PostAuthor });
export const PostRequest = Post.extend({ request: PostRequestField });
export const InboxItem = z.union([PostDraft, PostRequest]);

export const TrashOrInboxItem = z.union([TrashItem, InboxItem]);

export const PublishablePost = z.intersection(
  Post.extend({
    title: PostTitle,
    titleRu: PostTitleRu,
    author: PostAuthor,
    mark: PostMark.extract(['A1', 'A2', 'B1', 'B2', 'C', 'E']),
  }),
  // https://github.com/colinhacks/zod/issues/2524
  Post.extend({
    content: PostContent,
  }).superRefine((value, ctx) => {
    const possibleTypes = getPostTypesFromContent(value.content);

    if (!possibleTypes.includes(value.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          possibleTypes.length === 0
            ? 'Unable to detect possible post type from content'
            : `Detected post type ${listItems(possibleTypes, true)}, got "${value.type}"`,
      });
    }
  }),
);

const BasePublishablePost = Post.extend({
  title: PostTitle,
  titleRu: PostTitleRu,
  author: PostAuthor,
  mark: PostMark.extract(['A1', 'A2', 'B1', 'B2', 'C', 'E']),
});

export const ShotPost = BasePublishablePost.extend({ type: PostType.extract(['shot']), content: ImageResourceUrl });
export const ShotSetPost = BasePublishablePost.extend({
  type: PostType.extract(['shot-set']),
  content: z.tuple([ImageResourceUrl, ImageResourceUrl, ImageResourceUrl, ImageResourceUrl]),
});
export const RedrawingPost = BasePublishablePost.extend({
  type: PostType.extract(['redrawing']),
  content: z.tuple([ImageResourceUrl, ImageResourceUrl]),
});
export const WallpaperPost = BasePublishablePost.extend({
  type: PostType.extract(['wallpaper']),
  content: ImageResourceUrl,
});
export const WallpaperVPost = BasePublishablePost.extend({
  type: PostType.extract(['wallpaper-v']),
  content: ImageResourceUrl,
});
export const VideoPost = BasePublishablePost.extend({ type: PostType.extract(['video']), content: VideoResourceUrl });
export const ClipPost = BasePublishablePost.extend({ type: PostType.extract(['clip']), content: VideoResourceUrl });

export const PublishablePostTest = z.discriminatedUnion('type', [
  ShotPost,
  ShotSetPost,
  RedrawingPost,
  WallpaperPost,
  WallpaperVPost,
  VideoPost,
  ClipPost,
]);

export type ViolatingPost = z.infer<typeof ViolatingPost>;
export type OrdinaryPost = z.infer<typeof OrdinaryPost>;
export type RevisitablePost = z.infer<typeof RevisitablePost>;
export type TrashItem = z.infer<typeof TrashItem>;
export type PostDraft = z.infer<typeof PostDraft>;
export type PostRequest = z.infer<typeof PostRequest>;
export type InboxItem = z.infer<typeof InboxItem>;
export type PublishablePost = z.infer<typeof PublishablePost>;

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
