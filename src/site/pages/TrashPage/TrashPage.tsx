import { type Component } from 'solid-js';
import { PostsPage } from '../../components/PostsPage/PostsPage.js';
import { trash } from '../../data-managers/posts.js';

export const TrashPage: Component = () => {
  return (
    <PostsPage
      manager={trash}
      title="Trash"
      sortKeys={['id']}
      presetKeys={['revisit', 'violations']}
      filters={['mark', 'violation', 'location', 'type']}
    />
  );
};
