import type { Component } from 'solid-js';
import type { PostInfo } from '../../../core/entities/post-info.js';
import VirtualPostPreviews from './VirtualPostPreviews.jsx';

export interface PostPreviewsProps {
  postInfos: PostInfo[];
  scrollTarget?: HTMLElement;
  selected?: string[];
  onSelectedChange?: (id: string, value: boolean) => void;
}

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  return <VirtualPostPreviews {...props} />;
};
