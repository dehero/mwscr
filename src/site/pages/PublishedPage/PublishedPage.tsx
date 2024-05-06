import { type Component } from 'solid-js';
import { PostsPage } from '../../components/PostsPage/PostsPage.js';
import { published } from '../../data-managers/posts.js';

export const PublishedPage: Component = () => {
  return (
    <PostsPage
      manager={published}
      title="Published Posts"
      presetKeys={['editors-choice', 'unlocated', 'requests']}
      filters={['author', 'location', 'mark', 'tag', 'type']}
    />
  );
};
