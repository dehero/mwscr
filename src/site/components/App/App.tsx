import type { Component } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './App.module.css';

export const App: Component = () => {
  return (
    <div class={styles.app}>
      <Frame variant="thin" class={styles.frame}>
        Morrowind Screenshots
      </Frame>
    </div>
  );
};
