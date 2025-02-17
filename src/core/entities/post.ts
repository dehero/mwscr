import type { InferOutput } from 'valibot';
import { array, date, is, nonEmpty, object, optional, picklist, pipe, string, transform, trim, union } from 'valibot';
import type { SortDirection } from '../utils/common-types.js';
import { arrayFromAsync, asArray, cleanupUndefinedProps } from '../utils/common-utils.js';
import { dateToString, isDateInRange, stringToDate } from '../utils/date-utils.js';
import { areNestedLocations as areRelatedLocations } from './location.js';
import type { MediaAspectRatio } from './media.js';
import { postTitleFromString } from './post-title.js';
import { PostVariant } from './post-variant.js';
import type { PublicationComment } from './publication.js';
import {
  getPublicationEngagement,
  getPublicationsAverageEngagement,
  getPublicationsTotalFollowers,
  getPublicationsTotalLikes,
  getPublicationsTotalViews,
  isPublicationEqual,
  mergePublications,
  Publication,
} from './publication.js';
import { RESOURCE_MISSING_IMAGE, RESOURCE_MISSING_VIDEO, ResourceUrl } from './resource.js';
import { USER_DEFAULT_AUTHOR } from './user.js';

export const POST_RECENTLY_PUBLISHED_DAYS = 31;

export const PostTitle = pipe(string(), trim(), nonEmpty(), transform(postTitleFromString));
export const PostTitleRu = pipe(string(), trim(), nonEmpty());
export const PostDescription = pipe(string(), trim(), nonEmpty());
export const PostContent = union([ResourceUrl, array(ResourceUrl)]);
export const PostLocation = union([pipe(string(), nonEmpty()), array(pipe(string(), nonEmpty()))]);
export const PostPlacement = picklist(['Indoors', 'Outdoors', 'Mixed']);
export const PostType = picklist(PostVariant.options.map((type) => type.entries.type.literal));
export const PostAddon = picklist(['Tribunal', 'Bloodmoon']);
export const PostEngine = picklist(['OpenMW', 'Vanilla']);
export const PostMark = picklist(['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F']);
export const PostViolation = picklist([
  'inappropriate-content',
  'jpeg-artifacts',
  'graphic-issues',
  'no-anti-aliasing',
  'non-vanilla-look',
  'uses-mods',
  'ui-visible',
  'unclear-request',
  'unreachable-resource',
  'unsupported-resource',
]);
export const PostAuthor = union([pipe(string(), nonEmpty()), array(pipe(string(), nonEmpty()))]);
export const PostTag = pipe(string(), nonEmpty());
export const PostRequest = object({ date: date(), user: pipe(string(), nonEmpty()), text: pipe(string(), nonEmpty()) });

export const Post = pipe(
  object({
    title: optional(PostTitle),
    titleRu: optional(PostTitleRu),
    description: optional(PostDescription),
    descriptionRu: optional(PostDescription),
    location: optional(PostLocation),
    placement: optional(PostPlacement),
    content: optional(PostContent),
    trash: optional(PostContent),
    type: PostType,
    author: optional(PostAuthor),
    tags: optional(array(PostTag)),
    engine: optional(PostEngine),
    addon: optional(PostAddon),
    request: optional(PostRequest),
    mark: optional(PostMark),
    violation: optional(PostViolation),
    posts: optional(array(Publication)),
  }),
  transform((input) => {
    const excludeTags: string[] = [];

    for (const [tag, , parse] of defaultTags) {
      if (input.tags?.includes(tag)) {
        parse?.(input);
        excludeTags.push(tag);
      }
    }

    input.tags = mergePostTags(input.tags?.filter((tag) => !excludeTags.includes(tag)));

    return cleanupUndefinedProps(input);
  }),
);

export type PostTitle = InferOutput<typeof PostTitle>;
export type PostTitleRu = InferOutput<typeof PostTitleRu>;
export type PostDescription = InferOutput<typeof PostDescription>;
export type PostContent = InferOutput<typeof PostContent>;
export type PostLocation = InferOutput<typeof PostLocation>;
export type PostPlacement = InferOutput<typeof PostPlacement>;
export type PostType = InferOutput<typeof PostType>;
export type PostAddon = InferOutput<typeof PostAddon>;
export type PostEngine = InferOutput<typeof PostEngine>;
export type PostMark = InferOutput<typeof PostMark>;
export type PostViolation = InferOutput<typeof PostViolation>;
export type PostAuthor = InferOutput<typeof PostAuthor>;
export type PostTag = InferOutput<typeof PostTag>;
export type PostRequest = InferOutput<typeof PostRequest>;

export type Post = InferOutput<typeof Post>;

export type PostEntry<TPost extends Post = Post> = [id: string, post: TPost, refId?: string];
export type PostEntries<TPost extends Post = Post> = ReadonlyArray<PostEntry<TPost>>;
export type PostEntriesComparator = (a: PostEntry, b: PostEntry) => number;
export type PostFilter<TPost extends Post, TFilteredPost extends TPost> = (post: Post) => post is TFilteredPost;

export type PostSource<TPost extends Post> = () => AsyncGenerator<PostEntry<TPost>>;

export interface PostComment extends PublicationComment {
  service: string;
}

export interface PostDistance {
  id: string | undefined;
  distance: number;
  message: string;
}

interface PostTypeDescriptor {
  title: string;
  titleRu: string;
  letter: string;
  aspectRatio: MediaAspectRatio;
}

interface PostMarkDescriptor {
  score: number;
}

export interface PostViolationDescriptor {
  title: string;
  letter: string;
  solution?: string;
  reference?: string;
}

type PostTagDescriptor = [tag: PostTag, rule: (post: Post) => boolean, parse?: (post: Post) => void];

const defaultTags = Object.freeze<PostTagDescriptor[]>([
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
]);

export const postTypeDescriptors = Object.freeze<Record<PostType, PostTypeDescriptor>>({
  shot: { title: 'Shot', titleRu: 'Кадр', letter: 'S', aspectRatio: '1/1' },
  'shot-set': { title: 'Shot-Set', titleRu: 'Подборка', letter: 'H', aspectRatio: '1/1' },
  video: { title: 'Video', titleRu: 'Видео', letter: 'V', aspectRatio: '16/9' },
  clip: { title: 'Clip', titleRu: 'Клип', letter: 'C', aspectRatio: '1/1' },
  redrawing: { title: 'Redrawing', titleRu: 'Перерисовка', letter: 'R', aspectRatio: '1/1' },
  wallpaper: { title: 'Wallpaper', titleRu: 'Обои', letter: 'W', aspectRatio: '16/9' },
  'wallpaper-v': { title: 'Vertical Wallpaper', titleRu: 'Вертикальные обои', letter: 'M', aspectRatio: '9/19.5' },
});

export const postMarkDescriptors = Object.freeze<Record<PostMark, PostMarkDescriptor>>({
  A1: { score: 5 },
  A2: { score: 4 },
  B1: { score: 3 },
  B2: { score: 2 },
  C: { score: 1 },
  D: { score: -2 },
  E: { score: 0 },
  F: { score: -1 },
});

export const postViolationDescriptors = Object.freeze<Record<PostViolation, PostViolationDescriptor>>({
  'inappropriate-content': { title: 'Inappropriate content', letter: 'C' },
  'jpeg-artifacts': { title: 'JPEG artifacts', letter: 'J' },
  'graphic-issues': { title: 'Graphic issues', letter: 'G' },
  'no-anti-aliasing': { title: 'No anti-aliasing', letter: 'A' },
  'non-vanilla-look': { title: 'Non-vanilla look', letter: 'N' },
  'uses-mods': {
    title: 'Uses or requires mods',
    reference: 'https://mwscr.dehero.site/help/no-mods/',
    letter: 'M',
  },
  'ui-visible': {
    title: 'UI is visible',
    reference: 'https://mwscr.dehero.site/help/no-ui/',
    letter: 'U',
  },
  'unclear-request': {
    title: 'Unclear request',
    letter: 'Q',
  },
  'unreachable-resource': {
    title: 'Unreachable resource',
    solution: 'Check the link to have no mistypes and for being acceptable without authorization.',
    letter: 'R',
  },
  'unsupported-resource': {
    title: 'Unsupported resource',
    solution: 'Attach your work as PNG, MP4, AVI or ZIP file, respect file size restrictions.',
    reference: 'https://mwscr.dehero.site/help/file-format/',
    letter: 'R',
  },
});

export function getPostTotalLikes(post: Post) {
  return post.posts?.reduce((acc, post) => acc + (post.likes ?? 0), 0) ?? 0;
}

export function getPostTotalViews(post: Post) {
  return post.posts?.reduce((acc, post) => acc + (post.views ?? 0), 0) ?? 0;
}

export function getPostMaxFollowers(post: Post) {
  const services = new Set(post.posts?.map((post) => post.service) ?? []);

  return [...services].reduce(
    (acc, service) =>
      acc +
      Math.max(...(post.posts?.filter((post) => post.service === service).map((post) => post.followers ?? 0) ?? [])),
    0,
  );
}

export function getPostRating(post: Post) {
  const ratings: number[] =
    post.posts?.map((post) => getPublicationEngagement(post)).filter((rating) => rating > 0) ?? [];
  // Need at least 2 posting service ratings to calculate average rating
  if (ratings.length < 2) {
    return 0;
  }

  return ratings.reduce((acc, number) => acc + number, 0) / ratings.length;
}

export function getAllPostCommentsSorted(publications: Publication[] | undefined): PostComment[] {
  return (
    publications
      ?.flatMap(
        (publication) =>
          publication.comments?.map((comment) => ({
            ...comment,
            service: publication.service,
            replies: [...(comment.replies ?? [])].sort((a, b) => a.datetime.getTime() - b.datetime.getTime()),
          })) ?? [],
      )
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime()) ?? []
  );
}

export function getPostCommentCount(post: Post) {
  return (
    post.posts?.reduce(
      (total, publication) =>
        total + (publication.comments?.reduce((total, comment) => total + 1 + (comment.replies?.length ?? 0), 0) ?? 0),
      0,
    ) || 0
  );
}

export function getPostFirstPublished(post: Pick<Post, 'posts'>) {
  return post.posts ? new Date(Math.min(...post.posts.map((post) => post.published.getTime()))) : undefined;
}

export function getPostLastPublished(post: Pick<Post, 'posts'>) {
  return post.posts ? new Date(Math.max(...post.posts.map((post) => post.published.getTime()))) : undefined;
}

export function getPostEntryPublications([id, post]: PostEntry) {
  const date = getPostDateById(id);
  if (!date) {
    return [];
  }

  const secondDate = new Date(date);
  secondDate.setDate(secondDate.getDate() + POST_RECENTLY_PUBLISHED_DAYS);

  return post.posts?.filter((post) => isDateInRange(post.published, [date, secondDate], 'date')) ?? [];
}

export function getPostEntryStats(entry: PostEntry) {
  const publications = getPostEntryPublications(entry);

  return {
    likes: getPublicationsTotalLikes(publications),
    followers: getPublicationsTotalFollowers(publications),
    views: getPublicationsTotalViews(publications),
    engagement: getPublicationsAverageEngagement(publications),
  };
}

export function getPostMarkFromScore(score?: number) {
  if (typeof score === 'undefined') {
    return;
  }
  const integerScore = Math.round(score);

  return PostMark.options.find((mark) => postMarkDescriptors[mark].score === integerScore);
}

export function isPostEqual(a: Post, b: Partial<Post>): boolean {
  const date1 = getPostFirstPublished(b);
  const date2 = getPostFirstPublished(a);

  return a.posts && b.posts
    ? b.posts.some(
        (partialPublication) => a.posts?.some((publication) => isPublicationEqual(publication, partialPublication)),
      )
    : b.type === a.type &&
        date1 instanceof Date &&
        date2 instanceof Date &&
        dateToString(date1) === dateToString(date2);
}

export function getPostTypeFromContent(content?: PostContent): PostType | undefined {
  return PostVariant.options.find((variant) => is(variant.entries.content, content))?.entries.type.literal;
}

export function getPostContentDistance(content: PostContent, postEntries: PostEntries): PostDistance {
  const urls = asArray(content);
  let distance = 0;

  for (const [id, post] of postEntries) {
    const postContent = [...asArray(post.content), ...asArray(post.trash)];

    for (const url of urls) {
      if (postContent.includes(url)) {
        return { id, distance, message: `found content "${url}" in "${id}" at distance ${distance}` };
      }
    }

    distance++;
  }

  return { id: undefined, distance: Infinity, message: 'content not used before' };
}

export function getPostTypeDistance(type: PostType, postEntries: PostEntries): PostDistance {
  let distance = 0;

  for (const [id, post] of postEntries) {
    if (post.type === type) {
      return { id, distance, message: `found type "${type}" in "${id}" at distance ${distance}` };
    }

    distance++;
  }

  return { id: undefined, distance: Infinity, message: 'type not used before' };
}

export function getPostAuthorDistance(author: PostAuthor, postEntries: PostEntries): PostDistance {
  const authors = asArray(author).filter((author) => author !== USER_DEFAULT_AUTHOR);
  let distance = 0;

  for (const [id, post] of postEntries) {
    const postAuthors = asArray(post.author).filter((author) => author !== USER_DEFAULT_AUTHOR);

    for (const author of authors) {
      if (postAuthors.includes(author)) {
        return { id, distance, message: `found author "${author}" in "${id}" at distance ${distance}` };
      }
    }

    distance++;
  }

  return { id: undefined, distance: Infinity, message: "author haven't posted before" };
}

export function getPostMarkDistance(mark: PostMark, postEntries: PostEntries): PostDistance {
  let distance = 0;
  for (const [id, post] of postEntries) {
    if (post.mark === mark) {
      return { id, distance, message: `found mark ${mark} in "${id}" at distance ${distance}` };
    }

    distance++;
  }

  return { id: undefined, distance: Infinity, message: 'mark not used before' };
}

export function getPostRelatedLocationDistance(location: PostLocation, postEntries: PostEntries): PostDistance {
  let distance = 0;
  for (const [id, post] of postEntries) {
    if (post.location) {
      const locations = asArray(location);

      for (const location of locations) {
        const relatedLocation = asArray(post.location).find((postLocation) =>
          areRelatedLocations(postLocation, location),
        );
        if (relatedLocation) {
          return {
            id,
            distance,
            message: `found location "${relatedLocation}" similar to "${location}" in "${id}" at distance ${distance}`,
          };
        }
      }
    }

    distance++;
  }

  return { id: undefined, distance: Infinity, message: 'location not used before' };
}

export function getPostDrawer(post: Post) {
  return post.type === 'redrawing' ? asArray(post.author)[0] : undefined;
}

export function mergePostWith(post: Post, withPost: Post) {
  post.title = post.title || withPost.title;
  post.titleRu = post.titleRu || withPost.titleRu;
  post.description = post.description || withPost.description;
  post.descriptionRu = post.descriptionRu || withPost.descriptionRu;
  post.content = mergePostContents(post.content, withPost.content);
  post.trash = mergePostContents(post.trash, withPost.trash);
  post.tags = mergePostTags(post.tags, withPost.tags);
  post.engine = post.engine || withPost.engine;
  post.addon = post.addon || withPost.addon;
  post.author = mergeAuthors(post.author, withPost.author);
  post.location = mergePostLocations(post.location, withPost.location);
  post.placement = mergePostPlacements(post.placement, withPost.placement);
  post.request = mergePostRequests(post.request, withPost.request);
  post.mark = post.mark || withPost.mark;
  post.violation = post.violation || withPost.violation;
  post.posts = mergePublications(post.posts, withPost.posts);
}

export function mergeAuthors(author1: PostAuthor | undefined, author2?: PostAuthor | undefined) {
  const result = [...asArray(author1)];
  const users2 = asArray(author2);

  for (const user2 of users2) {
    if (!result.includes(user2)) {
      result.push(user2);
    }
  }

  return result.length > 0 ? (result.length === 1 ? result[0] : result) : undefined;
}

export function mergePostContents(content1: PostContent | undefined, content2?: PostContent | undefined) {
  const result = [...asArray(content1)];
  const urls2 = asArray(content2);

  for (const url2 of urls2) {
    if (url2 === RESOURCE_MISSING_IMAGE || url2 === RESOURCE_MISSING_VIDEO) {
      continue;
    }
    if (!result.includes(url2)) {
      result.push(url2);
    }
  }

  return result.length > 0 ? (result.length === 1 ? result[0] : result) : undefined;
}

export function mergePostRequests(
  action1: PostRequest | undefined,
  action2: PostRequest | undefined,
): PostRequest | undefined {
  if (!action1) {
    return action2;
  }
  if (!action2) {
    return action1;
  }

  return {
    ...action1,
    ...action2,
  };
}

export function mergePostLocations(
  location1: PostLocation | undefined,
  location2?: PostLocation,
): PostLocation | undefined {
  const result = [...new Set([...asArray(location1), ...asArray(location2)])];

  return result.length > 0 ? (result.length === 1 ? result[0] : result) : undefined;
}

export function mergePostPlacements(
  placement1: PostPlacement | undefined,
  placement2: PostPlacement | undefined,
): PostPlacement | undefined {
  const result = [...new Set([placement1, placement2].filter(Boolean))];

  return result.length > 0 ? (result.length === 1 ? result[0] : 'Mixed') : undefined;
}

export function mergePostTags(tags1: string[] | undefined, tags2?: string[] | undefined): string[] | undefined {
  const result = new Set([...(tags1 ?? []), ...(tags2 ?? [])]);

  return result.size > 0 ? [...result] : undefined;
}

export function createPostPublicationTags(post: Post): string[] {
  const result: string[] = [];

  for (const [tag, rule] of defaultTags) {
    if (rule(post)) {
      result.push(tag);
    }
  }

  if (post.tags) {
    result.push(...post.tags);
  }

  return [...new Set(result)].map((tag) => tag.toLowerCase());
}

export function getPostDateById(id: string) {
  const parts = id.split('.');
  const dateStr = (parts.length === 1 ? parts[0] : parts[1])?.slice(0, 10);

  return dateStr ? stringToDate(dateStr) : undefined;
}

export async function getPostEntriesFromSource<TPost extends Post, TFilteredPost extends TPost = TPost>(
  source: PostSource<TPost>,
  compareFn?: PostEntriesComparator,
  filterFn?: PostFilter<TPost, TFilteredPost>,
  size?: number,
): Promise<PostEntries<TFilteredPost>> {
  return (await arrayFromAsync(
    source(),
    compareFn,
    filterFn ? (entry): entry is PostEntry<TPost> => filterFn(entry[1]) : undefined,
    size,
  )) as unknown as PostEntries<TFilteredPost>;
}

export function comparePostEntriesById(direction: SortDirection): PostEntriesComparator {
  return direction === 'asc' ? (a, b) => a[0].localeCompare(b[0]) : (a, b) => b[0].localeCompare(a[0]);
}

export function comparePostEntriesByRating(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => getPostRating(a[1]) - getPostRating(b[1]) || byId(a, b)
    : (a, b) => getPostRating(b[1]) - getPostRating(a[1]) || byId(a, b);
}

export function comparePostEntriesByDate(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => (getPostDateById(a[0])?.getTime() || 0) - (getPostDateById(b[0])?.getTime() || 0) || byId(a, b)
    : (a, b) => (getPostDateById(b[0])?.getTime() || 0) - (getPostDateById(a[0])?.getTime() || 0) || byId(a, b);
}
