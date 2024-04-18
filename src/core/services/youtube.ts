import type { Post } from '../entities/post.js';
import type { ServicePost } from '../entities/service-post.js';

interface YouTubeSuitablePost extends Post {
  title: string;
  content: string;
  type: 'video';
}

export type YouTubePost = ServicePost<string>;

export function isYouTubePost(servicePost: ServicePost<unknown>): servicePost is YouTubePost {
  return servicePost.service === id && typeof servicePost.id === 'string';
}

export const id = 'yt';
export const name = 'YouTube';

export function canPublishPost(_post: Post, _errors?: string[]): _post is YouTubeSuitablePost {
  return false;
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
