// import { POST_RECENTLY_PUBLISHED_DAYS } from '../entities/post.js';
import type { PostCandidateRule } from '../rules/post-candidate-rules.js';
import {
  needMaxMarkDistance,
  needMinAuthorDistance,
  needMinContentDistance,
  needMinMarkDistance,
  needMinRelatedLocationDistance,
  needMinThirdPartyDistance,
  needMinTypeDistance,
} from '../rules/post-candidate-rules.js';
import { needCertainType } from '../rules/post-rules.js';
import type { PostingRule } from '../rules/posting-rules.js';
import { afterHour, lastPostedDaysAgo, lastPublishedHoursAgo } from '../rules/posting-rules.js';

export type PostingScenario = [title: string, postingRules: PostingRule[], postCandidateRules: PostCandidateRule[]];

// const redrawing: PostingScenario = [
//   'redrawing',
//   [afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
//   [needCertainType('redrawing'), needMinTypeDistance(14), needMinContentDistance(POST_RECENTLY_PUBLISHED_DAYS)],
// ];

const shotSet: PostingScenario = [
  'shot-set',
  [afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
  [needCertainType('shot-set'), needMinTypeDistance(7), needMinContentDistance(91), needMinThirdPartyDistance(7)],
];

const shot: PostingScenario = [
  'shot',
  [afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
  [
    needCertainType('shot'),
    needMinMarkDistance('C', 14),
    needMinMarkDistance('B2', 4),
    needMinMarkDistance('A2', 1),
    needMaxMarkDistance('A2', 7),
    needMinMarkDistance('A1', 7),
    needMaxMarkDistance('A1', 21),
    needMinAuthorDistance(1),
    needMinContentDistance(365),
    needMinRelatedLocationDistance(2),
    needMinThirdPartyDistance(7),
  ],
];

const wallpaper: PostingScenario = [
  'wallpaper',
  [afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
  [
    needCertainType('wallpaper', 'wallpaper-v'),
    needMinTypeDistance(7),
    needMinContentDistance(365),
    needMinThirdPartyDistance(7),
  ],
];

export const postingScenarios: PostingScenario[] = [
  wallpaper, //redrawing,
  shotSet,
  shot,
];
