import 'dotenv/config';
import { GreenApiClient } from '@green-api/greenapi-integration';
import { markdownToText } from '../../core/entities/markdown.js';
import type { PostEntry } from '../../core/entities/post.js';
import { getPostFirstPublished, postAddonDescriptors, postTypeDescriptors } from '../../core/entities/post.js';
import type { Publication } from '../../core/entities/publication.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import type { UserProfile } from '../../core/entities/user.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import type { MAXPublication } from '../../core/services/max.js';
import { MAX as MAXService, MAX_CHAT_ID } from '../../core/services/max.js';
import { asArray } from '../../core/utils/common-utils.js';
import { formatDate, getDaysPassed } from '../../core/utils/date-utils.js';
import { locations } from '../data-managers/locations.js';
import { readResource } from '../data-managers/resources.js';
import { users } from '../data-managers/users.js';

const DEBUG_PUBLISHING = Boolean(process.env.DEBUG_PUBLISHING) || false;

export class MAXManager extends MAXService implements PostingServiceManager {
  readonly postingStartDate = new Date('2026-02-14');

  greenApi: GreenApiClient | undefined;

  async parseMessageText(text: string) {
    const lines = text.split('\n');

    const title = lines[0]?.replace(/\[.*\|(.*)\]/g, '$1').trim();
    const tags = lines[1]?.split(/\s*#/).filter((item) => Boolean(item));
    const [, authorName] = title?.split(' от ') || [];
    let author: string | undefined;

    if (authorName) {
      [author] =
        (await users.findEntry(
          (user) => user.name === authorName || user.nameRu === authorName || user.nameRuFrom === authorName,
        )) || [];
    }

    return { title, tags, author: author || USER_DEFAULT_AUTHOR };
  }

  async mentionUsers(user: string | string[]) {
    const mentions: string[] = [];
    const userIds = asArray(user);

    for (const userId of userIds) {
      const user = await users.getItem(userId);
      const name = user?.nameRuFrom || user?.name || userId;
      const profile = user?.profiles?.find((profile) => profile.service === this.id)?.username;

      mentions.push(profile ? `@${profile} (${name})` : name);
    }

    return mentions.join(', ');
  }

  async createCaption(entry: PostEntry) {
    const [, post] = entry;

    const lines: string[] = [];

    const description = markdownToText(post.descriptionRu || post.description || '', true).text;

    if (post.type !== 'news') {
      const contributors: string[] = [];
      const titlePrefix = [
        post.type !== 'shot' ? postTypeDescriptors[post.type].titleRu : undefined,
        post.addon && !postAddonDescriptors[post.addon].official ? post.addon : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      if (post.titleRu) {
        lines.push([titlePrefix, post.titleRu].filter(Boolean).join(': '));
      } else if (titlePrefix) {
        lines.push(titlePrefix);
      }

      // TODO: mention USER_DEFAULT_AUTHOR in shot-sets created not just by USER_DEFAULT_AUTHOR
      const authors = asArray(post.author).filter((author) => author !== USER_DEFAULT_AUTHOR);
      if (authors.length > 0) {
        contributors.push(`от ${await this.mentionUsers(authors)}`);
      }

      if (post.request && post.request.user !== USER_DEFAULT_AUTHOR) {
        contributors.push(`по запросу ${await this.mentionUsers(post.request.user)}`);
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

    const locationIds = asArray(post.location);
    if (locationIds.length > 0) {
      const locationTitles: string[] = [];
      for (const id of locationIds) {
        const location = await locations.getItem(id);
        if (!location) {
          continue;
        }

        if (location.titleRu) {
          if (location.titleRu !== post.titleRu) {
            locationTitles.push(location.titleRu);
          }
        } else if (location.title !== post.titleRu) {
          lines.push(location.title);
        }
      }

      if (locationTitles.length > 0) {
        lines.push(locationTitles.join('; '));
      }
    }

    const firstPublished = getPostFirstPublished(post);
    if (firstPublished && getDaysPassed(firstPublished) > 7) {
      lines.push(formatDate(firstPublished, 'ru-RU'));
    }

    return lines.join('\n');
  }

  async connect() {
    if (!this.greenApi) {
      const { MAX_GREEN_API_INSTANCE_ID, MAX_GREEN_API_TOKEN } = process.env;

      if (!MAX_GREEN_API_INSTANCE_ID) {
        throw new Error(`Need ${this.name} Green-API instance ID`);
      }

      if (!MAX_GREEN_API_TOKEN) {
        throw new Error(`Need ${this.name} Green-API token`);
      }

      this.greenApi = new GreenApiClient({
        idInstance: Number(MAX_GREEN_API_INSTANCE_ID),
        apiTokenInstance: MAX_GREEN_API_TOKEN,
        settings: {},
      });
    }

    return { greenApi: this.greenApi };
  }

  async disconnect() {}

  async publishPostEntry(entry: PostEntry): Promise<void> {
    const [, post] = entry;

    if (!this.canPublishPost(post)) {
      throw new Error(`Cannot publish post to ${this.name}`);
    }

    if (DEBUG_PUBLISHING) {
      console.log(`Published to ${this.name} with caption:\n${await this.createCaption(entry)}`);
      return;
    }

    let newPublications: MAXPublication[];

    switch (post.type) {
      case 'shot':
      case 'wallpaper':
      case 'wallpaper-v':
        newPublications = await this.publishPostEntryAsPhoto(entry);
        break;
      default:
        newPublications = [];
    }

    post.posts = [...(post.posts ?? []), ...newPublications];
  }

  async publishPostEntryAsPhoto(entry: PostEntry): Promise<MAXPublication[]> {
    const [, post] = entry;

    const { greenApi } = await this.connect();

    const content = asArray<string>(post.content);
    const url = content[0];
    if (!url) {
      throw new Error('No content found');
    }
    const [file, mimeType, fileName] = await readResource(url);
    // @ts-expect-error Conversion of Buffer to Blob is actually allowed
    const data = new Blob([file], { type: mimeType });

    const result = await greenApi.sendFileByUpload({
      chatId: MAX_CHAT_ID.toString(),
      file: {
        data,
        fileName,
      },
      caption: await this.createCaption(entry),
    });
    const followers = await this.grabFollowerCount();

    return [{ service: this.id, id: result.idMessage, followers, published: new Date() }];
  }

  async updatePublication(_publication: Publication) {
    // TODO: unable to implement for now
  }

  async grabFollowerCount() {
    // TODO: unable to implement for now
    return 2;
  }

  async grabPosts(_afterPublication?: Publication) {
    // TODO: unable to implement for now
    return [];
  }

  async updateUserProfile(_profile: UserProfile) {
    // TODO: unable to implement for now
  }

  async grabFollowers() {
    // TODO: unable to implement for now
  }
}

export const maxManager = new MAXManager();
