import clsx from 'clsx';
import type { Component } from 'solid-js';
import type { MediaAspectRatio } from '../../../core/entities/media.js';
import { Frame } from '../Frame/Frame.jsx';
import styles from './VideoPlayer.module.css';

export interface VideoPlayerProps {
  src: string;
  aspectRatio?: MediaAspectRatio;
  onLoad?: () => void;
  onError?: () => void;
  class?: string;
  poster?: string;
  title?: string;
}

export const VideoPlayer: Component<VideoPlayerProps> = (props) => {
  return (
    <Frame
      component="video"
      id="player"
      playsinline
      controls
      class={clsx(styles.video, props.class)}
      style={{ 'aspect-ratio': props.aspectRatio }}
      onloadeddata={props.onLoad}
      onerror={props.onError}
      src={props.src}
      poster={props.poster}
      title={props.title}
      // @ts-expect-error No proper typing
      controlslist="nodownload"
    >
      {/* Chrome does not trigger error event for src added as source tag */}
      {/* <source src={props.src} type="video/mp4" /> */}
    </Frame>
  );
};
