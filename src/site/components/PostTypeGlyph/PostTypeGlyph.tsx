import type { Component } from 'solid-js';
import { type PostType, postTypeDescriptors } from '../../../core/entities/post.js';
import Clip from '../../images/post-type-clip.svg';
import Redrawing from '../../images/post-type-redrawing.svg';
import Shot from '../../images/post-type-shot.svg';
import ShotSet from '../../images/post-type-shot-set.svg';
import Video from '../../images/post-type-video.svg';
import Wallpaper from '../../images/post-type-wallpaper.svg';
import WallpaperV from '../../images/post-type-wallpaper-v.svg';

const glyphs: Record<PostType, string> = {
  shot: Shot,
  'shot-set': ShotSet,
  clip: Clip,
  wallpaper: Wallpaper,
  'wallpaper-v': WallpaperV,
  redrawing: Redrawing,
  video: Video,
};

export interface PostTypeGlyphProps {
  type: PostType;
}

export const PostTypeGlyph: Component<PostTypeGlyphProps> = (props) => {
  return <img src={glyphs[props.type]} alt={postTypeDescriptors[props.type].title} />;
};
