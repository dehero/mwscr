import 'dotenv/config';
import { createInterface } from 'readline';
import { Api, TelegramClient } from 'telegram';
// eslint-disable-next-line import/extensions
import { Logger, LogLevel } from 'telegram/extensions/Logger.js';
// eslint-disable-next-line import/extensions
import { StringSession } from 'telegram/sessions/index.js';
import { getPostFirstPublished, getPostTypesFromContent, type Post } from '../../core/entities/post.js';
import { parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import type { ServicePost, ServicePostComment } from '../../core/entities/service-post.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import type { TelegramPost } from '../../core/services/telegram.js';
import { Telegram, TELEGRAM_CHANNEL } from '../../core/services/telegram.js';
import { asArray } from '../../core/utils/common-utils.js';
import { getDaysPassed } from '../../core/utils/date-utils.js';
import { readResource } from '../data-managers/resources.js';
import { users } from '../data-managers/users.js';

const DEBUG_PUBLISHING = Boolean(process.env.DEBUG_PUBLISHING) || false;

export class TelegramManager extends Telegram implements PostingServiceManager {
  tg: TelegramClient | undefined;

  async connect() {
    if (!this.tg) {
      const { TELEGRAM_API_APP_ID, TELEGRAM_API_APP_HASH, TELEGRAM_PHONE_NUMBER, TELEGRAM_SESSION } = process.env;
      if (!TELEGRAM_PHONE_NUMBER) {
        throw new Error('Need Telegram phone number');
      }
      if (Number.isNaN(Number(TELEGRAM_API_APP_ID))) {
        throw new TypeError('Need Telegram app id');
      }
      if (!TELEGRAM_API_APP_HASH) {
        throw new Error('Need Telegram app hash');
      }

      this.tg = new TelegramClient(
        new StringSession(TELEGRAM_SESSION || ''),
        Number(TELEGRAM_API_APP_ID),
        TELEGRAM_API_APP_HASH,
        { connectionRetries: 5, baseLogger: new Logger(LogLevel.NONE) },
      );

      this.tg.setLogLevel(LogLevel.NONE);

      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await this.tg.start({
        phoneNumber: TELEGRAM_PHONE_NUMBER,
        phoneCode: async (_isCodeViaApp?: boolean): Promise<string> =>
          new Promise((resolve) => readline.question('PHONE CODE: ', resolve)),
        onError(e) {
          throw e;
        },
      });

      await this.tg.connect();
    }

    return { tg: this.tg };
  }

  async disconnect() {
    if (!this.tg) {
      return;
    }

    const currentTg = this.tg;
    this.tg = undefined;
    await currentTg.destroy();
  }

  async mentionUsers(user: string | string[]) {
    const mentions: string[] = [];
    const userIds = asArray(user);

    for (const userId of userIds) {
      const user = await users.getItem(userId);
      const name = user?.name || userId;
      const profile = user?.profiles?.[this.id];

      mentions.push(profile ? `<a href="${encodeURI(this.getUserProfileUrl(profile))}">${name}</a>` : name);
    }

    return mentions.join(', ');
  }

  async createCaption(post: Post) {
    const lines: string[] = [];
    const contributors: string[] = [];

    if (post.title) {
      lines.push(post.title);
    }

    if (post.author && post.author !== USER_DEFAULT_AUTHOR) {
      contributors.push(`by ${await this.mentionUsers(post.author)}`);
    }

    if (post.request && post.request.user !== USER_DEFAULT_AUTHOR) {
      contributors.push(`requested by ${await this.mentionUsers(post.request.user)}`);
    }

    if (contributors.length > 0) {
      lines.push(contributors.join(' '));
    }

    lines.push('');

    if (post.location && post.location !== post.title) {
      lines.push(post.location);
    }

    const firstPublished = getPostFirstPublished(post);
    if (firstPublished && getDaysPassed(firstPublished) > 7) {
      lines.push(firstPublished.toLocaleDateString('en-GB'));
    }

    return lines.join('\n');
  }

  async grabPostInfo(
    id: number | number[],
  ): Promise<{ likes?: number; views?: number; comments?: ServicePostComment[] }> {
    if (Array.isArray(id)) {
      const infos = await Promise.all(id.map((id) => this.grabPostInfo(id)));

      return {
        likes: Math.max(...infos.map((info) => info.likes || 0)) || undefined,
        views: Math.max(...infos.map((info) => info.views || 0)) || undefined,
        comments: infos.find((info) => info.comments)?.comments,
      };
    }

    const { tg } = await this.connect();

    const result = await tg.invoke(
      new Api.channels.GetMessages({
        channel: TELEGRAM_CHANNEL,
        id: [new Api.InputMessageID({ id })],
      }),
    );

    if (!(result instanceof Api.messages.ChannelMessages)) {
      throw new TypeError(
        `Wrong post info response type for ${id}: expected messages.ChannelMessages, got ${result.className}.`,
      );
    }

    const message = result.messages[0];

    if (!(message instanceof Api.Message)) {
      throw new TypeError(`Wrong post info message type for ${id}: expected Message, got ${message?.className}`);
    }

    const likes = this.getMessageLikes(message) || undefined;

    const comments = await this.grabPostComments(id);

    return {
      likes,
      views: message.views,
      comments,
    };
  }

  getCommentInfo(message: Api.Message, result: Api.messages.ChannelMessages) {
    const userId = message.fromId instanceof Api.PeerUser ? message.fromId.userId : undefined;
    let author: string;

    if (userId) {
      const user = result.users.find((user) => user.id.equals(userId));
      if (!(user instanceof Api.User)) {
        return;
      }
      author = user.deleted
        ? 'deleted'
        : user.username || [user.firstName, user.lastName].filter((item) => Boolean(item)).join(' ');
    } else {
      author = TELEGRAM_CHANNEL;
    }

    const alt = message.document?.attributes.find(
      (attr): attr is Api.DocumentAttributeSticker => attr instanceof Api.DocumentAttributeSticker,
    )?.alt;

    const datetime = new Date(message.date * 1000);
    const text = message.message || alt || '';

    return { datetime, author, text };
  }

  async grabPostComments(postId: number): Promise<ServicePostComment[] | undefined> {
    const { tg } = await this.connect();
    const comments: ServicePostComment[] = [];
    let result: Api.messages.TypeMessages | undefined;

    try {
      result = await tg.invoke(
        new Api.messages.GetReplies({
          peer: TELEGRAM_CHANNEL,
          msgId: postId,
        }),
      );
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorMessage' in error &&
        error.errorMessage === 'MSG_ID_INVALID'
      ) {
        // No comments for this post
        return undefined;
      }
      throw error;
    }

    if (!(result instanceof Api.messages.ChannelMessages)) {
      return undefined;
    }

    for (const message of result.messages) {
      if (!(message instanceof Api.Message)) {
        continue;
      }
      // Skip child comments
      if (message.replyTo?.replyToTopId) {
        continue;
      }

      const info = this.getCommentInfo(message, result);
      if (!info) {
        continue;
      }

      const replies: ServicePostComment[] = [];

      for (const childItem of result.messages) {
        if (!(childItem instanceof Api.Message)) {
          continue;
        }
        if (childItem.replyTo?.replyToMsgId !== message.id) {
          continue;
        }

        const info = this.getCommentInfo(childItem, result);
        if (!info) {
          continue;
        }

        replies.push(info);
      }

      comments.push({ ...info, replies });
    }

    return comments.length > 0 ? comments : undefined;
  }

  getMessageLikes(message: Api.Message): number {
    return (
      message.reactions?.results.find(
        (result) => result.reaction instanceof Api.ReactionEmoji && result.reaction.emoticon === '❤',
      )?.count || 0
    );
  }

  async updateServicePost(servicePost: ServicePost<unknown>) {
    if (!this.isPost(servicePost)) {
      return;
    }

    const { likes, views, comments } = await this.grabPostInfo(servicePost.id);

    servicePost.likes = likes;
    servicePost.views = views;
    servicePost.comments = comments;
    servicePost.updated = new Date();
  }

  async publishPost(post: Post): Promise<void> {
    if (typeof post.content !== 'string') {
      throw new TypeError(`Cannot publish multiple images to ${this.name}`);
    }

    if (DEBUG_PUBLISHING) {
      console.log(`Published to ${this.name} with caption:\n${await this.createCaption(post)}`);
      return;
    }

    const { tg } = await this.connect();

    const followers = await this.grabFollowerCount();
    const { base } = parseResourceUrl(post.content);
    const [file] = await readResource(post.content);
    // @ts-expect-error Untyped property
    file.name = base;

    const result = await tg.sendFile(TELEGRAM_CHANNEL, {
      caption: await this.createCaption(post),
      file,
      parseMode: 'html',
    });

    const servicePost: TelegramPost = {
      service: this.id,
      id: result.id,
      followers,
      published: new Date(),
    };

    post.posts = [...(post.posts ?? []), servicePost];
  }

  async grabFollowerCount() {
    const { tg } = await this.connect();

    const result = await tg.invoke(
      new Api.channels.GetFullChannel({
        channel: TELEGRAM_CHANNEL,
      }),
    );

    if (!(result instanceof Api.messages.ChatFull && result.fullChat instanceof Api.ChannelFull)) {
      throw new TypeError(`Wrong follower count response type for ${this.name}.`);
    }

    return result.fullChat.participantsCount;
  }

  private async parseMessage(message: string) {
    const [, authorName] = message.split(' by ');
    let author: string | undefined;

    if (authorName) {
      [author] = (await users.findEntry({ name: authorName })) || [];
    }

    return { title: message, author: author || USER_DEFAULT_AUTHOR };
  }

  async grabPosts(afterServicePost?: ServicePost<unknown>) {
    if (afterServicePost && !this.isPost(afterServicePost)) {
      throw new Error(`Invalid ${this.name} post`);
    }

    const afterId = Array.isArray(afterServicePost?.id) ? Math.min(...afterServicePost.id) : afterServicePost?.id || -1;

    const { tg } = await this.connect();

    const maxIdResult: Api.messages.ChatFull = await tg.invoke(
      new Api.channels.GetFullChannel({
        channel: TELEGRAM_CHANNEL,
      }),
    );

    if (!(maxIdResult instanceof Api.messages.ChatFull && maxIdResult.fullChat instanceof Api.ChannelFull)) {
      throw new TypeError(`Wrong maximal id response type for ${this.name}.`);
    }

    const maxId = maxIdResult.fullChat.readInboxMaxId;

    const id = Array.from({ length: maxId - afterId }).map(
      (_, index) => new Api.InputMessageID({ id: afterId + index + 1 }),
    );

    if (id.length === 0) {
      return [];
    }

    const result = await tg.invoke(
      new Api.channels.GetMessages({
        channel: TELEGRAM_CHANNEL,
        id,
      }),
    );

    if (!(result instanceof Api.messages.ChannelMessages)) {
      throw new TypeError(
        `Wrong grab posts response type: expected messages.ChannelMessages, got ${result.className}.`,
      );
    }

    const messages = result.messages.filter((message): message is Api.Message => message instanceof Api.Message);
    const posts: Post[] = [];
    let post: Post | undefined;
    let servicePost: TelegramPost | undefined;

    for (const message of messages) {
      const id = message.id;
      const published = new Date(message.date * 1000);
      const { title, author } = await this.parseMessage(message.message);
      const content = RESOURCE_MISSING_IMAGE;
      const likes = this.getMessageLikes(message) || undefined;

      const hoursPassed = Math.abs(new Date().getTime() - published.getTime()) / 3600000;
      let followers: number | undefined;
      if (hoursPassed <= 12) {
        followers = await this.grabFollowerCount();
      }

      if (title) {
        servicePost = {
          service: 'tg',
          published,
          id,
          likes,
          views: message.views,
          followers,
        };

        post = {
          title,
          content,
          author,
          type: getPostTypesFromContent(content)[0] ?? 'shot', // TODO: get proper type from media
          posts: [servicePost],
        };
        posts.push(post);
      } else if (post && servicePost) {
        servicePost.id = [...(Array.isArray(servicePost.id) ? servicePost.id : [servicePost.id]), id];
        servicePost.likes = Math.max(servicePost.likes || 0, likes || 0) || undefined;
        servicePost.views = Math.max(servicePost.views || 0, message.views || 0) || undefined;
        post.content = servicePost.id.map(() => RESOURCE_MISSING_IMAGE);
        post.type = getPostTypesFromContent(post.content)[0] ?? post.type;
      }
    }

    return posts;
  }
}

export const telegramManager = new TelegramManager();
