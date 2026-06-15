import type { Component } from 'solid-js';
import type { UserInfo } from '../../../core/entities/user-info.js';
import VirtualUserPreviews from './VirtualUserPreviews.jsx';

export interface UserPreviewsProps {
  label?: string;
  userInfos: UserInfo[];
  scrollTarget?: HTMLElement;
}

export const UserPreviews: Component<UserPreviewsProps> = (props) => {
  return <VirtualUserPreviews {...props} />;
};
