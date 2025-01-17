import type { Post } from '../../core/entities/post.js';
import type { InboxItem, PostsManagerName, PublishablePost, TrashItem } from '../../core/entities/posts-manager.js';
import {
  getProposedPostChunkName,
  getPublishedPostChunkName,
  isInboxItem,
  isPublishablePost,
  isTrashOrInboxItem,
  PostsManager,
} from '../../core/entities/posts-manager.js';

interface SitePostsManagerProps<TPost extends Post> {
  name: PostsManagerName;
  checkPost: (post: Post, errors?: string[]) => post is TPost;
  getItemChunkName: (id: string) => string;
}

export class SitePostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;

  readonly checkPost: (post: Post, errors?: string[]) => post is TPost;
  readonly getItemChunkName: (id: string) => string;

  constructor({ name, checkPost, getItemChunkName }: SitePostsManagerProps<TPost>) {
    super();
    this.name = name;
    this.checkPost = checkPost;

    this.getItemChunkName = getItemChunkName;
  }

  addItem = async (post: string | Post, id: string | undefined) => {
    console.log('addPost', id, post);
  };

  removeItem = async (id: string) => {
    console.log('removePost', id);
  };

  updateItem = async (id: string) => {
    console.log('updatePost', id);
  };

  async loadChunkNames() {
    const index = (await fetch('/data/index.json').then((r) => r.json())) as string[];

    return index
      .filter((pathname: string) => pathname.startsWith(`${this.name}/`))
      .map((pathname) => /\/([^/]+)\.json$/.exec(pathname)?.[1] || '');
  }

  protected async loadChunkData(chunkName: string) {
    const filename = `/data/${this.name}/${chunkName}.json`;

    if (!filename) {
      throw new Error(`Chunk "${chunkName}" not found`);
    }

    try {
      const data = JSON.parse(await fetch(filename).then((r) => r.text()), (_, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      }) as unknown;

      if (typeof data !== 'object' || data === null) {
        throw new TypeError(`File "${filename}" expected to be the map of posts`);
      }

      return [...Object.entries(data)].sort(([id1], [id2]) => id1.localeCompare(id2));
    } catch (error) {
      throw new Error(`Failed to load chunk "${chunkName}": ${error}`);
    }
  }

  protected async saveChunk(chunkName: string) {
    console.log('Saving chunk', chunkName);
  }
}

export const posts = new SitePostsManager<PublishablePost>({
  name: 'posts',
  checkPost: isPublishablePost,
  getItemChunkName: getPublishedPostChunkName,
});

export const inbox = new SitePostsManager<InboxItem>({
  name: 'inbox',
  checkPost: isInboxItem,
  getItemChunkName: getProposedPostChunkName,
});

export const trash = new SitePostsManager<TrashItem | InboxItem>({
  name: 'trash',
  checkPost: isTrashOrInboxItem,
  getItemChunkName: getProposedPostChunkName,
});

export const postsManagers: SitePostsManager[] = [posts, inbox, trash];
