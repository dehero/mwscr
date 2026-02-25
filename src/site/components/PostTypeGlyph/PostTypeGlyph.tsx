import type { Component } from 'solid-js';
import { type PostType, postTypeDescriptors } from '../../../core/entities/post.js';
import Achievement from '../../images/post-type-achievement.svg';
import Clip from '../../images/post-type-clip.svg';
import Compilation from '../../images/post-type-compilation.svg';
import Mention from '../../images/post-type-mention.svg';
import News from '../../images/post-type-news.svg';
import Outtakes from '../../images/post-type-outtakes.svg';
import Photoshop from '../../images/post-type-photoshop.svg';
import Redrawing from '../../images/post-type-redrawing.svg';
import Shot from '../../images/post-type-shot.svg';
import Video from '../../images/post-type-video.svg';
import Wallpaper from '../../images/post-type-wallpaper.svg';

const glyphs: Record<PostType, string> = {
  shot: Shot,
  compilation: Compilation,
  clip: Clip,
  wallpaper: Wallpaper,
  redrawing: Redrawing,
  video: Video,
  mention: Mention,
  news: News,
  photoshop: Photoshop,
  outtakes: Outtakes,
  achievement: Achievement,
  // TODO: make glyph for merch
  merch: Achievement,
};

export interface PostTypeGlyphProps {
  type: PostType;
}

export const PostTypeGlyph: Component<PostTypeGlyphProps> = (props) => {
  return <img src={glyphs[props.type]} alt={postTypeDescriptors[props.type].title} />;
};
