import { type Component } from 'solid-js';
import { PostsPage } from '../../components/PostsPage/PostsPage.js';
import { inbox } from '../../data-managers/posts.js';

export const InboxPage: Component = () => {
  return (
    <PostsPage
      manager={inbox}
      title="Inbox"
      sortKeys={['id']}
      presetKeys={['shortlist', 'requests']}
      filters={['author', 'check', 'location', 'mark', 'type']}
    />
  );
};
