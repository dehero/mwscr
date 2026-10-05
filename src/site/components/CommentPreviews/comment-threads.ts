import type { Comment } from '../../../core/entities/comment.ts';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';

export interface CommentThread {
  commentInfos: CommentInfo[];
  parent?: Comment;
  parentInfo?: CommentInfo;
}

const commentKey = (comment: Comment) => `${comment.datetime.getTime()}-${comment.author}-${comment.text}`;

export const createCommentThreads = (commentInfos: CommentInfo[]): CommentThread[] => {
  const threads: CommentThread[] = [];

  for (const info of commentInfos) {
    const last = threads[threads.length - 1];

    if (!info.parent) {
      // A standalone comment right after replies to it becomes the real parent of that thread.
      if (last && !last.parentInfo && last.parent && commentKey(last.parent) === commentKey(info)) {
        last.parentInfo = info;
        continue;
      }

      threads.push({ commentInfos: [info] });
      continue;
    }

    const parentKey = commentKey(info.parent);

    if (last) {
      // Another reply to the same parent.
      if (last.parentInfo && commentKey(last.parentInfo) === parentKey) {
        last.commentInfos.push(info);
        continue;
      }

      if (last.parent && commentKey(last.parent) === parentKey) {
        last.commentInfos.push(info);
        continue;
      }

      // A standalone comment right before a reply to it becomes the real parent of the thread.
      const single = last.commentInfos[0];
      if (
        !last.parentInfo &&
        !last.parent &&
        last.commentInfos.length === 1 &&
        single &&
        commentKey(single) === parentKey
      ) {
        last.parentInfo = single;
        last.commentInfos = [info];
        continue;
      }
    }

    threads.push({ parent: info.parent, commentInfos: [info] });
  }

  return threads;
};
