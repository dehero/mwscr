import type { PostType } from '../entities/post.js';
import type { MediaRule } from '../rules/media-rules.js';
import { needAspectRatio, needMinHeight, needMinWidth } from '../rules/media-rules.js';
import type { ResourceRule } from '../rules/resource-rules.js';
import { needCertainMimeType, needMaxSize, needMinSize } from '../rules/resource-rules.js';

export type ValidatingScenario = [PostType, ResourceRule[], MediaRule[]];

const imageResourceRules: ResourceRule[] = [
  needCertainMimeType(['image/png']),
  needMinSize(1),
  needMaxSize(5 * 1024 * 1024),
];

const shotMediaRules: MediaRule[] = [needAspectRatio('1/1'), needMinWidth(800), needMinHeight(800)];

const videoResourceRules: ResourceRule[] = [
  needCertainMimeType(['video/mp4', 'video/x-msvideo']),
  needMinSize(1),
  needMaxSize(100 * 1024 * 1024),
];

// TODO: use validations before posting or on data validation
// TODO: handle multiple aspect ratios for post type
export const validatingScenarios: Array<ValidatingScenario> = [
  ['shot', imageResourceRules, shotMediaRules],
  ['compilation', imageResourceRules, shotMediaRules],
  ['redrawing', imageResourceRules, shotMediaRules],
  ['clip', videoResourceRules, [needAspectRatio('1/1'), needMinWidth(1080), needMinHeight(1080)]],
  ['video', videoResourceRules, [needAspectRatio('16/9'), needMinWidth(1920), needMinHeight(1080)]],
  ['wallpaper', imageResourceRules, [needAspectRatio('16/9'), needMinWidth(1920), needMinHeight(1080)]],
  // ['wallpaper-v', imageResourceRules, [needAspectRatio('9/19.5'), needMinWidth(1080), needMinHeight(2340)]],
];
