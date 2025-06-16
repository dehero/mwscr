import type { Component } from 'solid-js';
import { clientOnly } from 'vike-solid/clientOnly';
import type { UserInfo } from '../../../core/entities/user-info.js';

const VirtualUserPreviews = clientOnly(() => import('./VirtualUserPreviews.jsx'));

export interface UserPreviewsProps {
  label?: string;
  userInfos: UserInfo[];
  scrollTarget?: HTMLElement;
}

export const UserPreviews: Component<UserPreviewsProps> = (props) => {
  return <VirtualUserPreviews {...props} />;
};
