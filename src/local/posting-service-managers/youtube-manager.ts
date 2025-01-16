import type { youtube_v3 } from '@googleapis/youtube';
import { youtube } from '@googleapis/youtube';
import type { PostEntry } from '../../core/entities/post.js';
import type { Publication, PublicationComment } from '../../core/entities/publication.js';
import type { PostingServiceManager } from '../../core/entities/service.js';
import { YouTube } from '../../core/services/youtube.js';

const YOUTUBE_CHANNEL_ID = 'UCoSD49h3Nrss_Zix8boMwlw';

let yt: youtube_v3.Youtube | undefined;

export class YouTubeManager extends YouTube implements PostingServiceManager {
  async connect() {
    if (!yt) {
      const { YOUTUBE_API_KEY } = process.env;

      if (!YOUTUBE_API_KEY) {
        throw new Error(`Need ${this.name} API key`);
      }

      yt = youtube({
        version: 'v3',
        auth: YOUTUBE_API_KEY,
      });
    }

    return { yt };
  }

  async disconnect() {}

  async grabPostInfo(postId: string) {
    const { yt } = await this.connect();

    const { data } = await yt.videos.list({ id: [postId], part: ['statistics'] });
    const video = data.items?.[0];

    const commentCount = Number(video?.statistics?.commentCount);
    let comments;
    if (commentCount > 0) {
      comments = await this.grabPostComments(postId);
    }

    return {
      likes: Number(video?.statistics?.likeCount),
      views: Number(video?.statistics?.viewCount),
      comments,
    };
  }

  async grabPostComments(postId: string): Promise<PublicationComment[] | undefined> {
    const { yt } = await this.connect();
    const comments: PublicationComment[] = [];

    const { data } = await yt.commentThreads.list({ videoId: postId, part: ['snippet', 'replies'], maxResults: 100 });

    if (!data.items) {
      return undefined;
    }

    for (const item of data.items) {
      const info = this.getCommentInfo(item);
      if (!info) {
        continue;
      }

      // TODO: grab replies when some replies appear

      comments.push({ ...info });
    }

    return comments.length > 0 ? comments : undefined;
  }

  private getCommentInfo(commentThread: youtube_v3.Schema$CommentThread) {
    const { snippet } = commentThread.snippet?.topLevelComment ?? {};
    if (!snippet?.publishedAt || !snippet.authorDisplayName || !snippet.textDisplay) {
      return;
    }

    const text = snippet.textDisplay;
    const author = snippet.authorDisplayName;
    const datetime = new Date(snippet.publishedAt);

    return { datetime, author, text };
  }

  async updatePublication(publication: Publication) {
    if (!this.isPost(publication)) {
      return;
    }

    const { likes, views, comments } = await this.grabPostInfo(publication.id);

    publication.likes = likes;
    publication.views = views;
    publication.comments = comments;
    publication.updated = new Date();
  }

  async publishPostEntry(_entry: PostEntry): Promise<void> {}

  async grabFollowerCount() {
    const { yt } = await this.connect();
    const { data } = await yt.channels.list({ id: [YOUTUBE_CHANNEL_ID], part: ['statistics'] });

    return Number(data.items?.[0]?.statistics?.subscriberCount);
  }

  async grabPosts(_afterPublication?: Publication) {
    return [];
  }
}

export const youtubeManager = new YouTubeManager();
