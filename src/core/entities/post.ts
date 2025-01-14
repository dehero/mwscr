import type { SortDirection } from '../utils/common-types.js';
import { arrayFromAsync, asArray } from '../utils/common-utils.js';
import { dateToString, isDateInRange, stringToDate } from '../utils/date-utils.js';
import { areNestedLocations as areRelatedLocations } from './location.js';
import type { MediaAspectRatio } from './media.js';
import type { Publication, PublicationComment } from './publication.js';
import { isPublicationEqual, mergePublications } from './publication.js';
import { RESOURCE_MISSING_IMAGE, RESOURCE_MISSING_VIDEO, resourceIsImage, resourceIsVideo } from './resource.js';
import { checkRules, needObject, needProperty } from './rule.js';
import { USER_DEFAULT_AUTHOR } from './user.js';

interface PostTypeInfo {
  id: string;
  title: string;
  titleRu: string;
  letter: string;
}

interface PostMarkInfo {
  id: string;
  score: number;
}

export interface PostViolationInfo {
  title: string;
  letter: string;
  solution?: string;
  reference?: string;
}

export const POST_TYPES = [
  { id: 'shot', title: 'Shot', titleRu: 'Кадр', letter: 'S' },
  { id: 'shot-set', title: 'Shot-Set', titleRu: 'Подборка', letter: 'H' },
  { id: 'video', title: 'Video', titleRu: 'Видео', letter: 'V' },
  { id: 'clip', title: 'Clip', titleRu: 'Клип', letter: 'C' },
  { id: 'redrawing', title: 'Redrawing', titleRu: 'Перерисовка', letter: 'R' },
  { id: 'wallpaper', title: 'Wallpaper', titleRu: 'Обои', letter: 'W' },
  { id: 'wallpaper-v', title: 'Vertical Wallpaper', titleRu: 'Вертикальные обои', letter: 'M' },
] as const satisfies PostTypeInfo[];

export const POST_ADDONS = ['Tribunal', 'Bloodmoon'] as const;
export const POST_ENGINES = ['OpenMW', 'Vanilla'] as const;
export const POST_MARKS = [
  { id: 'A1', score: 5 },
  { id: 'A2', score: 4 },
  { id: 'B1', score: 3 },
  { id: 'B2', score: 2 },
  { id: 'C', score: 1 },
  { id: 'D', score: -2 },
  { id: 'E', score: 0 },
  { id: 'F', score: -1 },
] as const satisfies PostMarkInfo[];

export const POST_RECENTLY_PUBLISHED_DAYS = 31;

export const POST_VIOLATIONS = {
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
} as const satisfies Record<string, PostViolationInfo>;

export type PostType = (typeof POST_TYPES)[number]['id'];
export type PostAddon = (typeof POST_ADDONS)[number];
export type PostEngine = (typeof POST_ENGINES)[number];
export type PostMark = (typeof POST_MARKS)[number]['id'];
export type PostViolation = keyof typeof POST_VIOLATIONS;
export type PostAuthor = string | string[];
export type PostContent = string | string[];
export type PostLocation = string | string[];

export interface PostRequest {
  date: Date;
  user: string;
  text: string;
}

export interface Post {
  title?: string;
  titleRu?: string;
  description?: string;
  descriptionRu?: string;
  location?: PostLocation;
  content?: PostContent;
  trash?: PostContent;
  type: PostType;
  author?: PostAuthor;
  tags?: string[];
  engine?: PostEngine;
  addon?: PostAddon;
  request?: PostRequest;
  mark?: PostMark;
  violation?: PostViolation;
  posts?: Publication<unknown>[];
}

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

export function isPost(value: unknown, errors?: string[]): value is Post {
  return checkRules([needObject, needProperty('type', 'string')], value, errors);

  // TODO: improve type checking
  // if (typeof value.type !== 'string' || !POST_TYPES.includes(value.type as PostType)) {
  //   errors?.push(`post type expected to be in a list "${POST_TYPES.join(', ')}", got "${value.type}"`);
  //   return false;
  // }

  // return true;
}

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

export function getAllPostCommentsSorted(post: Post): PostComment[] {
  return (
    post.posts
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

export function getPostEntryFollowers(entry: PostEntry) {
  const serviceFollowers = Object.entries(
    Object.fromEntries(
      getPostEntryPublications(entry)
        .sort((a, b) => (a.followers ?? 0) - (b.followers ?? 0))
        .map((post) => [post.service, post.followers ?? 0]),
    ),
  );
  if (serviceFollowers.length === 0 || serviceFollowers.some(([, followers]) => !followers)) {
    return;
  }

  return serviceFollowers.reduce((acc, [, followers]) => acc + followers, 0);
}

export function getPostEntryEngagement(entry: PostEntry) {
  const engagements: number[] = getPostEntryPublications(entry)
    .map((post) => getPublicationEngagement(post))
    .filter((engagement) => engagement > 0);

  // Need at least 2 posting service ratings to calculate average rating
  if (engagements.length < 2) {
    return 0;
  }

  return engagements.reduce((acc, number) => acc + number, 0) / engagements.length;
}

export function getPostEntryLikes(entry: PostEntry) {
  return getPostEntryPublications(entry).reduce((acc, publication) => acc + (publication.likes ?? 0), 0);
}

export function getPostEntryViews(entry: PostEntry) {
  return getPostEntryPublications(entry).reduce((acc, publication) => acc + (publication.views ?? 0), 0);
}

export function getPostMarkScore(mark: PostMark) {
  return POST_MARKS.find((info) => info.id === mark)?.score ?? 0;
}

export function getPostMarkFromScore(score?: number) {
  if (!score) {
    return;
  }
  return POST_MARKS.find((info) => info.score === Math.round(score))?.id;
}

export function getPublicationEngagement(info?: Publication<unknown>) {
  const reactions = (info?.likes ?? 0) + (info?.reposts ?? 0);

  if (!reactions || !info?.followers) {
    return 0;
  }

  return info.followers >= 50 ? (reactions / info.followers) * 100 : reactions;
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

export function getPostTypesFromContent(content?: PostContent): PostType[] {
  const urls = asArray(content);

  if (urls.length === 4 && urls.every((url) => resourceIsImage(url) || RESOURCE_MISSING_IMAGE === url)) {
    return ['shot-set'];
  }
  if (urls.length === 2 && urls.every((url) => resourceIsImage(url) || RESOURCE_MISSING_IMAGE === url)) {
    return ['redrawing'];
  }
  if (urls.length === 1 && urls[0] && (resourceIsImage(urls[0]) || RESOURCE_MISSING_IMAGE === urls[0])) {
    return ['shot', 'wallpaper', 'wallpaper-v'];
  }
  if (urls.length === 1 && urls[0] && (resourceIsVideo(urls[0]) || RESOURCE_MISSING_VIDEO === urls[0])) {
    return ['clip', 'video'];
  }

  return [];
}

export function getPostTypeAspectRatio(type: PostType): MediaAspectRatio {
  if (type === 'video' || type === 'wallpaper') {
    return '16/9';
  }

  if (type === 'wallpaper-v') {
    return '9/19.5';
  }

  return '1/1';
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
  post.request = mergePostMessages(post.request, withPost.request);
  post.mark = post.mark || withPost.mark;
  post.violation = post.violation || withPost.violation;
  post.posts = mergePublications(post.posts, withPost.posts);

  return post;
}

export function mergeAuthors(author1: PostAuthor | undefined, author2?: PostAuthor | undefined) {
  const result = asArray(author1);
  const users2 = asArray(author2);

  for (const user2 of users2) {
    if (!result.includes(user2)) {
      result.push(user2);
    }
  }

  return result.length > 0 ? (result.length === 1 ? result[0] : result) : undefined;
}

export function mergePostContents(content1: PostContent | undefined, content2?: PostContent | undefined) {
  const result = asArray(content1);
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

export function mergePostMessages(
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

export function mergePostTags(tags1: string[] | undefined, tags2?: string[] | undefined): string[] | undefined {
  const result = new Set([...(tags1 ?? []), ...(tags2 ?? [])]);

  return result.size > 0 ? [...result] : undefined;
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

export function comparePostEntriesByEngagement(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => getPostEntryEngagement(a) - getPostEntryEngagement(b) || byId(a, b)
    : (a, b) => getPostEntryEngagement(b) - getPostEntryEngagement(a) || byId(a, b);
}

export function comparePostEntriesByLikes(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => getPostEntryLikes(a) - getPostEntryLikes(b) || byId(a, b)
    : (a, b) => getPostEntryLikes(b) - getPostEntryLikes(a) || byId(a, b);
}

export function comparePostEntriesByViews(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => getPostEntryViews(a) - getPostEntryViews(b) || byId(a, b)
    : (a, b) => getPostEntryViews(b) - getPostEntryViews(a) || byId(a, b);
}

export function comparePostEntriesByMark(direction: SortDirection): PostEntriesComparator {
  const byRating = comparePostEntriesByRating(direction);

  return direction === 'asc'
    ? (a, b) => b[1].mark?.localeCompare(a[1].mark || '') || byRating(a, b)
    : (a, b) => a[1].mark?.localeCompare(b[1].mark || '') || byRating(a, b);
}

export function comparePostEntriesByDate(direction: SortDirection): PostEntriesComparator {
  const byId = comparePostEntriesById(direction);

  return direction === 'asc'
    ? (a, b) => (getPostDateById(a[0])?.getTime() || 0) - (getPostDateById(b[0])?.getTime() || 0) || byId(a, b)
    : (a, b) => (getPostDateById(b[0])?.getTime() || 0) - (getPostDateById(a[0])?.getTime() || 0) || byId(a, b);
}
