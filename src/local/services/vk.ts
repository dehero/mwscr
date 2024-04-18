import 'dotenv/config';
import { VK } from 'vk-io';
// @ts-expect-error No proper typing
import type { WallWallComment } from 'vk-io/lib/api/schemas/objects';
// @ts-expect-error No proper typing
import type { WallGetCommentExtendedResponse } from 'vk-io/lib/api/schemas/responses';
import { getPostFirstPublished, getPostTypesFromContent, type Post } from '../../core/entities/post.js';
import { createPostTags } from '../../core/entities/post-tag.js';
import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { ServicePost, ServicePostComment } from '../../core/entities/service-post.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import type { VKPost } from '../../core/services/vk.js';
import { canPublishPost, id, isVKPost, name, VK_GROUP_ID, VK_GROUP_NAME } from '../../core/services/vk.js';
import { asArray, randomDelay } from '../../core/utils/common-utils.js';
import { getDaysPassed } from '../../core/utils/date-utils.js';
import { readResource } from '../data-managers/resources.js';
import { findUser, getUser } from '../data-managers/users.js';

export * from '../../core/services/vk.js';

const DEBUG_PUBLISHING = Boolean(process.env.DEBUG_PUBLISHING) || false;

let vk: VK | undefined;

export async function parseMessageText(text: string) {
  const lines = text.split('\n');

  const title = lines[0]?.replace(/\[.*\|(.*)\]/g, '$1').trim();
  const tags = lines[1]?.split(/\s*#/).filter((item) => Boolean(item));
  const [, authorName] = title?.split(' от ') || [];
  let author: string | undefined;

  if (authorName) {
    [author] = (await findUser({ name: authorName, nameRu: authorName, nameRuFrom: authorName })) || [];
  }

  return { title, tags, author: author || USER_DEFAULT_AUTHOR };
}

export async function mentionUsers(users: string | string[]) {
  const mentions: string[] = [];
  const userIds = asArray(users);

  for (const userId of userIds) {
    const user = await getUser(userId);
    const name = user?.nameRuFrom || user?.name || userId;
    const profile = user?.profiles?.[id];

    mentions.push(profile ? `@${profile} (${name})` : name);
  }

  return mentions.join(', ');
}

export async function createCaption(post: Post) {
  const lines: string[] = [];
  const tags = createPostTags(post);
  const contributors: string[] = [];

  if (post.titleRu) {
    lines.push(post.titleRu);
  }

  if (post.author && post.author !== USER_DEFAULT_AUTHOR) {
    contributors.push(`от ${await mentionUsers(post.author)}`);
  }

  if (post.request && post.request.user !== USER_DEFAULT_AUTHOR) {
    contributors.push(`по запросу ${await mentionUsers(post.request.user)}`);
  }

  if (contributors.length > 0) {
    lines.push(contributors.join(' '));
  }

  if (tags.length > 0) {
    lines.push(tags.map((tag) => `#${tag}`).join(' '));
  }

  lines.push('');

  // TODO: find location on Russian
  // if (post.location) {
  //   lines.push(post.location);
  // }

  const firstPublished = getPostFirstPublished(post);
  if (firstPublished && getDaysPassed(firstPublished) > 7) {
    lines.push(firstPublished.toLocaleDateString('ru-RU'));
  }

  return lines.join('\n');
}

export async function connect() {
  if (!vk) {
    const { VK_ACCESS_TOKEN } = process.env;

    if (!VK_ACCESS_TOKEN) {
      throw new Error(`Need ${name} access token`);
    }

    vk = new VK({
      token: VK_ACCESS_TOKEN,
    });
  }

  return { vk };
}

export async function disconnect() {}

export async function publishPost(post: Post): Promise<void> {
  if (!canPublishPost(post)) {
    throw new Error(`Cannot publish post to ${name}`);
  }

  if (DEBUG_PUBLISHING) {
    console.log(`Published to ${name} with caption:\n${await createCaption(post)}`);
    return;
  }

  const [file] = await readResource(post.content);
  const { vk } = await connect();

  const photo = await vk.upload.wallPhoto({
    source: {
      value: file,
    },
    group_id: Math.abs(VK_GROUP_ID),
  });

  const result = await vk.api.wall.post({
    owner_id: VK_GROUP_ID,
    from_group: true,
    attachments: photo.toString(),
    message: await createCaption(post),
  });
  const followers = await grabFollowerCount();

  const servicePost: VKPost = { service: id, id: result.post_id, followers, published: new Date() };

  post.posts = [...(post.posts ?? []), servicePost];
}

function getCommentInfo(message: WallWallComment, result: WallGetCommentExtendedResponse) {
  const user =
    // @ts-expect-error No proper typing
    result.profiles.find((profile) => profile.id === message.from_id) ||
    // @ts-expect-error No proper typing
    result.groups.find((group) => group.id === -(message.from_id || 0));

  if (!user || !message.date || !message.text) {
    return;
  }

  const author = user.screen_name || `id${user.id}`;

  const datetime = new Date(message.date * 1000);
  const text = message.text.replace(/\[[^|]+\|([^\]]+)\]/gm, '$1').trim();

  return { datetime, author, text };
}

export async function grabPostComments(postId: number): Promise<ServicePostComment[] | undefined> {
  const { vk } = await connect();
  const comments: ServicePostComment[] = [];

  const result = (await vk.api.wall.getComments({
    owner_id: VK_GROUP_ID,
    post_id: postId,
    count: 100,
    sort: 'asc',
    thread_items_count: 10,
    extended: true,
    fields: ['screen_name'],
  })) as unknown as WallGetCommentExtendedResponse;

  for (const item of result.items) {
    const info = getCommentInfo(item, result);
    if (!info) {
      continue;
    }

    const replies: ServicePostComment[] = [];

    for (const childItem of item.thread.items) {
      const info = getCommentInfo(childItem, result);
      if (!info) {
        continue;
      }

      replies.push(info);
    }

    comments.push({ ...info, replies });
  }

  return comments.length > 0 ? comments : undefined;
}

export async function grabPostInfo(postId: number) {
  const { vk } = await connect();

  const response = await vk.api.wall.getById({
    posts: [`${VK_GROUP_ID}_${postId}`],
  });

  const post = response.items[0];

  const comments = await grabPostComments(postId);

  return {
    likes: post?.likes.count || undefined,
    reposts: post?.reposts.count || undefined,
    views: post?.views.count || undefined,
    comments,
  };
}

export async function updateServicePost(servicePost: ServicePost<unknown>) {
  if (!isVKPost(servicePost)) {
    return;
  }

  const { likes, views, reposts, comments } = await grabPostInfo(servicePost.id);

  servicePost.likes = likes;
  servicePost.views = views;
  servicePost.reposts = reposts;
  servicePost.comments = comments;
  servicePost.updated = new Date();
}

export async function grabFollowerCount() {
  const { vk } = await connect();

  return (await vk.api.groups.getMembers({ group_id: VK_GROUP_NAME, count: 0 })).count;
}

export async function grabPosts(afterServicePost?: ServicePost<unknown>) {
  if (afterServicePost && !isVKPost(afterServicePost)) {
    throw new Error(`Invalid ${name} post`);
  }

  const afterId = afterServicePost?.id;
  const { vk } = await connect();
  const count = 500;
  let offset = 0;
  const posts: Post[] = [];

  for (;;) {
    if (offset > 0) {
      await randomDelay(1000);
    }

    const response = await vk.api.wall.get({
      domain: VK_GROUP_NAME,
      filter: 'owner',
      offset,
      count,
    });

    for (const item of response.items) {
      const attachmentCount = item.attachments.length;

      if (!item.id || !item.date || !item.text || !attachmentCount) {
        continue;
      }

      const id = item.id;

      if (id === afterId) {
        return posts;
      }

      const published = new Date(item.date * 1000);
      const { title: titleRu, tags, author } = await parseMessageText(item.text);
      const content =
        attachmentCount === 1
          ? RESOURCE_MISSING_IMAGE
          : Array.from({ length: attachmentCount }).map(() => RESOURCE_MISSING_IMAGE);

      const hoursPassed = Math.abs(new Date().getTime() - published.getTime()) / 3600000;
      let followers: number | undefined;
      if (hoursPassed <= 12) {
        followers = await grabFollowerCount();
      }

      posts.push({
        titleRu,
        content,
        author,
        tags,
        type: getPostTypesFromContent(content)[0] ?? 'shot', // TODO: get proper type from media
        posts: [
          {
            service: 'vk',
            published,
            id,
            likes: item.likes.count || undefined,
            reposts: item.reposts.count || undefined,
            views: item.views.count || undefined,
            followers,
          },
        ],
      });
    }

    offset += count;
    if (offset >= response.count) {
      break;
    }
  }

  return posts;
}
