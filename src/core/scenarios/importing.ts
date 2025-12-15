import type { ResourceType } from '../entities/resource.js';
import type { MediaRule } from '../rules/media-rules.js';
import { needMinHeight, needMinWidth } from '../rules/media-rules.js';
import type { ResourceRule } from '../rules/resource-rules.js';
import { needCertainMimeType, needMaxSize, needMinSize } from '../rules/resource-rules.js';

export type ImportingScenario = [resourceType: ResourceType, resourceRoules: ResourceRule[], mediaRules: MediaRule[]];

export const importingScenarios: Array<ImportingScenario> = [
  [
    'image',
    [needCertainMimeType(['image/png']), needMinSize(1), needMaxSize(10 * 1024 * 1024)],
    [needMinWidth(800), needMinHeight(800)],
  ],
  [
    'video',
    [needCertainMimeType(['video/mp4', 'video/x-msvideo']), needMinSize(1), needMaxSize(200 * 1024 * 1024)],
    [needMinWidth(1080), needMinHeight(1080)],
  ],
  [
    'archive',
    [
      needCertainMimeType(['application/zip', 'application/x-zip-compressed']),
      needMinSize(1),
      needMaxSize(100 * 1024 * 1024),
    ],
    [],
  ],
];
