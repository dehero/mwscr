import { type Component, For } from 'solid-js';
import posts from '../../../../data/published/2023.yml';
import { Frame } from '../Frame/Frame.js';
import { PostPreview } from '../PostPreview/PostPreview.jsx';
import styles from './App.module.css';

export const App: Component = () => {
  return (
    <div class={styles.app}>
      <Frame variant="thin" class={styles.frame}>
        Morrowind Screenshots
      </Frame>
      <div class={styles.posts}>
        <For each={Object.entries(posts)}>{([, post]) => <PostPreview post={post} />}</For>
      </div>
    </div>
  );
};
