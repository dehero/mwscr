/**
 * This module provides functions for interacting with the Instagram API.
 */
import type { AbstractRequest, CreatedObjectIdResponse, GetMediaInfoResponse } from 'instagram-graph-api';
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
import type { Post, PostEntry } from '../../core/entities/post.js';
import { getPostFirstPublished, getPostTypesFromContent, postTypeDescriptors } from '../../core/entities/post.js';
import { createPostTags } from '../../core/entities/post-tag.js';
import type { Publication, PublicationComment } from '../../core/entities/publication.js';
import { RESOURCE_MISSING_IMAGE } from '../../core/entities/resource.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { USER_DEFAULT_AUTHOR } from '../../core/entities/user.js';
import type { InstagramPublication } from '../../core/services/instagram.js';
import { Instagram } from '../../core/services/instagram.js';
import { site } from '../../core/services/site.js';
import { asArray } from '../../core/utils/common-utils.js';
import { formatDate, getDaysPassed } from '../../core/utils/date-utils.js';
import { readResource } from '../data-managers/resources.js';
import { users } from '../data-managers/users.js';

const INSTAGRAM_PAGE_ID = '17841404237421312'; // Instagram Business ID

const DEBUG_PUBLISHING = Boolean(process.env.DEBUG_PUBLISHING) || false;

export class InstagramManager extends Instagram implements PostingServiceManager {
  ig: Client | undefined;

  async parseCaption(caption: string) {
    const lines = caption.split('\n');

    const title = lines[0];
    const tags = lines[1]?.split(/\s*#/).filter((item) => Boolean(item));
    const requester = lines[2]?.split('@')[1];

    const request = requester ? { user: requester } : undefined;

    const [, authorName] = title?.split(' by ') || [];
    let author: string | undefined;

    if (authorName) {
      [author] = (await users.findEntry({ name: authorName })) || [];
    }

    return { title, tags, request, author: author || USER_DEFAULT_AUTHOR };
  }

  async createCaption(entry: PostEntry) {
    const [id, post] = entry;
    const lines: string[] = [];
    const tags = createPostTags(post);
    const contributors: string[] = [];
    const titlePrefix = post.type !== 'shot' ? postTypeDescriptors[post.type].title : undefined;

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

    if (tags.length > 0) {
      lines.push(tags.map((tag) => `#${tag}`).join(' '));
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

    lines.push(`View and Download: ${site.getPostUrl(id)}`);

    return lines.join('\n');
  }

  async mentionUsers(user: string | string[]) {
    const mentions: string[] = [];
    const userIds = asArray(user);

    for (const userId of userIds) {
      const user = await users.getItem(userId);
      const name = user?.name || userId;
      const profile = user?.profiles?.[this.id];

      mentions.push(profile ? `@${profile}` : name);
    }

    return mentions.join(', ');
  }

  async getUploadUrl(data: Buffer) {
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

  async getCroppedImageUrl(image: sharp.Sharp, width: number, height: number): Promise<string> {
    // Crop and convert the image to JPEG
    const jpeg = await image.clone().resize(width, height).jpeg({ quality: 100 }).toBuffer();

    return this.getUploadUrl(jpeg);
  }

  async connect() {
    if (!this.ig) {
      const { INSTAGRAM_ACCESS_TOKEN } = process.env;
      if (!INSTAGRAM_ACCESS_TOKEN) {
        throw new Error(`Need ${this.name} access token`);
      }

      this.ig = new Client(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID);
    }

    return { ig: this.ig };
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

    // Connect to Instagram API
    const { ig } = await this.connect();

    let maxHeightMultiplier;

    switch (post.type) {
      case 'wallpaper-v':
        maxHeightMultiplier = 1.25;
        break;
      case 'wallpaper':
        maxHeightMultiplier = 0.5625;
        break;
      default:
        maxHeightMultiplier = 1;
    }

    const [file] = await readResource(firstContent);
    const firstImage = sharp(file);
    const { width = 0 } = await firstImage.metadata();
    const height = Math.floor(width * maxHeightMultiplier);

    const caption = await this.createCaption(entry);
    const firstImageUrl = await this.getCroppedImageUrl(firstImage, width, height);
    const firstContainerId = await this.createContainer(ig.newPostPagePhotoMediaRequest(firstImageUrl, caption));

    let containerId;

    if (post.type === 'redrawing' || post.type === 'shot-set') {
      const children = [firstContainerId];

      for (const url of restContent) {
        const [file] = await readResource(url);
        const imageUrl = await this.getCroppedImageUrl(sharp(file), width, height);
        children.push(await this.createContainer(ig.newPostPagePhotoMediaRequest(imageUrl, caption)));
      }
      containerId = await this.createContainer(ig.newPostPageCarouselMediaRequest(children, caption));
    } else {
      containerId = firstContainerId;
    }

    const [mediaId, mediaInfo] = await this.publishContainer(containerId);
    const id = mediaInfo.getShortcode() || mediaInfo.getIgId();

    if (!id) {
      throw new Error(`Cannot get post ${this.name} id`);
    }

    const followers = await this.grabFollowerCount();

    const newPublications: InstagramPublication[] = [{ service: 'ig', id, mediaId, followers, published: new Date() }];

    // Create story for "wallpaper-v" post type
    if (post.type === 'wallpaper-v') {
      const imageUrl = await this.getCroppedImageUrl(firstImage, width, Math.floor(width * (16 / 9)));
      const containerId = await this.createContainer(ig.newPostPageStoriesPhotoMediaRequest(imageUrl));
      const [mediaId, mediaInfo] = await this.publishContainer(containerId);
      const id = mediaInfo.getShortcode() || mediaInfo.getIgId();

      if (!id) {
        throw new Error(`Cannot get post ${this.name} story id`);
      }

      newPublications.push({ service: 'ig', id, mediaId, followers, published: new Date() });
    }

    post.posts = [...(post.posts ?? []), ...newPublications];
  }

  async publishContainer(containerId: string): Promise<[string, GetMediaInfoResponse]> {
    const { ig } = await this.connect();

    const mediaResponse = await ig.newPostPublishMediaRequest(containerId).execute();
    const mediaId = mediaResponse.getId();

    // Get media information from Instagram
    const mediaInfo = await ig
      .newGetMediaInfoRequest(mediaId, PrivateMediaField.SHORTCODE, PrivateMediaField.IG_ID)
      .execute();

    return [mediaId, mediaInfo];
  }

  async createContainer(request: AbstractRequest<CreatedObjectIdResponse>): Promise<string> {
    const { ig } = await this.connect();

    const createContainerResponse = await request.execute();
    const containerId = createContainerResponse.getId();

    // Wait for the container to finish uploading
    for (let i = 0; i < 5; i++) {
      const containerResponse = await ig.newGetContainerRequest(containerId, ContainerField.STATUS_CODE).execute();
      const statusCode = containerResponse.getContainerStatusCode();

      if (statusCode === CONTAINER_STATUS_CODE.FINISHED) {
        break;
      }
    }

    return containerId;
  }

  async disconnect() {}

  async grabPostInfo(mediaId: string) {
    const { ig } = await this.connect();

    // Get the like count and comments count for the media
    const response = await ig
      .newGetMediaInfoRequest(mediaId, PublicMediaField.LIKE_COUNT, PublicMediaField.COMMENTS_COUNT)
      .execute();

    const item = response.getData();
    let comments;
    if (item.comments_count) {
      // Get the comments for the media if there are any
      try {
        comments = await this.getPostComments(mediaId);
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

  private async getPostComments(mediaId: string): Promise<PublicationComment[] | undefined> {
    const { ig } = await this.connect();
    const comments: PublicationComment[] = [];

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

      const replies: PublicationComment[] = [];
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

  async updatePublication(publication: Publication) {
    if (!this.isPost(publication) || !publication.mediaId) {
      return;
    }

    const { likes, views, comments } = await this.grabPostInfo(publication.mediaId);

    publication.likes = likes;
    publication.views = views || publication.views;
    publication.comments = comments || publication.comments;
    publication.updated = new Date();
  }

  async grabFollowerCount() {
    const { ig } = await this.connect();
    const request = ig.newGetPageInfoRequest(PageField.FOLLOWERS_COUNT);
    const response = await request.execute();
    const data = response.getData();

    return data.followers_count;
  }

  async grabPosts(afterPublication?: Publication) {
    if (afterPublication && !this.isPost(afterPublication)) {
      throw new Error(`Invalid ${this.name} post`);
    }

    const afterMediaId = afterPublication?.mediaId;
    const { ig } = await this.connect();
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
        } = await this.parseCaption(item.caption);
        const published = new Date(item.timestamp);
        const content = item.children?.data.length
          ? item.children.data.map(() => RESOURCE_MISSING_IMAGE)
          : RESOURCE_MISSING_IMAGE;

        const hoursPassed = Math.abs(new Date().getTime() - published.getTime()) / 3600000;
        let followers: number | undefined;
        if (hoursPassed <= 12) {
          followers = await this.grabFollowerCount();
        }

        let comments;
        if (item.comments_count) {
          comments = await this.getPostComments(item.id);
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
}

export const instagramManager = new InstagramManager();
