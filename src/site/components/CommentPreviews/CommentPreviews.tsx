import type { Component } from 'solid-js';
import type { CommentInfo } from '../../../core/entities/comment-info.ts';
import VirtualCommentPreviews from './VirtualCommentPreviews.tsx';

export interface CommentPreviewsProps {
  commentInfos: CommentInfo[];
  class?: string;
  hideAuthorName?: boolean;
  scrollTarget?: HTMLElement;
}

export const CommentPreviews: Component<CommentPreviewsProps> = (props) => {
  return <VirtualCommentPreviews {...props} />;
};
