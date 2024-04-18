import type { youtube_v3 } from '@googleapis/youtube';
import { youtube } from '@googleapis/youtube';
import { type Post } from '../../core/entities/post.js';
import type { ServicePost, ServicePostComment } from '../../core/entities/service-post.js';

interface YouTubeSuitablePost extends Post {
  title: string;
  content: string;
  type: 'video';
}

export type YouTubePost = ServicePost<string>;

function isYouTubePost(servicePost: ServicePost<unknown>): servicePost is YouTubePost {
  return servicePost.service === id && typeof servicePost.id === 'string';
}

export const id = 'yt';
export const name = 'YouTube';

let yt: youtube_v3.Youtube | undefined;

const YOUTUBE_CHANNEL_ID = 'UCoSD49h3Nrss_Zix8boMwlw';

export async function connect() {
  if (!yt) {
    const { YOUTUBE_API_KEY } = process.env;

    if (!YOUTUBE_API_KEY) {
      throw new Error(`Need ${name} API key`);
    }

    yt = youtube({
      version: 'v3',
      auth: YOUTUBE_API_KEY,
    });
  }

  return { yt };
}

export async function disconnect() {}

export async function grabPostInfo(postId: string) {
  const { yt } = await connect();

  const { data } = await yt.videos.list({ id: [postId], part: ['statistics'] });
  const video = data.items?.[0];

  const commentCount = Number(video?.statistics?.commentCount);
  let comments;
  if (commentCount > 0) {
    comments = await grabPostComments(postId);
  }

  return {
    likes: Number(video?.statistics?.likeCount),
    views: Number(video?.statistics?.viewCount),
    comments,
  };
}

export async function grabPostComments(postId: string): Promise<ServicePostComment[] | undefined> {
  const { yt } = await connect();
  const comments: ServicePostComment[] = [];

  const { data } = await yt.commentThreads.list({ videoId: postId, part: ['snippet', 'replies'], maxResults: 100 });

  if (!data.items) {
    return undefined;
  }

  for (const item of data.items) {
    const info = getCommentInfo(item);
    if (!info) {
      continue;
    }

    // TODO: grab replies when some replies appear

    comments.push({ ...info });
  }

  return comments.length > 0 ? comments : undefined;
}

function getCommentInfo(commentThread: youtube_v3.Schema$CommentThread) {
  const { snippet } = commentThread.snippet?.topLevelComment ?? {};
  if (!snippet?.publishedAt || !snippet.authorDisplayName || !snippet.textDisplay) {
    return;
  }

  const text = snippet.textDisplay;
  const author = snippet.authorDisplayName;
  const datetime = new Date(snippet.publishedAt);

  return { datetime, author, text };
}

export async function updateServicePost(servicePost: ServicePost<unknown>) {
  if (!isYouTubePost(servicePost)) {
    return;
  }

  const { likes, views, comments } = await grabPostInfo(servicePost.id);

  servicePost.likes = likes;
  servicePost.views = views;
  servicePost.comments = comments;
  servicePost.updated = new Date();
}

export function canPublishPost(_post: Post, _errors?: string[]): _post is YouTubeSuitablePost {
  return false;
}

export async function publishPost(_post: Post): Promise<void> {}

export async function grabFollowerCount() {
  const { yt } = await connect();
  const { data } = await yt.channels.list({ id: [YOUTUBE_CHANNEL_ID], part: ['statistics'] });

  return Number(data.items?.[0]?.statistics?.subscriberCount);
}

export async function grabPosts(_afterServicePost?: ServicePost<unknown>) {
  return [];
}

export function getServicePostUrl(servicePost: ServicePost<unknown>) {
  if (!servicePost.id) {
    return;
  }
  return `https://www.youtube.com/watch?v=${servicePost.id}`;
}

export function getUserProfileUrl(userId: string) {
  return `https://www.youtube.com/channel/${userId}`;
}
