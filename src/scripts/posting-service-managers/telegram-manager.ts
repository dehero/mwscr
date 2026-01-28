import 'dotenv/config';
import BigInteger from 'big-integer';
import { createInterface } from 'readline';
import sharp from 'sharp';
import { Api, TelegramClient } from 'telegram';
// eslint-disable-next-line import/extensions
import { CustomFile } from 'telegram/client/uploads.js';
// eslint-disable-next-line import/extensions
import { Logger, LogLevel } from 'telegram/extensions/Logger.js';
// eslint-disable-next-line import/extensions
import { StringSession } from 'telegram/sessions/index.js';
import { markdownToTelegramHtml } from '../../core/entities/markdown.js';
import type { Post, PostEntry } from '../../core/entities/post.js';
import {
  getPostFirstPublished,
  getPostTypeFromContent,
  postAddonDescriptors,
  postTypeDescriptors,
} from '../../core/entities/post.js';
import type { Publication, PublicationComment } from '../../core/entities/publication.js';
import { parseResourceUrl, RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import type { UserProfile, UserProfileType } from '../../core/entities/user.js';
import { setUserProfileFollowing, USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import { site } from '../../core/services/site.js';
import type { TelegramPublication } from '../../core/services/telegram.js';
import { Telegram, TELEGRAM_CHANNEL } from '../../core/services/telegram.js';
import { asArray } from '../../core/utils/common-utils.js';
import { formatDate, getDaysPassed } from '../../core/utils/date-utils.js';
import { readResource } from '../data-managers/resources.js';
import { saveUserAvatar } from '../data-managers/store-resources.js';
import { users } from '../data-managers/users.js';
import { createPostStory } from '../renderers/stories.js';

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
        {
          connectionRetries: 5,
          reconnectRetries: 1, // Reconnect only once to avoid infinite script execution
          baseLogger: new Logger(LogLevel.NONE),
        },
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
      const profile = user?.profiles?.find((profile) => profile.service === this.id)?.username;

      mentions.push(profile ? `<a href="${encodeURI(this.getUserProfileUrl(profile))}">${name}</a>` : name);
    }

    return mentions.join(', ');
  }

  async createCaption(entry: PostEntry) {
    const [id, post, managerName] = entry;

    const lines: string[] = [];

    const description = markdownToTelegramHtml(post.description || '').html;

    if (post.type !== 'news') {
      const contributors: string[] = [];
      const titlePrefix = [
        post.addon && !postAddonDescriptors[post.addon].official ? post.addon : undefined,
        post.type !== 'shot' ? postTypeDescriptors[post.type].title : undefined,
      ]
        .filter(Boolean)
        .join(' ');

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
    }

    if (description) {
      lines.push(description);
      lines.push('');
    }

    const locationsToMention = asArray(post.location).filter((location) => location !== post.title);
    if (locationsToMention.length > 0) {
      lines.push(locationsToMention.join('; '));
    }

    const firstPublished = getPostFirstPublished(post);
    if (firstPublished && getDaysPassed(firstPublished) > 7) {
      lines.push(formatDate(firstPublished));
    }

    lines.push(`<a href="${site.getPostUrl(id, managerName)}">Details</a>`);

    return lines.join('\n');
  }

  async grabPostInfo(
    id: number | number[],
  ): Promise<{ likes?: number; views?: number; reposts?: number; comments?: PublicationComment[] }> {
    if (Array.isArray(id)) {
      const infos = await Promise.all(id.map((id) => this.grabPostInfo(id)));

      return {
        likes: Math.max(...infos.map((info) => info.likes || 0)) || undefined,
        views: Math.max(...infos.map((info) => info.views || 0)) || undefined,
        reposts: Math.max(...infos.map((info) => info.reposts || 0)) || undefined,
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
      reposts: message.forwards,
      comments,
    };
  }

  async grabStoryInfo(id: number | number[]): Promise<{ likes?: number; views?: number; reposts?: number }> {
    if (Array.isArray(id)) {
      throw new TypeError(`Can't grab story info for multiple stories`);
    }

    const { tg } = await this.connect();

    const result = await tg.invoke(new Api.stories.GetStoriesByID({ peer: TELEGRAM_CHANNEL, id: [id] }));

    if (!(result instanceof Api.stories.Stories)) {
      throw new TypeError(`Wrong story info API response type for ${id}`);
    }

    const story = result.stories[0];
    if (!(story instanceof Api.StoryItem)) {
      throw new TypeError(`Wrong story info API response type for ${id}`);
    }

    const views = story.views?.viewsCount;
    const likes = story.views?.reactionsCount;
    const reposts = story.views?.forwardsCount;

    return { views, likes, reposts };
  }

  async getCommentInfo(message: Api.Message, result: Api.messages.ChannelMessages) {
    const userId = message.fromId instanceof Api.PeerUser ? message.fromId.userId : undefined;
    const chatId = message.fromId instanceof Api.PeerChat ? message.fromId.chatId : undefined;
    const channelId = message.fromId instanceof Api.PeerChannel ? message.fromId.channelId : undefined;

    if (!userId && !chatId && !channelId) {
      return;
    }

    const user = userId && result.users.find((user) => user.id.equals(userId));
    const chat = chatId && result.chats.find((chat) => chat.id.equals(chatId));
    const channel = channelId && result.chats.find((chat) => chat.id.equals(channelId));

    const entity = chat ?? channel ?? user;

    if (!entity || !(entity instanceof Api.User || entity instanceof Api.Chat || entity instanceof Api.Channel)) {
      return;
    }

    const alt = message.document?.attributes.find(
      (attr): attr is Api.DocumentAttributeSticker => attr instanceof Api.DocumentAttributeSticker,
    )?.alt;

    const text = (message.message || alt || '').trim();

    if (!text) {
      return;
    }

    const [author] = await users.findOrAddItemByProfile(
      {
        service: this.id,
        id: entity.id.toString(),
        username: 'username' in entity ? entity.username : undefined,
      },
      (profile) => this.fillUserProfile(entity, profile),
    );

    await users.save();

    const datetime = new Date(message.date * 1000);

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

      const info = await this.getCommentInfo(message, result);
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

        const info = await this.getCommentInfo(childItem, result);
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

  async updatePublication(publication: Publication) {
    if (!this.isPublication(publication)) {
      return;
    }

    if (publication.type === 'story') {
      const { views } = await this.grabStoryInfo(publication.id);

      publication.views = views;
      publication.updated = new Date();
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

    if (!this.canPublishPost(post)) {
      throw new Error(`Cannot publish post to ${this.name}`);
    }

    if (DEBUG_PUBLISHING) {
      console.log(`Published to ${this.name} with caption:\n${await this.createCaption(entry)}`);
      return;
    }
    let newPublications;

    switch (post.type) {
      case 'mention':
      case 'photoshop':
      case 'achievement':
        newPublications = await this.publishPostEntryAsStory(entry);
        break;
      default:
        newPublications = await this.publishPostEntryAsPhoto(entry);
    }

    post.posts = [...(post.posts ?? []), ...newPublications];
  }

  async publishPostEntryAsPhoto(entry: PostEntry): Promise<TelegramPublication[]> {
    const [, post] = entry;
    const { tg } = await this.connect();

    const followers = await this.grabFollowerCount();

    const content = asArray(post.content);
    const files = [];

    if (post.type === 'news') {
      const url = content[0];
      if (url) {
        const { base } = parseResourceUrl(url);
        const [file] = await readResource(url);
        // @ts-expect-error Untyped property
        file.name = base;

        files.push(file);
      }
    } else {
      if (content.length === 0) {
        throw new Error('No content found');
      }

      for (const url of content) {
        const { base, name } = parseResourceUrl(url);
        const [data, mimeType] = await readResource(url);
        let file;
        let filename;

        if (mimeType === 'image/webp') {
          file = await sharp(data).png({ quality: 100 }).toBuffer();
          filename = `${name}.png`;
        } else {
          file = data;
          filename = base;
        }

        // @ts-expect-error Untyped property
        file.name = filename;

        files.push(file);
      }
    }

    let result;

    if (files.length > 0) {
      result = await tg.sendFile(TELEGRAM_CHANNEL, {
        caption: await this.createCaption(entry),
        file: files.length > 1 ? files : files[0]!,
        parseMode: 'html',
      });
    } else {
      result = await tg.sendMessage(TELEGRAM_CHANNEL, { message: await this.createCaption(entry), parseMode: 'html' });
    }

    const id = Array.isArray(result) ? result.map((item: Api.Message) => item.id) : result.id;

    const publication: TelegramPublication = {
      service: this.id,
      id,
      followers,
      published: new Date(),
    };

    return [publication];
  }

  async publishPostEntryAsStory(entry: PostEntry): Promise<TelegramPublication[]> {
    const [, post] = entry;

    const { tg } = await this.connect();
    const { image } = await createPostStory(post);
    const media = await tg.uploadFile({ file: new CustomFile('story.png', image.length, '', image), workers: 1 });

    const result = await tg.invoke(
      new Api.stories.SendStory({
        peer: TELEGRAM_CHANNEL,
        media: new Api.InputMediaUploadedPhoto({ file: media, ttlSeconds: 43 }),
        privacyRules: [new Api.InputPrivacyValueAllowAll(undefined)],
        pinned: true,
        period: 2 * 86400,
      }),
    );

    if (!(result instanceof Api.Updates)) {
      throw new TypeError(`Wrong send story API response type for ${this.name}.`);
    }

    const storyId = result.updates.find((update) => update instanceof Api.UpdateStoryID)?.id;
    if (!storyId) {
      throw new TypeError(`Unable to get story ID from API response for ${this.name}.`);
    }

    const followers = await this.grabFollowerCount();

    const publication: TelegramPublication = {
      service: this.id,
      id: storyId,
      type: 'story',
      followers,
      published: new Date(),
    };

    return [publication];
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

  async grabFollowers() {
    const { tg } = await this.connect();

    // TODO: participants request is limited to 200, find a workaround
    const result = await tg.invoke(
      new Api.channels.GetParticipants({
        channel: TELEGRAM_CHANNEL,
        filter: new Api.ChannelParticipantsRecent(),
        limit: 10000,
      }),
    );

    if (!(result instanceof Api.channels.ChannelParticipants)) {
      return;
    }

    let i = 0;

    for (const participant of result.participants) {
      console.log(`${++i}/${result.participants.length}`);

      if (!(participant instanceof Api.ChannelParticipant)) {
        continue;
      }
      const user = result.users.find((user) => user.id.eq(participant.userId));
      if (!(user instanceof Api.User)) {
        continue;
      }
      const followed = new Date(participant.date * 1000);

      await users.findOrAddItemByProfile(
        {
          service: this.id,
          id: user.id.toString() || undefined,
          username: user.username || undefined,
          followed,
        },
        (profile, isExisting) => {
          if (isExisting) {
            setUserProfileFollowing(profile, followed);
          }

          return this.fillUserProfile(user, profile);
        },
      );
    }

    await users.save();
  }

  private async parseMessage(message: string) {
    const [, authorName] = message.split(' by ');
    let author: string | undefined;

    if (authorName) {
      [author] = (await users.findEntry((user) => user.name === authorName)) || [];
    }

    return { title: message, author: author || USER_DEFAULT_AUTHOR };
  }

  async grabPosts(afterPublication?: Publication) {
    if (afterPublication && !this.isPublication(afterPublication)) {
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
    let publication: TelegramPublication | undefined;

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
          type: getPostTypeFromContent(content) ?? 'shot', // TODO: get proper type from media
          posts: [publication],
        };
        posts.push(post);
      } else if (post && publication) {
        publication.id = [...(Array.isArray(publication.id) ? publication.id : [publication.id]), id];
        publication.likes = Math.max(publication.likes || 0, likes || 0) || undefined;
        publication.views = Math.max(publication.views || 0, message.views || 0) || undefined;
        post.content = publication.id.map(() => RESOURCE_MISSING_IMAGE);
        post.type = getPostTypeFromContent(post.content) ?? post.type;
      }
    }

    return posts;
  }

  async updateUserProfile(profile: UserProfile) {
    if (!(profile.id && profile.accessHash) && !profile.username) {
      throw new Error(`Cannot find user profile id and accessHash or username.`);
    }

    let entity;

    const { tg } = await this.connect();

    if (!profile.type || profile.type === 'bot') {
      try {
        if (profile.id && profile.accessHash) {
          entity = await tg.getEntity(
            new Api.InputPeerUser({ userId: BigInteger(profile.id), accessHash: BigInteger(profile.accessHash) }),
          );
        } else if (profile.username) {
          entity = await tg.getEntity(profile.username);
        }
      } catch {
        // Do nothing, entity is not a user
      }
    }

    if (!entity) {
      if (profile.id && profile.accessHash) {
        entity = await tg.getEntity(
          new Api.InputPeerChannel({
            channelId: BigInteger(profile.id),
            accessHash: BigInteger(profile.accessHash),
          }),
        );
      } else if (profile.username) {
        entity = await tg.getEntity(profile.username);
      }

      if (!entity) {
        if (profile.id) {
          entity = await tg.getEntity(
            new Api.InputPeerChat({
              chatId: BigInteger(profile.id),
            }),
          );
        } else if (profile.username) {
          entity = await tg.getEntity(profile.username);
        }
      }
    }

    if (!entity || !(entity instanceof Api.User || entity instanceof Api.Chat || entity instanceof Api.Channel)) {
      return;
    }

    await this.fillUserProfile(entity, profile);
  }

  private async fillUserProfile(entity: Api.User | Api.Channel | Api.Chat, profile: UserProfile) {
    const id = entity.id;
    const photo = entity.photo;

    const avatar =
      photo && !(photo instanceof Api.UserProfilePhotoEmpty) && !(photo instanceof Api.ChatPhotoEmpty)
        ? await saveUserAvatar(async () => {
            const { tg } = await this.connect();
            const data = await tg.downloadProfilePhoto(id, { isBig: true });

            return Buffer.isBuffer(data) ? data : undefined;
          }, `${this.id}-${photo.photoId.toString()}.jpg`)
        : undefined;

    let type: UserProfileType | undefined;
    let chat: Api.Chat | undefined;
    let channel: Api.Channel | undefined;
    let user: Api.User | undefined;

    if (entity instanceof Api.Channel) {
      type = 'channel';
      channel = entity;
    } else if (entity instanceof Api.Chat) {
      type = 'chat';
      chat = entity;
    } else {
      user = entity;
    }

    if (user?.bot) {
      type = 'bot';
    }

    const deleted = (chat?.deactivated ?? user?.deleted) || undefined;

    const name = !deleted
      ? chat?.title ||
        channel?.title ||
        [user?.firstName, user?.lastName].filter((item) => Boolean(item)).join(' ') ||
        undefined
      : undefined;

    profile.id = chat?.id.toString() || channel?.id.toString() || user?.id.toString() || undefined;
    profile.accessHash = channel?.accessHash?.toString() || user?.accessHash?.toString() || undefined;
    profile.username = channel?.username || user?.username || undefined;
    profile.type = type;
    profile.deleted = deleted;
    profile.name = name;
    profile.avatar = avatar;
    profile.updated = new Date();
  }
}

export const telegramManager = new TelegramManager();
