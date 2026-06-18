import { type Comment, compareCommentsByDatetime } from './comment.js';
import type { DataManager } from './data-manager.js';
import type { PostAspectRatio, PostContent } from './post.js';
import { createPostPath } from './posts-manager.js';
import { getPublicationsCommentsWithService } from './publication.js';

export interface CommentInfo extends Comment {
  service: string;
  path: string;
  title?: string;
  content?: PostContent;
  aspect?: PostAspectRatio;
  parent?: Comment;
}

export async function createCommentInfos(dataManager: DataManager): Promise<CommentInfo[]> {
  const sorter = compareCommentsByDatetime('desc');

  const result = (
    await Promise.all(
      dataManager.postsManagers.flatMap(async (manager) => {
        const entries = await manager.getAllEntries(true);
        return entries
          .flatMap(([id, post]) =>
            getPublicationsCommentsWithService(post.posts ?? [], sorter).flatMap((parent) =>
              [parent, ...(parent.replies ?? [])].map(
                (comment, index): CommentInfo => ({
                  author: comment.author,
                  datetime: comment.datetime,
                  text: comment.text,
                  service: parent.service,
                  path: createPostPath(manager.name, id),
                  title: post.title,
                  content: post.content,
                  aspect: post.aspect,
                  parent:
                    index > 0
                      ? {
                          author: parent.author,
                          datetime: parent.datetime,
                          text: parent.text,
                        }
                      : undefined,
                }),
              ),
            ),
          )
          .flat();
      }),
    )
  ).flat();

  return result.sort(sorter);
}
