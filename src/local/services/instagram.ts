/**
 * This module provides functions for interacting with the Instagram API.
 */
import {
  Client,
  CommentField,
  CONTAINER_STATUS_CODE,
  ContainerField,
  PageField,
  PageOption,
  PrivateMediaField,
  PublicMediaField,
  SimplePostMetric,
} from 'instagram-graph-api';
import fetch, { File, FormData } from 'node-fetch';
import sharp from 'sharp';
import { getPostFirstPublished, getPostTypesFromContent, type Post } from '../../core/entities/post.js';
import { createPostTags } from '../../core/entities/post-tag.js';
import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { ServicePost, ServicePostComment } from '../../core/entities/service-post.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import type { InstagramPost } from '../../core/services/instagram.js';
import { id, isInstagramPost, name } from '../../core/services/instagram.js';
import { asArray } from '../../core/utils/common-utils.js';
import { getDaysPassed } from '../../core/utils/date-utils.js';
import { readResource } from '../data-managers/resources.js';
import { findUser, getUser } from '../data-managers/users.js';

export * from '../../core/services/instagram.js';

const INSTAGRAM_PAGE_ID = '17841404237421312'; // Instagram Business ID

const DEBUG_PUBLISHING = Boolean(process.env.DEBUG_PUBLISHING) || false;

let ig: Client | undefined;

/**
 * Parses the caption of an Instagram post.
 * @param {string} caption - The caption of the post.
 * @returns {object} - An object containing the parsed caption.
 */
export async function parseCaption(caption: string) {
  const lines = caption.split('\n');

  const title = lines[0];
  const tags = lines[1]?.split(/\s*#/).filter((item) => Boolean(item));
  const requester = lines[2]?.split('@')[1];

  const request = requester ? { user: requester } : undefined;

  const [, authorName] = title?.split(' by ') || [];
  let author: string | undefined;

  if (authorName) {
    [author] = (await findUser({ name: authorName })) || [];
  }

  return { title, tags, request, author: author || USER_DEFAULT_AUTHOR };
}

/**
 * Creates the caption for an Instagram post.
 * @param {Post} post - The post to create the caption for.
 * @returns {string} - The created caption.
 */
export async function createCaption(post: Post) {
  const lines: string[] = [];
  const tags = createPostTags(post);
  const contributors: string[] = [];

  if (post.title) {
    lines.push(post.title);
  }

  if (post.author && post.author !== USER_DEFAULT_AUTHOR) {
    contributors.push(`by ${await mentionUsers(post.author)}`);
  }

  if (post.request && post.request.user !== USER_DEFAULT_AUTHOR) {
    contributors.push(`requested by ${await mentionUsers(post.request.user)}`);
  }

  if (contributors.length > 0) {
    lines.push(contributors.join(' '));
  }

  if (tags.length > 0) {
    lines.push(tags.map((tag) => `#${tag}`).join(' '));
  }

  lines.push('');

  if (post.location) {
    lines.push(post.location);
  }

  const firstPublished = getPostFirstPublished(post);
  if (firstPublished && getDaysPassed(firstPublished) > 7) {
    lines.push(firstPublished.toLocaleDateString('en-GB'));
  }

  return lines.join('\n');
}

export async function mentionUsers(users: string | string[]) {
  const mentions: string[] = [];
  const userIds = asArray(users);

  for (const userId of userIds) {
    const user = await getUser(userId);
    const name = user?.name || userId;
    const profile = user?.profiles?.[id];

    mentions.push(profile ? `@${profile}` : name);
  }

  return mentions.join(', ');
}

/**
 * Gets temporary upload URL for an image.
 * @param {Buffer} data - The image data.
 * @returns {string} - The upload URL.
 */
export async function getUploadUrl(data: Buffer) {
  const formData = new FormData();
  formData.set('file', new File([data], 'temp.jpeg', { type: 'image/jpeg' }));

  const serviceUrl = 'https://tmpfiles.org';

  const response = await fetch(`${serviceUrl}/api/v1/upload`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: formData,
  });
  const details = (await response.json()) as { status?: string; data?: { url: string } } | undefined;

  if (details?.status === 'success' && typeof details.data?.url === 'string') {
    return details.data.url.replace(serviceUrl, `${serviceUrl}/dl`);
  }

  throw new Error(`Cannot upload file to ${serviceUrl}`);
}

/**
 * Connects to the Instagram API.
 * @returns {object} - An object containing the Instagram client.
 */
export async function connect() {
  if (!ig) {
    const { INSTAGRAM_ACCESS_TOKEN } = process.env;
    if (!INSTAGRAM_ACCESS_TOKEN) {
      throw new Error(`Need ${name} access token`);
    }

    ig = new Client(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID);
  }

  return { ig };
}

/**
 * Publishes a post on Instagram.
 * @param post - The post object.
 * @throws TypeError if the post content is not a string.
 * @throws Error if the post ID cannot be retrieved.
 * @returns A promise that resolves with no value.
 */
export async function publishPost(post: Post): Promise<void> {
  if (typeof post.content !== 'string') {
    throw new TypeError(`Cannot publish multiple images to ${name}`);
  }

  if (DEBUG_PUBLISHING) {
    console.log(`Published to ${name} with caption:\n${await createCaption(post)}`);
    return;
  }

  // Connect to Instagram API
  const { ig } = await connect();

  // Convert the image to JPEG and upload the image
  const [file] = await readResource(post.content);
  const jpeg = await sharp(file).jpeg({ quality: 100 }).toBuffer();
  const imageUrl = await getUploadUrl(jpeg);
  const caption = await createCaption(post);

  // Create a new post container
  const createContainerResponse = await ig.newPostPagePhotoMediaRequest(imageUrl, caption).execute();
  const containerId = createContainerResponse.getId();

  // Wait for the container to finish uploading
  for (let i = 0; i < 5; i++) {
    const containerResponse = await ig.newGetContainerRequest(containerId, ContainerField.STATUS_CODE).execute();
    const statusCode = containerResponse.getContainerStatusCode();

    if (statusCode === CONTAINER_STATUS_CODE.FINISHED) {
      break;
    }
  }

  // Publish the post
  const mediaResponse = await ig.newPostPublishMediaRequest(containerId).execute();
  const mediaId = mediaResponse.getId();

  // Get post information from Instagram
  const mediaInfoRespose = await ig
    .newGetMediaInfoRequest(mediaId, PrivateMediaField.SHORTCODE, PrivateMediaField.IG_ID)
    .execute();

  const id = mediaInfoRespose.getShortcode() || mediaInfoRespose.getIgId();

  // Throw an error if the post ID cannot be retrieved
  if (!id) {
    throw new Error(`Cannot get post ${name} id`);
  }

  // Get the follower count
  const followers = await grabFollowerCount();

  // Update the post object with Instagram information
  const servicePost: InstagramPost = { service: 'ig', id, mediaId, followers, published: new Date() };

  post.posts = [...(post.posts ?? []), servicePost];
}

/**
 * Disconnects from the Instagram API.
 */
export async function disconnect() {}

/**
 * Retrieves the post information from Instagram API.
 *
 * @param {string} mediaId - The ID of the media.
 * @return {Promise<{ likes: number | undefined, views: number | undefined, comments: ServicePostComment[] | undefined }>} - A promise that resolves with the post information.
 */
export async function grabPostInfo(mediaId: string) {
  const { ig } = await connect();

  // Get the like count and comments count for the media
  const response = await ig
    .newGetMediaInfoRequest(mediaId, PublicMediaField.LIKE_COUNT, PublicMediaField.COMMENTS_COUNT)
    .execute();

  const item = response.getData();
  let comments;
  if (item.comments_count) {
    // Get the comments for the media if there are any
    try {
      comments = await getPostComments(mediaId);
    } catch {
      // TODO: remove try catch when https://developers.facebook.com/community/threads/427166056327846/ gets fixed
    }
  }

  let views;
  try {
    // Get the impressions (views) count for the media
    const insightsResponse = await ig
      .newGetSimplePostMediaInsightsRequest(mediaId, SimplePostMetric.IMPRESSIONS)
      .execute();
    views = insightsResponse.getMetricByName(SimplePostMetric.IMPRESSIONS)?.getMetricValues()[0]?.value;
  } catch {
    // Suppress no insights error
  }

  return {
    likes: item.like_count || undefined,
    views,
    comments,
  };
}

/**
 * Retrieves the comments for a post from Instagram API.
 *
 * @param {string} mediaId - The ID of the media.
 * @return {Promise<ServicePostComment[] | undefined>} - A promise that resolves with the comments for the post.
 */
async function getPostComments(mediaId: string): Promise<ServicePostComment[] | undefined> {
  const { ig } = await connect();
  const comments: ServicePostComment[] = [];

  // Get the comments for the media
  const request = ig.newGetMediaCommentsRequest(
    mediaId,
    CommentField.ID,
    CommentField.REPLIES,
    CommentField.TIMESTAMP,
    CommentField.USERNAME,
    CommentField.TEXT,
  );
  const response = await request.execute();

  const items = response.getData();

  for (const item of items) {
    if (!item.timestamp || !item.text || !item.username) {
      continue;
    }

    const replies: ServicePostComment[] = [];
    const author = item.username;
    const mention = `@${author}`;
    const text = item.text.trim();

    if (item.replies?.data.length) {
      // Get the replies for each comment if there are any
      const request = ig.newGetRepliesRequest(
        item.id,
        CommentField.ID,
        CommentField.TIMESTAMP,
        CommentField.USERNAME,
        CommentField.TEXT,
      );
      const response = await request.execute();
      const childItems = response.getData();

      for (const childItem of childItems) {
        if (!childItem.timestamp || !childItem.text || !childItem.username) {
          continue;
        }

        const datetime = new Date(childItem.timestamp);
        const author = childItem.username;

        let text = childItem.text;
        if (text.startsWith(mention)) {
          text = text.slice(mention.length);
        }
        text = text.trim();

        replies.push({ datetime, author, text });
      }
    }

    const datetime = new Date(item.timestamp);

    comments.push({ datetime, author, text, replies });
  }

  return comments.length > 0 ? comments : undefined;
}

export async function updateServicePost(servicePost: ServicePost<unknown>) {
  if (!isInstagramPost(servicePost) || !servicePost.mediaId) {
    return;
  }

  const { likes, views, comments } = await grabPostInfo(servicePost.mediaId);

  servicePost.likes = likes;
  servicePost.views = views || servicePost.views;
  servicePost.comments = comments || servicePost.comments;
  servicePost.updated = new Date();
}

/**
 * Retrieves the profile follower count using the Instagram API.
 *
 * @return {number} The number of followers.
 */
export async function grabFollowerCount() {
  const { ig } = await connect();
  const request = ig.newGetPageInfoRequest(PageField.FOLLOWERS_COUNT);
  const response = await request.execute();
  const data = response.getData();

  return data.followers_count;
}

export async function grabPosts(afterServicePost?: ServicePost<unknown>) {
  if (afterServicePost && !isInstagramPost(afterServicePost)) {
    throw new Error(`Invalid ${name} post`);
  }

  const afterMediaId = afterServicePost?.mediaId;
  const { ig } = await connect();
  const posts: Post[] = [];

  const request = ig.newGetPageMediaRequest(
    PrivateMediaField.SHORTCODE,
    PrivateMediaField.IG_ID,
    PublicMediaField.ID,
    PublicMediaField.CAPTION,
    PublicMediaField.CHILDREN,
    PublicMediaField.TIMESTAMP,
    PublicMediaField.LIKE_COUNT,
    PublicMediaField.COMMENTS_COUNT,
  );
  let response = await request.execute();
  let nextPage;

  paging: do {
    if (nextPage) {
      response = await request.withPaging({ option: PageOption.AFTER, value: nextPage }).execute();
    }

    const items = response.getData();

    for (const item of items) {
      const id = item.shortcode || item.ig_id;

      if (!item.caption || !item.timestamp || !id) {
        continue;
      }

      const mediaId = item.id;
      if (mediaId === afterMediaId) {
        break paging;
      }

      const {
        title,
        tags,
        author,
        //, request
      } = await parseCaption(item.caption);
      const published = new Date(item.timestamp);
      const content = item.children?.data.length
        ? item.children.data.map(() => RESOURCE_MISSING_IMAGE)
        : RESOURCE_MISSING_IMAGE;

      const hoursPassed = Math.abs(new Date().getTime() - published.getTime()) / 3600000;
      let followers: number | undefined;
      if (hoursPassed <= 12) {
        followers = await grabFollowerCount();
      }

      let comments;
      if (item.comments_count) {
        comments = await getPostComments(item.id);
      }

      posts.push({
        title,
        content,
        author,
        tags,
        // request,
        type: getPostTypesFromContent(content)[0] ?? 'shot', // TODO: get proper type from media
        posts: [
          {
            service: 'ig',
            published,
            id,
            code: item.shortcode !== id ? item.shortcode : undefined,
            mediaId,
            likes: item.like_count || undefined,
            followers,
            comments,
          },
        ],
      });
    }

    try {
      nextPage = response.getPaging().getAfter();
    } catch {
      // Suppress instagram-graph-api bug: Cannot read properties of undefined (reading 'cursors')
      nextPage = undefined;
    }
  } while (nextPage);

  return posts;
}
