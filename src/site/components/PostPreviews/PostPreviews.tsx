import type { Component, JSX } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import type { PostInfo } from '../../../core/entities/post-info.js';

const VirtualPostPreviews = clientOnly(() => import('./VirtualPostPreviews.jsx'));

export interface PostPreviewsProps {
  label?: string;
  postInfos: PostInfo[];
  scrollTarget?: HTMLElement;
  selected?: string[];
  onSelectedChange?: (id: string, value: boolean) => void;
  actions?: JSX.Element;
}

export const PostPreviews: Component<PostPreviewsProps> = (props) => {
  return <VirtualPostPreviews {...props} />;
};
