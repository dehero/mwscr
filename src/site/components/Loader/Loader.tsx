import { type Component, createRenderEffect, createSignal } from 'solid-js';
import { Frame } from '../Frame/Frame.js';
import styles from './Loader.module.css';

export interface LoaderProps {
  initialPercent?: number;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

export const Loader: Component<LoaderProps> = (props) => {
  const [percent, setPercent] = createSignal(
    props.initialPercent ? (props.initialPercent > 100 ? 100 : props.initialPercent < 0 ? 0 : props.initialPercent) : 0,
  );

  createRenderEffect(() => {
    setTimeout(() => setPercent(100));
  });

  return (
    <Frame class={styles.loader}>
      <div
        class={styles.bar}
        style={{ width: `${percent()}%` }}
        onAnimationStart={props.onAnimationStart}
        onAnimationEnd={props.onAnimationEnd}
        onTransitionStart={props.onAnimationStart}
        onTransitionEnd={props.onAnimationEnd}
        onTransitionCancel={props.onAnimationEnd}
      />
    </Frame>
  );
};
