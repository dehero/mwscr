import 'dotenv/config';
import { createInterface } from 'readline';
import { Api, TelegramClient } from 'telegram';
// eslint-disable-next-line import/extensions
import { Logger, LogLevel } from 'telegram/extensions/Logger.js';
// eslint-disable-next-line import/extensions
import { StringSession } from 'telegram/sessions/index.js';
import type { Post, PostEntry } from '../../core/entities/post.js';
import { getPostFirstPublished, getPostTypesFromContent, POST_TYPES } from '../../core/entities/post.js';
import type { Publication, PublicationComment } from '../../core/entities/publication.js';
import { parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import { site } from '../../core/services/site.js';
import type { TelegramPost } from '../../core/services/telegram.js';
import { Telegram, TELEGRAM_CHANNEL } from '../../core/services/telegram.js';
import { asArray } from '../../core/utils/common-utils.js';
import { formatDate, getDaysPassed } from '../../core/utils/date-utils.js';
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

  async createCaption(entry: PostEntry) {
    const [id, post] = entry;

    const lines: string[] = [];
    const contributors: string[] = [];
    const titlePrefix = post.type !== 'shot' ? POST_TYPES.find(({ id }) => id === post.type)?.title : undefined;

    if (post.title) {
      lines.push([titlePrefix, post.title].filter(Boolean).join(': '));
    } else if (titlePrefix) {
      lines.push(titlePrefix);
    }

    // TODO: mention USER_DEFAULT_AUTHOR in shot-sets created not just by USER_DEFAULT_AUTHOR
    const authors = asArray(post.author).filter((author) => author !== USER_DEFAULT_AUTHOR);
    if (authors.length > 0) {
      contributors.push(`by ${await this.mentionUsers(authors)}`);
    }

    if (post.request && post.request.user !== USER_DEFAULT_AUTHOR) {
      contributors.push(`requested by ${await this.mentionUsers(post.request.user)}`);
    }

    if (contributors.length > 0) {
      lines.push(contributors.join(' '));
    }

    lines.push('');

    const locationsToMention = asArray(post.location).filter((location) => location !== post.title);
    if (locationsToMention.length > 0) {
      lines.push(locationsToMention.join(', '));
    }

    const firstPublished = getPostFirstPublished(post);
    if (firstPublished && getDaysPassed(firstPublished) > 7) {
      lines.push(formatDate(firstPublished));
    }

    lines.push(`<a href="${site.getPostUrl(id)}">View and Download</a>`);

    return lines.join('\n');
  }

  async grabPostInfo(
    id: number | number[],
  ): Promise<{ likes?: number; views?: number; comments?: PublicationComment[] }> {
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

  async grabPostComments(postId: number): Promise<PublicationComment[] | undefined> {
    const { tg } = await this.connect();
    const comments: PublicationComment[] = [];
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

      const replies: PublicationComment[] = [];

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

  async updatePublication(publication: Publication<unknown>) {
    if (!this.isPost(publication)) {
      return;
    }

    const { likes, views, comments } = await this.grabPostInfo(publication.id);

    publication.likes = likes;
    publication.views = views;
    publication.comments = comments;
    publication.updated = new Date();
  }

  async publishPostEntry(entry: PostEntry): Promise<void> {
    const [, post] = entry;
    const [firstContent, ...restContent] = asArray(post.content);
    if (!firstContent) {
      throw new Error('No content found');
    }

    if (DEBUG_PUBLISHING) {
      console.log(`Published to ${this.name} with caption:\n${await this.createCaption(entry)}`);
      return;
    }

    const { tg } = await this.connect();
    const ids: number[] = [];

    const followers = await this.grabFollowerCount();
    const { base } = parseResourceUrl(firstContent);
    const [file] = await readResource(firstContent);
    // @ts-expect-error Untyped property
    file.name = base;

    const result = await tg.sendFile(TELEGRAM_CHANNEL, {
      caption: await this.createCaption(entry),
      file,
      parseMode: 'html',
    });

    ids.push(result.id);

    for (const url of restContent) {
      const { base } = parseResourceUrl(url);
      const [file] = await readResource(url);
      // @ts-expect-error Untyped property
      file.name = base;

      const result = await tg.sendFile(TELEGRAM_CHANNEL, { file });

      ids.push(result.id);
    }

    const publication: TelegramPost = {
      service: this.id,
      id: ids.length > 1 ? ids : Number(ids[0]),
      followers,
      published: new Date(),
    };

    post.posts = [...(post.posts ?? []), publication];
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

  async grabPosts(afterPublication?: Publication<unknown>) {
    if (afterPublication && !this.isPost(afterPublication)) {
      throw new Error(`Invalid ${this.name} post`);
    }

    const afterId = Array.isArray(afterPublication?.id) ? Math.min(...afterPublication.id) : afterPublication?.id || -1;

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
    let publication: TelegramPost | undefined;

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
        publication = {
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
          posts: [publication],
        };
        posts.push(post);
      } else if (post && publication) {
        publication.id = [...(Array.isArray(publication.id) ? publication.id : [publication.id]), id];
        publication.likes = Math.max(publication.likes || 0, likes || 0) || undefined;
        publication.views = Math.max(publication.views || 0, message.views || 0) || undefined;
        post.content = publication.id.map(() => RESOURCE_MISSING_IMAGE);
        post.type = getPostTypesFromContent(post.content)[0] ?? post.type;
      }
    }

    return posts;
  }
}

export const telegramManager = new TelegramManager();
