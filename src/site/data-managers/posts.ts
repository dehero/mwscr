import type { Post } from '../../core/entities/post.js';
import type { InboxItem, PublishablePost, TrashItem } from '../../core/entities/post-variation.js';
import { getPostDraftChunkName, getPublishedPostChunkName } from '../../core/entities/post-variation.js';
import type { PostsManagerName } from '../../core/entities/posts-manager.js';
import { PostsManager } from '../../core/entities/posts-manager.js';

interface SitePostsManagerProps {
  name: PostsManagerName;
  getItemChunkName: (id: string) => string;
}

class SitePostsManager<TPost extends Post = Post> extends PostsManager<TPost> {
  readonly name: PostsManagerName;
  readonly getItemChunkName: (id: string) => string;

  constructor({ name, getItemChunkName }: SitePostsManagerProps) {
    super();
    this.name = name;
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
  getItemChunkName: getPublishedPostChunkName,
});

export const inbox = new SitePostsManager<InboxItem>({
  name: 'inbox',
  getItemChunkName: getPostDraftChunkName,
});

export const trash = new SitePostsManager<TrashItem | InboxItem>({
  name: 'trash',
  getItemChunkName: getPostDraftChunkName,
});

export const postsManagers: PostsManager[] = [posts, inbox, trash];
